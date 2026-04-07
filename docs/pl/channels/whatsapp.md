---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routowaniem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-07T09:44:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2ce84d869ace6c0bebd9ec17bdbbef997a5c31e5da410b02a19a0f103f7359
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (kanał Web)

Status: gotowy do użytku produkcyjnego przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  przy pierwszym wyborze proponują instalację pluginu WhatsApp.
- `openclaw channels login --channel whatsapp` także oferuje przepływ instalacji, gdy
  plugin nie jest jeszcze obecny.
- Kanał dev + checkout git: domyślnie używa lokalnej ścieżki pluginu.
- Stable/Beta: domyślnie używa pakietu npm `@openclaw/whatsapp`.

Instalacja ręczna pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM to parowanie dla nieznanych nadawców.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
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
OpenClaw zaleca, aby w miarę możliwości uruchamiać WhatsApp na oddzielnym numerze. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taki wariant, ale konfiguracje z numerem osobistym są również obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - oddzielna tożsamość WhatsApp dla OpenClaw
    - wyraźniejsze listy dozwolonych DM i granice routowania
    - mniejsze ryzyko niejasności związanych z czatem z samym sobą

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

  <Accordion title="Awaryjnie: numer osobisty">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną dla czatu z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko dla WhatsApp Web">
    Kanał platformy wiadomości jest oparty na WhatsApp Web (`Baileys`) w obecnej architekturze kanałów OpenClaw.

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału wiadomości Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Wiadomości wychodzące wymagają aktywnego nasłuchującego procesu WhatsApp dla docelowego konta.
- Czaty statusu i broadcast są ignorowane (`@status`, `@broadcast`).
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślnie `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) mają pierwszeństwo nad domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w channel allow-store i scalane ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano żadnej allowlisty, połączony własny numer jest domyślnie dozwolony
    - wychodzące DM `fromMe` nigdy nie są automatycznie parowane

  </Tab>

  <Tab title="Polityka grup + allowlisty">
    Dostęp do grup ma dwie warstwy:

    1. **Allowlista członkostwa grupowego** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, kwalifikują się wszystkie grupy
       - jeśli `groups` jest obecne, działa jako allowlista grup (`"*"` jest dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlista nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuje cały ruch przychodzący z grup

    Zachowanie zapasowe allowlisty nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, środowisko wykonawcze używa `allowFrom`, gdy jest dostępne
    - allowlisty nadawców są sprawdzane przed aktywacją wzmianką/odpowiedzią

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, zapasowa polityka grup w czasie działania to `allowlist` (z ostrzeżeniem w logach), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko warunek bramki wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza allowlisty nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z allowlisty

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie globalną konfigurację). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru osobistego i czatu z samym sobą

Gdy połączony własny numer jest również obecny w `allowFrom`, aktywują się zabezpieczenia WhatsApp dla czatu z samym sobą:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania auto-trigger na JID wzmianki, które w przeciwnym razie powodowałoby wzmiankę o samym sobie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` lub `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta przychodząca + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we współdzieloną kopertę wejściową.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej postaci:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).

  </Accordion>

  <Accordion title="Symbole zastępcze mediów oraz ekstrakcja lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające wyłącznie media są normalizowane z użyciem symboli zastępczych takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ładunki lokalizacji i kontaktów są normalizowane do kontekstu tekstowego przed routowaniem.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    Dla grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie ostatecznie wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - wartość zapasowa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Znaczniki wstrzykiwania:

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

## Dostarczanie, dzielenie i media

<AccordionGroup>
  <Accordion title="Dzielenie tekstu">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste linie), a następnie wraca do bezpiecznego dzielenia według długości
  </Accordion>

  <Accordion title="Zachowanie mediów wychodzących">
    - obsługuje ładunki obrazów, wideo, audio (notatka głosowa PTT) i dokumentów
    - `audio/ogg` jest przepisywane na `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu mediów przy wysyłaniu ładunków odpowiedzi z wieloma mediami
    - źródło mediów może być HTTP(S), `file://` lub ścieżkami lokalnymi
  </Accordion>

  <Accordion title="Limity rozmiaru mediów i zachowanie awaryjne">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania per konto używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przebieg jakości), aby zmieścić się w limitach
    - przy błędzie wysyłki mediów awaryjny mechanizm dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast cicho porzucać odpowiedź
  </Accordion>
</AccordionGroup>

## Poziom reakcji

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom        | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | ---------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie                    | Nie                             | Brak jakichkolwiek reakcji                       |
| `"ack"`       | Tak                    | Nie                             | Tylko reakcje potwierdzające (odbiór przed odpowiedzią) |
| `"minimal"`   | Tak                    | Tak (zachowawczo)               | Potwierdzenia + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak                    | Tak (zalecane)                  | Potwierdzenia + reakcje agenta z zalecanymi wskazówkami   |

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

Uwagi dotyczące zachowania:

- wysyłane natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią)
- błędy są logowane, ale nie blokują normalnego dostarczenia odpowiedzi
- tryb grupowy `mentions` reaguje przy turach wyzwalanych wzmianką; aktywacja grupowa `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są wewnętrznie normalizowane do wyszukiwania
  </Accordion>

  <Accordion title="Ścieżki poświadczeń i zgodność wsteczna">
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
- Bramy akcji:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone (wyłącz przez `channels.whatsapp.configWrites=false`).

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Niepołączone (wymagany QR)">
    Objaw: status kanału pokazuje brak połączenia.

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

  <Accordion title="Brak aktywnego nasłuchującego procesu przy wysyłaniu">
    Wiadomości wychodzące kończą się szybkim błędem, gdy nie istnieje aktywny nasłuchujący proces gateway dla docelowego konta.

    Upewnij się, że gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy allowlisty `groups`
    - bramkę wzmianki (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj jedno `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska Bun">
    Środowisko uruchomieniowe gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niekompatybilny ze stabilnym działaniem gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Wskaźniki do dokumentacji konfiguracji

Podstawowe odniesienie:

- [Dokumentacja konfiguracji - WhatsApp](/pl/gateway/configuration-reference#whatsapp)

Najważniejsze pola WhatsApp:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routowanie kanałów](/pl/channels/channel-routing)
- [Routowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
