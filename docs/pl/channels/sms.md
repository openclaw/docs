---
read_when:
    - Chcesz połączyć OpenClaw z SMS przez Twilio
    - Potrzebujesz konfiguracji Webhooka SMS lub listy dozwolonych
summary: Konfiguracja kanału SMS Twilio, kontrola dostępu i konfiguracja webhooka
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:14:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw może odbierać i wysyłać SMS-y przez numer telefonu Twilio lub Messaging Service. Gateway rejestruje przychodzącą trasę webhook, domyślnie weryfikuje podpisy żądań Twilio i odsyła odpowiedzi przez Twilio Messages API.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka wiadomości prywatnych dla SMS to parowanie.
  </Card>
  <Card title="Bezpieczeństwo Gateway" icon="shield" href="/pl/gateway/security">
    Sprawdź ekspozycję webhook i kontrolę dostępu nadawców.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
</CardGroup>

## Zanim zaczniesz

Potrzebujesz:

- Oficjalnego Plugin SMS zainstalowanego za pomocą `openclaw plugins install @openclaw/sms`.
- Konta Twilio z numerem telefonu obsługującym SMS albo Twilio Messaging Service.
- Twilio Account SID i Auth Token.
- Publicznego adresu URL HTTPS, który prowadzi do Twojego OpenClaw Gateway.
- Wyboru polityki nadawców: `pairing` do użytku prywatnego, `allowlist` dla wcześniej zatwierdzonych numerów telefonu albo `open` tylko dla celowo publicznego dostępu SMS.

Użyj jednego numeru Twilio zarówno dla SMS, jak i połączeń głosowych, jeśli numer ma obie możliwości. Skonfiguruj webhook SMS i webhook głosowy osobno w Twilio; ta strona obejmuje tylko webhook SMS.

## Szybka konfiguracja

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Utwórz lub wybierz nadawcę Twilio">
    W Twilio otwórz **Numery telefonu > Zarządzaj > Aktywne numery** i wybierz numer obsługujący SMS. Zapisz:

    - Account SID, na przykład `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Numer telefonu nadawcy, na przykład `+15551234567`

    Jeśli używasz Messaging Service zamiast stałego numeru nadawcy, zapisz SID Messaging Service, na przykład `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Skonfiguruj kanał SMS">

Zapisz to jako `sms.patch.json5` i zmień symbole zastępcze:

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

Zastosuj go:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Skieruj Twilio na webhook Gateway">
    W ustawieniach numeru telefonu Twilio otwórz **Wiadomości** i ustaw **Gdy przychodzi wiadomość** na:

```text
https://gateway.example.com/webhooks/sms
```

    Użyj HTTP `POST`. Domyślna ścieżka lokalna to `/webhooks/sms`; zmień `channels.sms.webhookPath`, jeśli potrzebujesz innej trasy.

  </Step>

  <Step title="Udostępnij dokładną ścieżkę webhook SMS">
    Twój publiczny adres URL musi kierować ścieżkę SMS do procesu Gateway. Jeśli używasz Tailscale Funnel do testów lokalnych, jawnie udostępnij `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Połączenia głosowe i SMS używają oddzielnych ścieżek webhook. Jeśli ten sam numer Twilio obsługuje oba, zachowaj obie trasy skonfigurowane w Twilio i w swoim tunelu.

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

### Plik konfiguracyjny

Użyj konfiguracji przez plik konfiguracyjny, gdy chcesz, aby definicja kanału była przenoszona razem z konfiguracją Gateway:

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

Użyj konfiguracji przez zmienne środowiskowe dla wdrożeń z jednym kontem, w których sekrety pochodzą ze środowiska hosta:

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

`TWILIO_SMS_FROM` jest akceptowane jako alias dla `TWILIO_PHONE_NUMBER`. Użyj `TWILIO_MESSAGING_SERVICE_SID` zamiast nadawcy w postaci numeru telefonu, gdy Twilio ma wybrać nadawcę z Messaging Service.

### Token uwierzytelniający SecretRef

`authToken` może być SecretRef. Użyj tego, gdy Gateway ma rozwiązywać Twilio Auth Token z runtime sekretów OpenClaw zamiast przechowywać konfigurację w postaci zwykłego tekstu:

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

Odwoływana zmienna środowiskowa lub dostawca sekretów musi być widoczny dla runtime Gateway. Uruchom ponownie zarządzane procesy Gateway po zmianie zmiennych środowiskowych hosta.

### Prywatny numer tylko z listą dozwolonych

Użyj `allowlist`, gdy tylko znane numery telefonów powinny móc rozmawiać z agentem:

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

### Nadawca Messaging Service

Użyj `messagingServiceSid` zamiast `fromNumber`, gdy Twilio ma wybrać nadawcę przez Messaging Service:

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

Jeśli po rozwiązaniu konfiguracji i zmiennych środowiskowych obecne są zarówno `fromNumber`, jak i `messagingServiceSid`, używane jest `fromNumber`.

### Domyślny cel wychodzący

Ustaw `defaultTo`, gdy automatyzacja lub dostarczanie inicjowane przez agenta powinno mieć domyślne miejsce docelowe, jeśli przepływ wysyłania pomija jawny cel:

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

`channels.sms.dmPolicy` kontroluje bezpośredni dostęp SMS:

- `pairing` (domyślnie)
- `allowlist` (wymaga co najmniej jednego nadawcy w `allowFrom`)
- `open` (wymaga, aby `allowFrom` zawierało `"*"`)
- `disabled`

Wpisy `allowFrom` powinny być numerami telefonu E.164, takimi jak `+15551234567`. Prefiksy `sms:` są akceptowane i normalizowane. Dla prywatnego asystenta preferuj `dmPolicy: "allowlist"` z jawnymi numerami telefonu.

## Wysyłanie SMS

Wychodzące cele SMS używają prefiksu usługi `sms:` z wybranym kanałem SMS:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Gdy wybór kanału jest niejawny, `twilio-sms:+15551234567` wybiera ten kanał bez przejmowania istniejącego prefiksu usługi `sms:` należącego do kanału, używanego przez iMessage.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI wymaga jawnego `--target`. `defaultTo` jest przeznaczone dla automatyzacji i ścieżek dostarczania inicjowanych przez agenta, w których cel można rozwiązać z konfiguracji kanału.

Odpowiedzi agenta z przychodzących konwersacji SMS automatycznie wracają do nadawcy przez skonfigurowanego nadawcę Twilio.

Wyjście SMS to zwykły tekst. OpenClaw usuwa markdown, spłaszcza ogrodzone bloki kodu, zachowuje czytelne linki i dzieli długie odpowiedzi na części przed wysłaniem ich przez Twilio.

## Weryfikacja konfiguracji

Po uruchomieniu Gateway:

1. Potwierdź, że log Gateway pokazuje trasę webhook SMS.
2. Uruchom sondę po stronie Twilio:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Wyślij SMS na numer Twilio ze swojego telefonu.
4. Uruchom `openclaw pairing list sms`.
5. Zatwierdź kod parowania za pomocą `openclaw pairing approve sms <CODE>`.
6. Wyślij kolejnego SMS-a i potwierdź, że agent odpowiada.

Do testowania tylko wysyłania użyj:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Test end-to-end z macOS iMessage/SMS

Na Macu, który może wysyłać SMS-y operatora przez Wiadomości, możesz użyć `imsg`, aby obsłużyć stronę nadawcy bez dotykania telefonu:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Pierwsza wiadomość powinna utworzyć żądanie parowania. Druga wiadomość powinna otrzymać odpowiedź agenta przez Twilio.

## Bezpieczeństwo webhook

Domyślnie OpenClaw weryfikuje `X-Twilio-Signature` przy użyciu `publicWebhookUrl` i `authToken`. Zachowaj `publicWebhookUrl` zgodny bajt po bajcie z adresem URL skonfigurowanym w Twilio, w tym schemat, host, ścieżkę i ciąg zapytania.

Tylko do testów lokalnego tunelu możesz ustawić:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Nie używaj wyłączonej walidacji podpisu na publicznym Gateway.

## Konfiguracja wielu kont

Użyj `accounts`, gdy obsługujesz więcej niż jeden numer Twilio:

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

Każde konto powinno używać odrębnego `webhookPath`.

## Rozwiązywanie problemów

### Twilio zwraca 403 albo OpenClaw odrzuca webhook

Sprawdź, czy `publicWebhookUrl` dokładnie odpowiada adresowi URL skonfigurowanemu w Twilio, w tym schematowi, hostowi, ścieżce i ciągowi zapytania. Twilio podpisuje publiczny ciąg URL, więc przepisywanie przez proxy i alternatywne nazwy hostów mogą przerwać walidację podpisu.

### Nie pojawia się żądanie parowania

Sprawdź adres URL i metodę webhook **Wiadomości** numeru Twilio. Musi wskazywać adres URL webhook SMS i używać `POST`. Potwierdź także, że Gateway jest osiągalny z publicznego internetu albo przez Twój tunel.

Jeśli log wiadomości Twilio pokazuje błąd `11200`, Twilio zaakceptowało przychodzący SMS, ale nie mogło połączyć się z Twoim webhook. Sprawdź:

- Twilio **Wiadomości > Gdy przychodzi wiadomość** wskazuje `publicWebhookUrl`.
- Metoda to `POST`.
- Tunel lub odwrotny serwer proxy udostępnia dokładny `webhookPath`; dla Tailscale Funnel uruchom `tailscale funnel status` i potwierdź, że `/webhooks/sms` jest na liście.
- `publicWebhookUrl` używa tego samego schematu, hosta, ścieżki i ciągu zapytania, które wysyła Twilio, aby walidacja podpisu mogła odtworzyć podpisany adres URL.

### Wysyłki wychodzące kończą się niepowodzeniem

Potwierdź, że `accountSid`, `authToken` oraz `fromNumber` albo `messagingServiceSid` są rozwiązane. Jeśli używasz próbnego konta Twilio, numer docelowy może wymagać weryfikacji w Twilio, zanim wychodzący SMS zostanie wysłany.

### Wiadomości przychodzą, ale agent nie odpowiada

Sprawdź `dmPolicy` i `allowFrom`. Przy domyślnej polityce `pairing` nadawca musi zostać zatwierdzony, zanim zwykłe tury agenta zostaną przetworzone.
