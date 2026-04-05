---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T13:47:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (kanał Web)

Status: gotowy do użycia produkcyjnego przez WhatsApp Web (Baileys). Brama zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  przy pierwszym wybraniu kanału proponują instalację pluginu WhatsApp.
- `openclaw channels login --channel whatsapp` także oferuje przepływ instalacji, gdy
  plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki pluginu.
- Stable/Beta: domyślnie używa pakietu npm `@openclaw/whatsapp`.

Instalacja ręczna nadal jest dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM dla nieznanych nadawców to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Konfiguracja bramy" icon="settings" href="/gateway/configuration">
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

  <Step title="Uruchom bramę">

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
OpenClaw zaleca, jeśli to możliwe, uruchamianie WhatsApp na osobnym numerze. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taki układ, ale konfiguracje z numerem osobistym również są obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Osobny numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - wyraźniejsze listy dozwolonych DM i granice routingu
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

  <Accordion title="Tryb awaryjny z numerem osobistym">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną czatowi z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy wiadomości w bieżącej architekturze kanałów OpenClaw jest oparty na WhatsApp Web (`Baileys`).

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału wiadomości WhatsApp przez Twilio.

  </Accordion>
</AccordionGroup>

## Model działania

- Brama zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Wysyłanie wychodzące wymaga aktywnego nasłuchu WhatsApp dla docelowego konta.
- Czaty statusów i rozgłoszeniowe są ignorowane (`@status`, `@broadcast`).
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) ma pierwszeństwo przed domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w magazynie list dozwolonych kanału i łączone ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano żadnej listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - wychodzące DM `fromMe` nigdy nie są automatycznie parowane

  </Tab>

  <Tab title="Polityka grup + listy dozwolonych">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonych członkostwa grupowego** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, wszystkie grupy kwalifikują się
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` jest dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuj cały ruch przychodzący z grup

    Zapasowe zachowanie listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, środowisko wykonawcze używa `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, zapasowa polityka grup w czasie działania to `allowlist` (z ostrzeżeniem w logu), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex dla wzmianek (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko warunek bramkowania wzmianek; **nie** nadaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie globalną konfigurację). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Numer osobisty i zachowanie czatu z samym sobą

Gdy połączony własny numer jest również obecny w `allowFrom`, aktywują się zabezpieczenia czatu z samym sobą w WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania automatycznego wyzwalania mention-JID, które w przeciwnym razie pingowałoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` lub `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta przychodząca + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we wspólną kopertę wejściową.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej postaci:

    ```text
    [Odpowiedź na <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Odpowiedź]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, nadawca JID/E.164).

  </Accordion>

  <Accordion title="Symbole zastępcze multimediów i wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko multimedia są normalizowane za pomocą symboli zastępczych, takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ładunki lokalizacji i kontaktów są normalizowane do kontekstu tekstowego przed routingiem.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W przypadku grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - zapasowo: `messages.groupChat.historyLimit`
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

    Tury czatu z samym sobą pomijają potwierdzenia odczytu nawet wtedy, gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie wraca do bezpiecznego dzielenia według długości
  </Accordion>

  <Accordion title="Zachowanie mediów wychodzących">
    - obsługuje ładunki obrazów, wideo, audio (głosowe PTT) i dokumentów
    - `audio/ogg` jest przepisywane na `audio/ogg; codecs=opus` dla zgodności z wiadomościami głosowymi
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego podczas wysyłania odpowiedzi wielomediowych
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżka lokalna
  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie zapasowe">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przebieg jakości), aby zmieścić się w limitach
    - przy błędzie wysyłania mediów zapasowy mechanizm dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast cicho porzucać odpowiedź
  </Accordion>
</AccordionGroup>

## Poziom reakcji

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom         | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                             |
| -------------- | ---------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`        | Nie                    | Nie                             | Brak jakichkolwiek reakcji                       |
| `"ack"`        | Tak                    | Nie                             | Tylko reakcje potwierdzające (potwierdzenie przed odpowiedzią) |
| `"minimal"`    | Tak                    | Tak (zachowawczo)               | Potwierdzenie + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"`  | Tak                    | Tak (zalecane)                  | Potwierdzenie + reakcje agenta z zalecanymi wskazówkami |

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

## Reakcje potwierdzające

WhatsApp obsługuje natychmiastowe reakcje potwierdzające po odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje potwierdzające są kontrolowane przez `reactionLevel` — są wyciszane, gdy `reactionLevel` to `"off"`.

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
- tryb grupowy `mentions` reaguje przy turach wyzwolonych wzmianką; aktywacja grupowa `always` działa jako obejście tego sprawdzenia
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
    - starsze domyślne uwierzytelnianie w `~/.openclaw/credentials/` jest nadal rozpoznawane/migrowane dla przepływów domyślnego konta
  </Accordion>

  <Accordion title="Zachowanie wylogowania">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelniania WhatsApp dla tego konta.

    W starszych katalogach uwierzytelniania `oauth.json` jest zachowywany, podczas gdy pliki uwierzytelniania Baileys są usuwane.

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
  <Accordion title="Niepołączony (wymagany QR)">
    Objaw: status kanału zgłasza brak połączenia.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączony, ale rozłączony / pętla ponownego łączenia">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Naprawa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    W razie potrzeby połącz ponownie przez `channels login`.

  </Accordion>

  <Accordion title="Brak aktywnego nasłuchu podczas wysyłania">
    Wysyłanie wychodzące szybko kończy się błędem, gdy dla docelowego konta nie istnieje aktywny nasłuch bramy.

    Upewnij się, że brama działa i konto jest połączone.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmianek (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj tylko jedno `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska Bun">
    Środowisko działania bramy WhatsApp powinno używać Node. Bun jest oznaczony jako niekompatybilny ze stabilnym działaniem bramy WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Wskaźniki dokumentacji konfiguracji

Podstawowa dokumentacja:

- [Dokumentacja konfiguracji - WhatsApp](/gateway/configuration-reference#whatsapp)

Pola WhatsApp o wysokim znaczeniu:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Powiązane

- [Pairing](/pl/channels/pairing)
- [Groups](/pl/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/pl/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
