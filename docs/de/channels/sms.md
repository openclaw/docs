---
read_when:
    - Sie möchten OpenClaw über Twilio mit SMS verbinden
    - Sie benötigen eine SMS-Webhook- oder Allowlist-Einrichtung
summary: Einrichtung des Twilio-SMS-Kanals, Zugriffskontrollen und Webhook-Konfiguration
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:12:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw kann SMS über eine Twilio-Telefonnummer oder einen Messaging Service empfangen und senden. Der Gateway registriert eine eingehende Webhook-Route, validiert standardmäßig Twilio-Anforderungssignaturen und sendet Antworten über die Messages API von Twilio zurück.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für SMS ist Kopplung.
  </Card>
  <Card title="Gateway-Sicherheit" icon="shield" href="/de/gateway/security">
    Prüfen Sie die Webhook-Exposition und die Zugriffskontrollen für Absender.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
</CardGroup>

## Bevor Sie beginnen

Sie benötigen:

- Das offizielle SMS-Plugin, installiert mit `openclaw plugins install @openclaw/sms`.
- Ein Twilio-Konto mit einer SMS-fähigen Telefonnummer oder einem Twilio Messaging Service.
- Die Twilio Account SID und das Auth Token.
- Eine öffentliche HTTPS-URL, die Ihren OpenClaw Gateway erreicht.
- Eine Auswahl für die Absenderrichtlinie: `pairing` für private Nutzung, `allowlist` für vorab genehmigte Telefonnummern oder `open` nur für bewusst öffentlichen SMS-Zugriff.

Verwenden Sie eine Twilio-Nummer sowohl für SMS als auch Voice Call, wenn die Nummer beide Funktionen unterstützt. Konfigurieren Sie den SMS-Webhook und den Voice-Webhook separat in Twilio; diese Seite behandelt nur den SMS-Webhook.

## Schnelleinrichtung

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Twilio-Absender erstellen oder auswählen">
    Öffnen Sie in Twilio **Phone Numbers > Manage > Active numbers** und wählen Sie eine SMS-fähige Nummer aus. Speichern Sie:

    - Account SID, zum Beispiel `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Absender-Telefonnummer, zum Beispiel `+15551234567`

    Wenn Sie statt einer festen Absendernummer einen Messaging Service verwenden, speichern Sie die Messaging Service SID, zum Beispiel `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="SMS-Channel konfigurieren">

Speichern Sie dies als `sms.patch.json5` und ändern Sie die Platzhalter:

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

Wenden Sie es an:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Twilio auf den Gateway-Webhook verweisen">
    Öffnen Sie in den Twilio-Telefonnummerneinstellungen **Messaging** und setzen Sie **A message comes in** auf:

```text
https://gateway.example.com/webhooks/sms
```

    Verwenden Sie HTTP `POST`. Der standardmäßige lokale Pfad ist `/webhooks/sms`; ändern Sie `channels.sms.webhookPath`, wenn Sie eine andere Route benötigen.

  </Step>

  <Step title="Den genauen SMS-Webhook-Pfad bereitstellen">
    Ihre öffentliche URL muss den SMS-Pfad an den Gateway-Prozess weiterleiten. Wenn Sie Tailscale Funnel für lokale Tests verwenden, stellen Sie `/webhooks/sms` explizit bereit:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call und SMS verwenden separate Webhook-Pfade. Wenn dieselbe Twilio-Nummer beides verarbeitet, lassen Sie beide Routen in Twilio und in Ihrem Tunnel konfiguriert.

  </Step>

  <Step title="Gateway starten und ersten Absender genehmigen">

```bash
openclaw gateway
```

Senden Sie eine Textnachricht an die Twilio-Nummer. Die erste Nachricht erstellt eine Kopplungsanfrage. Genehmigen Sie sie:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Kopplungscodes laufen nach 1 Stunde ab.

  </Step>
</Steps>

## Konfigurationsbeispiele

### Konfigurationsdatei

Verwenden Sie die Einrichtung per Konfigurationsdatei, wenn die Channel-Definition mit der Gateway-Konfiguration übertragen werden soll:

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

### Umgebungsvariablen

Verwenden Sie die Einrichtung per Umgebungsvariablen für Bereitstellungen mit einem einzelnen Konto, bei denen Geheimnisse aus der Host-Umgebung kommen:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Aktivieren Sie anschließend den Channel in der Konfiguration:

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

`TWILIO_SMS_FROM` wird als Alias für `TWILIO_PHONE_NUMBER` akzeptiert. Verwenden Sie `TWILIO_MESSAGING_SERVICE_SID` statt eines Telefonnummer-Absenders, wenn Twilio den Absender aus einem Messaging Service auswählen soll.

### SecretRef-Auth-Token

`authToken` kann eine SecretRef sein. Verwenden Sie dies, wenn der Gateway das Twilio Auth Token aus der OpenClaw-Secrets-Runtime auflösen soll, statt Klartext-Konfiguration zu speichern:

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

Die referenzierte Umgebungsvariable oder der Secret-Provider muss für die Gateway-Runtime sichtbar sein. Starten Sie verwaltete Gateway-Prozesse nach Änderungen an Host-Umgebungsvariablen neu.

### Private Nummer nur per Allowlist

Verwenden Sie `allowlist`, wenn nur bekannte Telefonnummern mit dem Agent sprechen dürfen:

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

### Messaging Service-Absender

Verwenden Sie `messagingServiceSid` statt `fromNumber`, wenn Twilio den Absender über einen Messaging Service auswählen soll:

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

Wenn nach der Auflösung von Konfiguration und Umgebungsvariablen sowohl `fromNumber` als auch `messagingServiceSid` vorhanden sind, wird `fromNumber` verwendet.

### Standardziel für ausgehende Nachrichten

Setzen Sie `defaultTo`, wenn Automatisierung oder vom Agent initiierte Zustellung ein Standardziel haben soll, falls ein Sendeablauf kein explizites Ziel angibt:

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

## Zugriffskontrolle

`channels.sms.dmPolicy` steuert den direkten SMS-Zugriff:

- `pairing` (Standard)
- `allowlist` (erfordert mindestens einen Absender in `allowFrom`)
- `open` (erfordert, dass `allowFrom` `"*"` enthält)
- `disabled`

`allowFrom`-Einträge sollten E.164-Telefonnummern wie `+15551234567` sein. `sms:`-Präfixe werden akzeptiert und normalisiert. Für einen privaten Assistant bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten Telefonnummern.

## SMS senden

Ausgehende SMS-Ziele verwenden den Service-Präfix `sms:` mit ausgewähltem SMS-Channel:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Wenn die Channel-Auswahl implizit ist, wählt `twilio-sms:+15551234567` diesen Channel aus, ohne den vorhandenen channel-eigenen Service-Präfix `sms:` zu übernehmen, der von iMessage verwendet wird.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

Die CLI erfordert ein explizites `--target`. `defaultTo` ist für Automatisierungs- und vom Agent initiierte Zustellpfade vorgesehen, bei denen das Ziel aus der Channel-Konfiguration aufgelöst werden kann.

Agent-Antworten aus eingehenden SMS-Unterhaltungen gehen automatisch über den konfigurierten Twilio-Absender an den Absender zurück.

SMS-Ausgabe ist Klartext. OpenClaw entfernt Markdown, flacht eingezäunte Codeblöcke ab, erhält lesbare Links und teilt lange Antworten in Abschnitte auf, bevor sie über Twilio gesendet werden.

## Einrichtung überprüfen

Nachdem der Gateway gestartet ist:

1. Bestätigen Sie, dass das Gateway-Protokoll die SMS-Webhook-Route anzeigt.
2. Führen Sie eine Twilio-seitige Prüfung aus:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Senden Sie von Ihrem Telefon eine SMS an die Twilio-Nummer.
4. Führen Sie `openclaw pairing list sms` aus.
5. Genehmigen Sie den Kopplungscode mit `openclaw pairing approve sms <CODE>`.
6. Senden Sie eine weitere SMS und bestätigen Sie, dass der Agent antwortet.

Für Tests nur ausgehender Nachrichten verwenden Sie:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### End-to-End-Test aus macOS iMessage/SMS

Auf einem Mac, der über Messages Mobilfunk-SMS senden kann, können Sie `imsg` verwenden, um die Absenderseite zu steuern, ohne Ihr Telefon zu verwenden:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Die erste Nachricht sollte eine Kopplungsanfrage erstellen. Die zweite Nachricht sollte die Agent-Antwort über Twilio erhalten.

## Webhook-Sicherheit

Standardmäßig validiert OpenClaw `X-Twilio-Signature` mit `publicWebhookUrl` und `authToken`. Halten Sie `publicWebhookUrl` Byte für Byte mit der in Twilio konfigurierten URL abgestimmt, einschließlich Schema, Host, Pfad und Abfragezeichenfolge.

Nur für lokale Tunneltests können Sie setzen:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Verwenden Sie deaktivierte Signaturvalidierung nicht auf einem öffentlichen Gateway.

## Konfiguration für mehrere Konten

Verwenden Sie `accounts`, wenn Sie mehr als eine Twilio-Nummer betreiben:

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

Jedes Konto sollte einen eindeutigen `webhookPath` verwenden.

## Fehlerbehebung

### Twilio gibt 403 zurück oder OpenClaw weist den Webhook zurück

Prüfen Sie, dass `publicWebhookUrl` genau mit der in Twilio konfigurierten URL übereinstimmt, einschließlich Schema, Host, Pfad und Abfragezeichenfolge. Twilio signiert die öffentliche URL-Zeichenfolge, daher können Proxy-Umschreibungen und alternative Hostnamen die Signaturvalidierung unterbrechen.

### Es erscheint keine Kopplungsanfrage

Prüfen Sie die **Messaging**-Webhook-URL und -Methode der Twilio-Nummer. Sie muss auf die SMS-Webhook-URL zeigen und `POST` verwenden. Bestätigen Sie außerdem, dass der Gateway aus dem öffentlichen Internet oder über Ihren Tunnel erreichbar ist.

Wenn das Twilio-Nachrichtenprotokoll den Fehler `11200` anzeigt, hat Twilio die eingehende SMS akzeptiert, konnte Ihren Webhook aber nicht erreichen. Prüfen Sie:

- Twilio **Messaging > A message comes in** zeigt auf `publicWebhookUrl`.
- Die Methode ist `POST`.
- Der Tunnel oder Reverse Proxy stellt den genauen `webhookPath` bereit; führen Sie für Tailscale Funnel `tailscale funnel status` aus und bestätigen Sie, dass `/webhooks/sms` aufgeführt ist.
- `publicWebhookUrl` verwendet dasselbe Schema, denselben Host, denselben Pfad und dieselbe Abfragezeichenfolge, die Twilio sendet, damit die Signaturvalidierung die signierte URL reproduzieren kann.

### Ausgehende Sendungen schlagen fehl

Bestätigen Sie, dass `accountSid`, `authToken` und entweder `fromNumber` oder `messagingServiceSid` aufgelöst werden. Wenn Sie ein Twilio-Testkonto verwenden, muss die Zielnummer möglicherweise in Twilio verifiziert werden, bevor ausgehende SMS gesendet werden.

### Nachrichten kommen an, aber der Agent antwortet nicht

Prüfen Sie `dmPolicy` und `allowFrom`. Bei der standardmäßigen Richtlinie `pairing` muss der Absender genehmigt sein, bevor normale Agent-Durchläufe verarbeitet werden.
