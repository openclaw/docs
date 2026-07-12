---
read_when:
    - Chcesz połączyć OpenClaw z SMS-ami za pośrednictwem Twilio
    - Potrzebujesz konfiguracji webhooka SMS lub listy dozwolonych nadawców
summary: Konfiguracja kanału SMS Twilio, kontrola dostępu i konfiguracja webhooka
title: SMS
x-i18n:
    generated_at: "2026-07-12T14:54:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw odbiera i wysyła wiadomości SMS za pośrednictwem numeru telefonu Twilio lub usługi Messaging Service. Gateway rejestruje trasę przychodzącego Webhooka (domyślnie `/webhooks/sms`), domyślnie weryfikuje podpisy żądań Twilio i wysyła odpowiedzi za pośrednictwem interfejsu Messages API firmy Twilio.

Stan: oficjalny plugin, instalowany oddzielnie. Tylko tekst: bez MMS-ów i multimediów, wyłącznie wiadomości bezpośrednie.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą wiadomości bezpośrednich dla SMS-ów jest parowanie.
  </Card>
  <Card title="Bezpieczeństwo Gatewaya" icon="shield" href="/pl/gateway/security">
    Sprawdź publiczną dostępność Webhooka i mechanizmy kontroli dostępu nadawców.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Procedury diagnostyki i naprawy obejmujące różne kanały.
  </Card>
</CardGroup>

## Zanim zaczniesz

Potrzebujesz:

- Oficjalnego pluginu SMS zainstalowanego poleceniem `openclaw plugins install @openclaw/sms`.
- Konta Twilio z numerem telefonu obsługującym SMS-y lub usługi Twilio Messaging Service.
- Identyfikatora Account SID i tokenu Auth Token Twilio.
- Publicznego adresu URL HTTPS prowadzącego do Twojego Gatewaya OpenClaw.
- Wybranej zasady nadawców: `pairing` (domyślna) do użytku prywatnego, `allowlist` dla wstępnie zatwierdzonych numerów telefonów albo `open` wyłącznie w przypadku celowo publicznego dostępu przez SMS.

Jeden numer Twilio może obsługiwać zarówno SMS-y, jak i [połączenia głosowe](/pl/plugins/voice-call), jeśli ma obie funkcje. Webhook SMS i Webhook połączeń głosowych konfiguruje się w Twilio oddzielnie i używają one osobnych ścieżek Gatewaya; ta strona opisuje tylko Webhook SMS.

## Szybka konfiguracja

<Steps>
  <Step title="Zainstaluj plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Utwórz lub wybierz nadawcę Twilio">
    W Twilio otwórz **Phone Numbers > Manage > Active numbers** i wybierz numer obsługujący SMS-y. Zapisz:

    - Account SID, na przykład `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Numer telefonu nadawcy, na przykład `+15551234567`

    Jeśli zamiast stałego numeru nadawcy używasz usługi Messaging Service, zapisz jej identyfikator SID, na przykład `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Skonfiguruj kanał SMS">

Zapisz poniższą konfigurację jako `sms.patch.json5` i zmień symbole zastępcze:

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

  <Step title="Skieruj Twilio do Webhooka Gatewaya">
    W ustawieniach numeru telefonu Twilio otwórz **Messaging** i ustaw **A message comes in** na:

```text
https://gateway.example.com/webhooks/sms
```

    Użyj metody HTTP `POST`. Domyślna ścieżka lokalna to `/webhooks/sms`; zmień `channels.sms.webhookPath`, jeśli potrzebujesz innej trasy.

  </Step>

  <Step title="Udostępnij dokładną ścieżkę Webhooka SMS">
    Twój publiczny adres URL musi kierować ścieżkę SMS do procesu Gatewaya (domyślny port `18789`). Jeśli do testów lokalnych używasz Tailscale Funnel, jawnie udostępnij `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Połączenia głosowe i SMS-y używają oddzielnych ścieżek Webhooków. Jeśli ten sam numer Twilio obsługuje oba rodzaje komunikacji, zachowaj konfigurację obu tras w Twilio i w swoim tunelu.

  </Step>

  <Step title="Uruchom Gateway i zatwierdź pierwszego nadawcę">

```bash
openclaw gateway
```

Wyślij wiadomość tekstową na numer Twilio. Pierwsza wiadomość utworzy żądanie parowania. Zatwierdź je:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>
</Steps>

## Przykłady konfiguracji

Wszystkie klucze znajdują się w `channels.sms` (a dla poszczególnych kont w `channels.sms.accounts.<id>`):

| Klucz                                   | Wartość domyślna | Przeznaczenie                                                                 |
| --------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `enabled`                               | `true`           | Włącza lub wyłącza kanał albo konto.                                          |
| `accountSid`                            | —                | Account SID Twilio (`AC...`).                                                 |
| `authToken`                             | —                | Auth Token Twilio; zwykły ciąg tekstowy lub SecretRef.                        |
| `fromNumber`                            | —                | Numer nadawcy w formacie E.164.                                               |
| `messagingServiceSid`                   | —                | SID usługi Messaging Service (`MG...`) używany, gdy nie określono `fromNumber`. |
| `defaultTo`                             | —                | Domyślny odbiorca, gdy przepływ wysyłania nie określa jawnego celu.            |
| `webhookPath`                           | `/webhooks/sms`  | Ścieżka HTTP Gatewaya dla przychodzących Webhooków Twilio.                    |
| `publicWebhookUrl`                      | —                | Publiczny adres URL skonfigurowany w Twilio; wymagany do weryfikacji podpisu. |
| `dangerouslyDisableSignatureValidation` | `false`          | Pomija sprawdzanie `X-Twilio-Signature`; wyłącznie do testowania lokalnego tunelu. |
| `dmPolicy`                              | `"pairing"`      | `pairing`, `allowlist`, `open` lub `disabled`.                                |
| `allowFrom`                             | `[]`             | Dozwolone numery nadawców w formacie E.164 lub `"*"` z `dmPolicy: "open"`.    |
| `textChunkLimit`                        | `1500`           | Maksymalna liczba znaków w jednym fragmencie wychodzącej wiadomości SMS.       |
| `accounts`, `defaultAccount`            | —                | Mapa wielu kont i identyfikator konta domyślnego.                             |

### Plik konfiguracyjny

Użyj konfiguracji w pliku, jeśli definicja kanału ma być przechowywana razem z konfiguracją Gatewaya:

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

| Zmienna                                         | Odpowiada kluczowi                                  |
| ----------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                        |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (wartości rozdzielone przecinkami)      |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`)  |

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

`authToken` może być odwołaniem SecretRef (`source: "env" | "file" | "exec"`). Użyj go, jeśli Gateway ma pobierać Auth Token Twilio z mechanizmu obsługi sekretów OpenClaw zamiast przechowywać go w konfiguracji jako zwykły tekst:

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

Wskazana zmienna środowiskowa lub dostawca sekretów musi być dostępny dla środowiska wykonawczego Gatewaya. Po zmianie zmiennych środowiskowych hosta uruchom ponownie zarządzane procesy Gatewaya.

### Nadawca Messaging Service

Użyj `messagingServiceSid` zamiast `fromNumber`, jeśli Twilio ma wybierać nadawcę za pośrednictwem usługi Messaging Service:

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

Jeśli po rozstrzygnięciu wartości z konfiguracji i zmiennych środowiskowych występują zarówno `fromNumber`, jak i `messagingServiceSid`, używany jest `fromNumber`.

### Domyślny odbiorca wiadomości wychodzących

Ustaw `defaultTo`, jeśli automatyzacja lub dostarczanie inicjowane przez agenta ma używać domyślnego odbiorcy, gdy przepływ wysyłania nie określa jawnego celu:

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

`channels.sms.dmPolicy` steruje bezpośrednim dostępem przez SMS:

- `pairing` (domyślna): nieznani nadawcy otrzymują kod parowania; zatwierdź go poleceniem `openclaw pairing approve sms <CODE>`.
- `allowlist`: przetwarzane są wyłącznie wiadomości od nadawców wymienionych w `allowFrom`. Puste `allowFrom` odrzuca każdego nadawcę (Gateway rejestruje ostrzeżenie podczas uruchamiania).
- `open`: walidacja konfiguracji wymaga, aby `allowFrom` zawierało `"*"`. Bez symbolu wieloznacznego rozmawiać mogą tylko numery znajdujące się na liście.
- `disabled`: wszystkie przychodzące wiadomości bezpośrednie są odrzucane.

Wpisami `allowFrom` powinny być numery telefonów w formacie E.164, takie jak `+15551234567`. Prefiksy `sms:` i `twilio-sms:` są akceptowane i normalizowane. W przypadku prywatnego asystenta preferuj `dmPolicy: "allowlist"` z jawnie podanymi numerami telefonów:

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

## Wysyłanie wiadomości SMS

Po wybraniu kanału SMS jako cele można podawać same numery w formacie E.164 lub używać prefiksu `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Gdy wybór kanału jest niejawny, prefiks `twilio-sms:` wybiera ten kanał bez przejmowania prefiksu usługi `sms:`, którego iMessage używa do wyboru dostarczania przez sieć komórkową SMS dla własnych celów:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI wymaga jawnego parametru `--target`. `defaultTo` służy do automatyzacji i ścieżek dostarczania inicjowanych przez agenta, w których cel może zostać ustalony z konfiguracji kanału.

Odpowiedzi agenta w przychodzących rozmowach SMS są automatycznie wysyłane z powrotem do nadawcy za pośrednictwem skonfigurowanego nadawcy Twilio.

Wiadomości SMS są wysyłane jako zwykły tekst. OpenClaw usuwa składnię Markdown, spłaszcza blokowe fragmenty kodu, przekształca odnośniki do postaci `etykieta (url)` i przed wysłaniem przez Twilio dzieli długie odpowiedzi na fragmenty o maksymalnej długości `textChunkLimit` znaków (domyślnie 1500).

## Weryfikacja konfiguracji

Po uruchomieniu Gatewaya:

1. Potwierdź, że dziennik Gateway zawiera trasę webhooka SMS.
2. Uruchom test po stronie Twilio (sprawdza skonfigurowany adres URL/metodę webhooka Twilio oraz ostatnie błędy wiadomości przychodzących):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Wyślij SMS ze swojego telefonu na numer Twilio.
4. Uruchom `openclaw pairing list sms`.
5. Zatwierdź kod parowania za pomocą `openclaw pairing approve sms <CODE>`.
6. Wyślij kolejny SMS i potwierdź, że agent odpowiada.

Do testowania wyłącznie wiadomości wychodzących użyj:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Kompleksowy test z macOS iMessage/SMS

Na komputerze Mac, który może wysyłać SMS-y operatora za pośrednictwem aplikacji Messages, możesz użyć `imsg`, aby sterować stroną nadawcy bez korzystania z telefonu:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Pierwsza wiadomość powinna utworzyć żądanie parowania. Druga wiadomość powinna otrzymać odpowiedź agenta za pośrednictwem Twilio.

## Bezpieczeństwo webhooka

Domyślnie OpenClaw weryfikuje `X-Twilio-Signature` przy użyciu `publicWebhookUrl` i `authToken`. Część adresu `publicWebhookUrl` określającą punkt końcowy musi być identyczna bajt po bajcie z adresem URL skonfigurowanym w Twilio, łącznie ze schematem, hostem, ścieżką i ciągiem zapytania. Zgodnie z wymaganiami Twilio OpenClaw wyklucza fragmenty [nadpisywania parametrów połączenia](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) Twilio (`#...`) z obliczania podpisu.

Trasa webhooka wymusza również, niezależnie od weryfikacji podpisu:

- Wyłącznie `POST`.
- Limit 30 żądań na minutę dla każdego źródłowego adresu IP (po przekroczeniu HTTP 429).
- Wartość `AccountSid` w danych musi być zgodna ze skonfigurowanym `accountSid` (w przeciwnym razie HTTP 403).
- Powtórzone wartości `MessageSid` są deduplikowane przez 10 minut.
- Pamięć podręczna powtórzeń każdego konta SMS przechowuje maksymalnie 10 000 aktywnych identyfikatorów SID wiadomości. Gdy wszystkie miejsca są zajęte przez aktywne wpisy, nowe webhooki dla tego konta są odrzucane w trybie zamkniętym z kodem HTTP 429 i nagłówkiem `Retry-After`, dopóki najstarszy wpis nie wygaśnie.
- Treści żądań większe niż 32 KB są odrzucane.

Twilio domyślnie nie ponawia żądań zakończonych kodem HTTP 429 ani nie dokumentuje obsługi nagłówka `Retry-After`. Nadpisania parametrów połączenia `#rp=4xx` i `#rp=all` włączają ponawianie dla kodów 4xx, ale Twilio ogranicza całą transakcję ponawiania do 15 sekund, więc próby mogą zakończyć się przed wygaśnięciem miejsca w pamięci podręcznej powtórzeń. Skonfiguruj zapasowy adres URL, jeśli inny moduł obsługi musi odbierać nieudane dostarczenia; traktuj kod 429 jako odrzucenie w trybie zamkniętym, a nie jako niezawodny mechanizm kontroli napływu.

Wyłącznie do lokalnego testowania tunelu możesz ustawić:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Nie wyłączaj weryfikacji podpisu w publicznym Gateway.

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

Każde konto musi używać odrębnej wartości `webhookPath`; Gateway odmawia zarejestrowania trasy webhooka, której ścieżka należy już do innego konta. Zastępcze wartości ze zmiennych środowiskowych `TWILIO_*`/`SMS_*` dotyczą wyłącznie konta domyślnego; ustaw `defaultAccount`, aby wskazać inne konto domyślne.

## Rozwiązywanie problemów

### Twilio zwraca kod 403 lub OpenClaw odrzuca webhook

Sprawdź, czy `publicWebhookUrl` dokładnie odpowiada adresowi URL skonfigurowanemu w Twilio, łącznie ze schematem, hostem, ścieżką i ciągiem zapytania. Twilio podpisuje ciąg publicznego adresu URL, dlatego przepisywanie adresu przez serwer proxy i alternatywne nazwy hostów mogą uniemożliwić weryfikację podpisu.

Kod 403 z komunikatem `Invalid account` oznacza, że wartość `AccountSid` w danych przychodzących nie jest zgodna ze skonfigurowanym `accountSid`; sprawdź, czy webhook wskazuje konto będące właścicielem numeru.

### Żądanie parowania nie pojawia się

Sprawdź adres URL i metodę webhooka **Messaging** numeru Twilio. Musi wskazywać adres URL webhooka SMS i używać metody `POST`. Potwierdź także, że Gateway jest dostępny z publicznego internetu lub przez tunel.

Jeśli dziennik wiadomości Twilio zawiera błąd `11200`, Twilio zaakceptowało przychodzący SMS, ale nie mogło połączyć się z webhookiem. Sprawdź:

- W Twilio opcja **Messaging > A message comes in** wskazuje `publicWebhookUrl`.
- Metoda to `POST`.
- Tunel lub odwrotne proxy udostępnia dokładną ścieżkę `webhookPath`; w przypadku Tailscale Funnel uruchom `tailscale funnel status` i potwierdź, że na liście znajduje się `/webhooks/sms`.
- `publicWebhookUrl` używa tego samego schematu, hosta, ścieżki i ciągu zapytania, które wysyła Twilio, aby weryfikacja podpisu mogła odtworzyć podpisany adres URL.

Polecenie `openclaw channels status --channel sms --probe` wykrywa zarówno niezgodne ustawienia webhooka Twilio, jak i ostatnie błędy `11200`.

### Wysyłanie wiadomości wychodzących kończy się niepowodzeniem

Potwierdź, że wartości `accountSid`, `authToken` oraz `fromNumber` lub `messagingServiceSid` zostały rozpoznane. Jeśli korzystasz z próbnego konta Twilio, przed wysłaniem wychodzącego SMS-a może być konieczne zweryfikowanie numeru docelowego w Twilio.

### Wiadomości docierają, ale agent nie odpowiada

Sprawdź `dmPolicy` i `allowFrom`. Przy domyślnej zasadzie `pairing` nadawca musi zostać zatwierdzony, zanim zwykłe interakcje z agentem zostaną przetworzone.
