---
read_when:
    - Chcesz połączyć OpenClaw z SMS-ami przez Twilio
    - Potrzebna jest konfiguracja Webhooka SMS lub listy dozwolonych nadawców
summary: Konfiguracja kanału SMS Twilio, kontrola dostępu i konfiguracja webhooka
title: SMS
x-i18n:
    generated_at: "2026-07-16T18:07:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw odbiera i wysyła SMS-y za pośrednictwem numeru telefonu Twilio lub usługi Messaging Service. Gateway rejestruje trasę przychodzącego webhooka (domyślnie `/webhooks/sms`), domyślnie weryfikuje podpisy żądań Twilio i odsyła odpowiedzi za pośrednictwem interfejsu Messages API Twilio.

Status: oficjalny Plugin, instalowany oddzielnie. Tylko tekst: bez MMS-ów/multimediów, wyłącznie wiadomości bezpośrednie.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą wiadomości bezpośrednich dla SMS-ów jest parowanie.
  </Card>
  <Card title="Bezpieczeństwo Gateway" icon="shield" href="/pl/gateway/security">
    Przegląd udostępniania webhooka i mechanizmów kontroli dostępu nadawców.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
</CardGroup>

## Przed rozpoczęciem

Potrzebne są:

- Oficjalny Plugin SMS zainstalowany za pomocą `openclaw plugins install @openclaw/sms`.
- Konto Twilio z numerem telefonu obsługującym SMS-y lub usługa Twilio Messaging Service.
- Identyfikator SID konta Twilio i token uwierzytelniający.
- Publiczny adres URL HTTPS prowadzący do Gateway OpenClaw.
- Wybór zasady dotyczącej nadawców: `pairing` (domyślnie) do użytku prywatnego, `allowlist` dla wstępnie zatwierdzonych numerów telefonów albo `open` wyłącznie w przypadku celowo publicznego dostępu przez SMS.

Jeden numer Twilio może obsługiwać zarówno SMS-y, jak i [połączenia głosowe](/pl/plugins/voice-call), jeśli oferuje obie funkcje. Webhook SMS i webhook połączeń głosowych konfiguruje się w Twilio oddzielnie i używają one osobnych ścieżek Gateway; ta strona dotyczy wyłącznie webhooka SMS.

## Szybka konfiguracja

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Utwórz lub wybierz nadawcę Twilio">
    W Twilio otwórz **Phone Numbers > Manage > Active numbers** i wybierz numer obsługujący SMS-y. Zapisz:

    - Identyfikator SID konta, na przykład `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Token uwierzytelniający
    - Numer telefonu nadawcy, na przykład `+15551234567`

    Jeśli zamiast stałego numeru nadawcy używana jest usługa Messaging Service, zapisz jej identyfikator SID, na przykład `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Skonfiguruj kanał SMS">

Zapisz poniższą zawartość jako `sms.patch.json5` i zmień symbole zastępcze:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Zastosuj ją:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Skieruj Twilio do webhooka Gateway">
    W ustawieniach numeru telefonu Twilio otwórz **Messaging** i ustaw **A message comes in** na:

```text
https://gateway.example.com/webhooks/sms
```

    Użyj metody HTTP `POST`. Domyślna ścieżka lokalna to `/webhooks/sms`; zmień `channels.sms.webhookPath`, jeśli potrzebna jest inna trasa.

  </Step>

  <Step title="Udostępnij dokładną ścieżkę webhooka SMS">
    Publiczny adres URL musi kierować ścieżkę SMS do procesu Gateway (domyślny port `18789`). Jeśli do testów lokalnych używany jest Tailscale Funnel, jawnie udostępnij `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Połączenia głosowe i SMS-y używają osobnych ścieżek webhooków. Jeśli ten sam numer Twilio obsługuje oba rodzaje komunikacji, zachowaj konfigurację obu tras w Twilio oraz w tunelu.

  </Step>

  <Step title="Uruchom Gateway i zatwierdź pierwszego nadawcę">

```bash
openclaw gateway
```

Wyślij wiadomość tekstową na numer Twilio. Pierwsza wiadomość tworzy żądanie parowania. Zatwierdź je:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>
</Steps>

## Przykłady konfiguracji

Wszystkie klucze znajdują się w sekcji `channels.sms` (a dla poszczególnych kont w sekcji `channels.sms.accounts.<id>`):

| Klucz                                   | Wartość domyślna | Przeznaczenie                                                       |
| --------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `enabled`                     | `true` | Włączenie lub wyłączenie kanału/konta.                              |
| `accountSid`                     | —                | Identyfikator SID konta Twilio (`AC...`).                |
| `authToken`                     | —                | Token uwierzytelniający Twilio; zwykły ciąg tekstowy lub SecretRef. |
| `fromNumber`                     | —                | Numer nadawcy w formacie E.164.                                     |
| `messagingServiceSid`                     | —                | Identyfikator SID usługi Messaging Service (`MG...`) używany, gdy nie uda się rozstrzygnąć `fromNumber`. |
| `defaultTo`                     | —                | Domyślny odbiorca, gdy przepływ wysyłania nie określa jawnie celu.   |
| `webhookPath`                     | `/webhooks/sms` | Ścieżka HTTP Gateway dla przychodzących webhooków Twilio.           |
| `publicWebhookUrl`                     | —                | Publiczny adres URL skonfigurowany w Twilio; wymagany do weryfikacji podpisu. |
| `dangerouslyDisableSignatureValidation`                     | `false` | Pominięcie kontroli `X-Twilio-Signature`; wyłącznie do testów lokalnego tunelu. |
| `dmPolicy`                     | `"pairing"` | `pairing`, `allowlist`, `open` lub `disabled`. |
| `allowFrom`                     | `[]` | Dozwolone numery nadawców w formacie E.164 albo `"*"` z `dmPolicy: "open"`. |
| `textChunkLimit`                     | `1500` | Maksymalna liczba znaków w jednym fragmencie wychodzącej wiadomości SMS. |
| `accounts`, `defaultAccount` | —                | Mapa wielu kont i identyfikator konta domyślnego.                    |

### Plik konfiguracyjny

Konfiguracji za pomocą pliku należy użyć, gdy definicja kanału ma być przechowywana razem z konfiguracją Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Zmienne środowiskowe

Zmienne środowiskowe dotyczą wyłącznie konta domyślnego; wartości konfiguracji mają pierwszeństwo przed wartościami zmiennych środowiskowych.

| Zmienna                                         | Odpowiada                                         |
| ----------------------------------------------- | ------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                              | `accountSid`                                |
| `TWILIO_AUTH_TOKEN`                              | `authToken`                                |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`)  | `fromNumber`                                |
| `TWILIO_MESSAGING_SERVICE_SID`                              | `messagingServiceSid`                                |
| `SMS_PUBLIC_WEBHOOK_URL`                              | `publicWebhookUrl`                                |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                |
| `SMS_ALLOWED_USERS`                              | `allowFrom` (wartości rozdzielone przecinkami) |
| `SMS_TEXT_CHUNK_LIMIT`                              | `textChunkLimit`                                |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`                              | `dangerouslyDisableSignatureValidation` (`"true"`)           |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Następnie włącz kanał w konfiguracji:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Token uwierzytelniający SecretRef

`authToken` może być wartością SecretRef (`source: "env" | "file" | "exec"`). Należy użyć tego rozwiązania, gdy Gateway ma pobierać token uwierzytelniający Twilio ze środowiska wykonywania sekretów OpenClaw zamiast przechowywać go jako zwykły tekst w konfiguracji:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Wskazana zmienna środowiskowa lub dostawca sekretów musi być widoczny dla środowiska wykonywania Gateway. Po zmianie zmiennych środowiskowych hosta należy ponownie uruchomić zarządzane procesy Gateway.

### Nadawca Messaging Service

Użyj `messagingServiceSid` zamiast `fromNumber`, gdy Twilio ma wybierać nadawcę za pośrednictwem usługi Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Jeśli po rozstrzygnięciu konfiguracji i zmiennych środowiskowych obecne są zarówno `fromNumber`, jak i `messagingServiceSid`, używana jest wartość `fromNumber`.

### Domyślny cel wychodzący

Ustaw `defaultTo`, gdy automatyzacja lub dostarczanie inicjowane przez agenta powinny mieć domyślnego odbiorcę, jeśli przepływ wysyłania nie określa jawnie celu:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Kontrola dostępu

`channels.sms.dmPolicy` kontroluje bezpośredni dostęp przez SMS:

- `pairing` (domyślnie): nieznani nadawcy otrzymują kod parowania; zatwierdź go za pomocą `openclaw pairing approve sms <CODE>`.
- `allowlist`: przetwarzani są wyłącznie nadawcy wymienieni w `allowFrom`. Pusta wartość `allowFrom` odrzuca każdego nadawcę (Gateway rejestruje ostrzeżenie podczas uruchamiania).
- `open`: walidacja konfiguracji wymaga, aby `allowFrom` zawierało `"*"`. Bez symbolu wieloznacznego rozmawiać mogą wyłącznie wymienione numery.
- `disabled`: wszystkie przychodzące wiadomości bezpośrednie są odrzucane.

Wpisy `allowFrom` powinny być numerami telefonów w formacie E.164, takimi jak `+15551234567`. Prefiksy `sms:` i `twilio-sms:` są akceptowane i normalizowane. W przypadku prywatnego asystenta preferowana jest wartość `dmPolicy: "allowlist"` z jawnymi numerami telefonów:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Wysyłanie SMS-ów

Po wybraniu kanału SMS jako cele akceptowane są same numery w formacie E.164 lub numery z prefiksem `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Gdy wybór kanału jest niejawny, prefiks `twilio-sms:` wybiera ten kanał bez przejmowania prefiksu usługi `sms:`, którego iMessage używa do wyboru dostarczania SMS-ów przez operatora dla własnych celów:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI wymaga jawnej wartości `--target`. `defaultTo` służy do automatyzacji i ścieżek dostarczania inicjowanych przez agenta, w których cel może zostać ustalony na podstawie konfiguracji kanału.

Odpowiedzi agenta w przychodzących konwersacjach SMS są automatycznie odsyłane do nadawcy za pośrednictwem skonfigurowanego nadawcy Twilio.

Wiadomości wychodzące SMS są zwykłym tekstem. OpenClaw usuwa składnię Markdown, spłaszcza ogrodzone bloki kodu, przekształca łącza do postaci `label (url)` i przed wysłaniem przez Twilio dzieli długie odpowiedzi na fragmenty o długości najwyżej `textChunkLimit` znaków (domyślnie 1500).

## Weryfikacja konfiguracji

Po uruchomieniu Gateway:

1. Sprawdź, czy dziennik Gateway zawiera trasę Webhooka SMS.
2. Uruchom test po stronie Twilio (sprawdza skonfigurowany adres URL i metodę Webhooka Twilio oraz ostatnie błędy wiadomości przychodzących):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Wyślij SMS ze swojego telefonu na numer Twilio.
4. Uruchom `openclaw pairing list sms`.
5. Zatwierdź kod parowania za pomocą `openclaw pairing approve sms <CODE>`.
6. Wyślij kolejny SMS i sprawdź, czy agent odpowiada.

Do testowania wyłącznie wiadomości wychodzących użyj:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Kompleksowy test z macOS iMessage/SMS

Na Macu, który może wysyłać SMS-y operatora za pośrednictwem aplikacji Messages, można użyć `imsg` do obsługi strony nadawcy bez korzystania z telefonu:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Pierwsza wiadomość powinna utworzyć żądanie parowania. Druga wiadomość powinna otrzymać odpowiedź agenta za pośrednictwem Twilio.

## Bezpieczeństwo Webhooka

Domyślnie OpenClaw weryfikuje `X-Twilio-Signature` za pomocą `publicWebhookUrl` i `authToken`. Część adresu końcowego w `publicWebhookUrl` musi być identyczna bajt w bajt z adresem URL skonfigurowanym w Twilio, włącznie ze schematem, hostem, ścieżką i ciągiem zapytania. Zgodnie z wymaganiami Twilio OpenClaw wyklucza z obliczania podpisu fragmenty [nadpisywania połączenia](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) Twilio (`#...`).

Niezależnie od weryfikacji podpisu trasa Webhooka wymusza również:

- Wyłącznie `POST`.
- Limit nieudanych żądań wynoszący 300 żądań na minutę dla każdego konta SMS, trasy Webhooka i rozpoznanego adresu klienta. Wszystkie żądania są wliczane do tego limitu, ale kod HTTP 429 jest zwracany dopiero wtedy, gdy żądanie nie przejdzie analizy treści, weryfikacji Twilio lub dopasowania AccountSid.
- Limit wywołań zwrotnych przekazywanych do obsługi wynoszący 30 zaakceptowanych wywołań na minutę dla każdego konta SMS, trasy Webhooka i rozpoznanego adresu klienta po pomyślnym przejściu tych kontroli (powyżej tego limitu zwracany jest kod HTTP 429). Jeśli weryfikacja podpisu jest wyłączona, limit 30/min stanowi maksymalną liczbę nieuwierzytelnionych wywołań przekazywanych do obsługi.
- Adresy klientów są rozpoznawane zgodnie ze współdzielonymi regułami zaufanych serwerów proxy Gateway. Jeśli `gateway.trustedProxies` zawiera odwrotny serwer proxy przekazujący wywołania zwrotne Twilio, OpenClaw określa te limity na podstawie przekazanego adresu klienta; w przeciwnym razie używa bezpośredniego adresu gniazda.
- Wartość `AccountSid` w ładunku musi odpowiadać skonfigurowanej wartości `accountSid` (w przeciwnym razie zwracany jest kod HTTP 403).
- Powtórzone wartości `MessageSid` są deduplikowane przez 10 minut.
- Pamięć podręczna powtórzeń każdego konta SMS przechowuje maksymalnie 10,000 aktywnych identyfikatorów SID wiadomości. Gdy wszystkie miejsca są zajęte przez aktywne wpisy, nowe Webhooki dla tego konta są odrzucane z kodem HTTP 429 i nagłówkiem `Retry-After` aż do wygaśnięcia najstarszego wpisu.
- Treści żądań przekraczające 32 KB są odrzucane.

Twilio domyślnie nie ponawia żądań zakończonych kodem HTTP 429 ani nie dokumentuje obsługi `Retry-After`. Nadpisania połączenia `#rp=4xx` i `#rp=all` włączają ponawianie żądań zakończonych kodami 4xx, ale Twilio ogranicza całą transakcję ponawiania do 15 sekund, dlatego ponawianie może zakończyć się przed wygaśnięciem miejsca w pamięci podręcznej powtórzeń. Skonfiguruj zapasowy adres URL, jeśli inny moduł obsługi musi otrzymywać niedostarczone wiadomości; kod 429 należy traktować jako odrzucenie zgodne z zasadą fail-closed, a nie jako niezawodny mechanizm kontroli napływu danych.

Wyłącznie na potrzeby testowania tunelu lokalnego można ustawić:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Nie używaj wyłączonej weryfikacji podpisu w publicznie dostępnym Gateway.

## Konfiguracja wielu kont

Użyj `accounts`, jeśli obsługujesz więcej niż jeden numer Twilio:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Każde konto musi używać odrębnej wartości `webhookPath`; Gateway odmawia zarejestrowania trasy Webhooka, której ścieżka należy już do innego konta. Zastępcze wartości środowiskowe `TWILIO_*`/`SMS_*` mają zastosowanie wyłącznie do konta domyślnego; ustaw `defaultAccount`, aby wskazać inne konto domyślne.

## Rozwiązywanie problemów

### Twilio zwraca kod 403 lub OpenClaw odrzuca Webhook

Sprawdź, czy `publicWebhookUrl` dokładnie odpowiada adresowi URL skonfigurowanemu w Twilio, włącznie ze schematem, hostem, ścieżką i ciągiem zapytania. Twilio podpisuje ciąg publicznego adresu URL, dlatego modyfikacje wykonywane przez serwer proxy i alternatywne nazwy hostów mogą uniemożliwić weryfikację podpisu.

Kod 403 z komunikatem `Invalid account` oznacza, że wartość `AccountSid` w ładunku przychodzącym nie odpowiada skonfigurowanej wartości `accountSid`; sprawdź, czy Webhook wskazuje konto będące właścicielem numeru.

### Żądanie parowania się nie pojawia

Sprawdź adres URL i metodę Webhooka **Messaging** numeru Twilio. Musi wskazywać adres URL Webhooka SMS i używać `POST`. Sprawdź również, czy Gateway jest dostępny z publicznego internetu lub przez tunel.

Jeśli dziennik wiadomości Twilio zawiera błąd `11200`, Twilio odebrało przychodzący SMS, ale nie mogło połączyć się z Webhookiem. Sprawdź:

- Pozycja Twilio **Messaging > A message comes in** wskazuje `publicWebhookUrl`.
- Metoda to `POST`.
- Tunel lub odwrotny serwer proxy udostępnia dokładnie `webhookPath`; w przypadku Tailscale Funnel uruchom `tailscale funnel status` i sprawdź, czy na liście znajduje się `/webhooks/sms`.
- `publicWebhookUrl` używa tego samego schematu, hosta, ścieżki i ciągu zapytania, które wysyła Twilio, aby weryfikacja podpisu mogła odtworzyć podpisany adres URL.

`openclaw channels status --channel sms --probe` pokazuje zarówno niezgodne ustawienia Webhooka Twilio, jak i ostatnie błędy `11200`.

### Wysyłanie wiadomości wychodzących nie działa

Sprawdź, czy rozpoznano wartości `accountSid`, `authToken` oraz `fromNumber` lub `messagingServiceSid`. W przypadku korzystania z próbnego konta Twilio przed wysłaniem wychodzącego SMS-u może być konieczne zweryfikowanie numeru docelowego w Twilio.

### Wiadomości przychodzą, ale agent nie odpowiada

Sprawdź `dmPolicy` i `allowFrom`. Przy domyślnej zasadzie `pairing` nadawca musi zostać zatwierdzony, zanim zostaną przetworzone zwykłe interakcje z agentem.
