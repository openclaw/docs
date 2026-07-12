---
read_when:
    - Arbeiten an Funktionen des Google-Chat-Kanals
summary: Unterstützungsstatus, Funktionen und Konfiguration der Google Chat-App
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T01:21:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat wird als offizielles Plugin `@openclaw/googlechat` ausgeführt: Direktnachrichten und Gruppenbereiche über Webhooks der Google Chat API (nur HTTP-Endpunkt, kein Pub/Sub).

## Installation

```bash
openclaw plugins install @openclaw/googlechat
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Schnelleinrichtung (für Einsteiger)

1. Erstellen Sie ein Google-Cloud-Projekt und aktivieren Sie die **Google Chat API**.
   - Öffnen Sie: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktivieren Sie die API, falls sie noch nicht aktiviert ist.
2. Erstellen Sie ein **Service Account**:
   - Klicken Sie auf **Create Credentials** > **Service Account**.
   - Geben Sie einen beliebigen Namen ein (z. B. `openclaw-chat`).
   - Lassen Sie Berechtigungen und Hauptkonten leer (**Continue**, dann **Done**).
3. Erstellen Sie den **JSON-Schlüssel** und laden Sie ihn herunter:
   - Klicken Sie auf das neue Dienstkonto > Registerkarte **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Speichern Sie die heruntergeladene JSON-Datei auf Ihrem Gateway-Host (z. B. `~/.openclaw/googlechat-service-account.json`).
5. Erstellen Sie in der [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) eine Google-Chat-App:
   - Füllen Sie **Application info** aus (App-Name, Avatar-URL, Beschreibung).
   - Aktivieren Sie **Interactive features**.
   - Aktivieren Sie unter **Functionality** die Option **Join spaces and group conversations**.
   - Wählen Sie unter **Connection settings** die Option **HTTP endpoint URL**.
   - Wählen Sie unter **Triggers** die Option **Use a common HTTP endpoint URL for all triggers** und legen Sie als Wert Ihre öffentliche Gateway-URL mit angehängtem `/googlechat` fest (siehe [Öffentliche URL](#public-url-webhook-only)).
   - Aktivieren Sie unter **Visibility** die Option **Make this Chat app available to specific people and groups in `<Your Domain>`** und geben Sie Ihre E-Mail-Adresse ein.
   - Klicken Sie auf **Save**.
6. Aktivieren Sie den App-Status: Aktualisieren Sie die Seite, suchen Sie **App status**, setzen Sie ihn auf **Live - available to users** und klicken Sie erneut auf **Save**.
7. Konfigurieren Sie OpenClaw mit dem Dienstkonto und der Webhook-Zielgruppe (muss mit der Konfiguration der Chat-App übereinstimmen):
   - Umgebungsvariable: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (nur Standardkonto), oder
   - Konfiguration: siehe [Wichtige Konfigurationsoptionen](#config-highlights). `openclaw channels add --channel googlechat` akzeptiert außerdem `--audience-type`, `--audience`, `--webhook-path` und `--webhook-url`.
8. Starten Sie das Gateway. Google Chat sendet POST-Anfragen an Ihren Webhook-Pfad (standardmäßig `/googlechat`).

## Zu Google Chat hinzufügen

Sobald das Gateway ausgeführt wird und Ihre E-Mail-Adresse in der Sichtbarkeitsliste steht:

1. Öffnen Sie [Google Chat](https://chat.google.com/).
2. Klicken Sie neben **Direct Messages** auf das Symbol **+** (Plus).
3. Suchen Sie nach dem **App name**, den Sie in der Google Cloud Console konfiguriert haben.
   - Der Bot wird _nicht_ in der Marketplace-Übersicht angezeigt, da es sich um eine private App handelt; suchen Sie anhand seines Namens nach ihm.
4. Wählen Sie den Bot aus, klicken Sie auf **Add** oder **Chat** und senden Sie eine Nachricht.

## Öffentliche URL (nur Webhook)

Google-Chat-Webhooks erfordern einen öffentlichen HTTPS-Endpunkt. Stellen Sie aus Sicherheitsgründen **nur den Pfad `/googlechat`** im Internet bereit und halten Sie das OpenClaw-Dashboard sowie andere Endpunkte privat.

### Option A: Tailscale Funnel (empfohlen)

Verwenden Sie Tailscale Serve für das private Dashboard und Funnel für den öffentlichen Webhook-Pfad.

1. Prüfen Sie, an welche Adresse Ihr Gateway gebunden ist:

   ```bash
   ss -tlnp | grep 18789
   ```

   Notieren Sie die IP-Adresse (z. B. `127.0.0.1`, `0.0.0.0` oder eine Tailscale-Adresse im Format `100.x.x.x`).

2. Stellen Sie das Dashboard nur im Tailnet bereit (Port 8443):

   ```bash
   # Bei Bindung an localhost (127.0.0.1 oder 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Bei ausschließlicher Bindung an eine Tailscale-IP:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Stellen Sie nur den Webhook-Pfad öffentlich bereit:

   ```bash
   # Bei Bindung an localhost (127.0.0.1 oder 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Bei ausschließlicher Bindung an eine Tailscale-IP:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Falls Sie dazu aufgefordert werden, öffnen Sie die in der Ausgabe angezeigte Autorisierungs-URL, um Funnel für diese Node zu aktivieren.

5. Überprüfen Sie die Konfiguration:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ihre öffentliche Webhook-URL lautet `https://<node-name>.<tailnet>.ts.net/googlechat`; das Dashboard bleibt unter `https://<node-name>.<tailnet>.ts.net:8443/` ausschließlich im Tailnet verfügbar. Verwenden Sie in der Konfiguration der Google-Chat-App die öffentliche URL (ohne `:8443`).

> Hinweis: Diese Konfiguration bleibt nach Neustarts bestehen. Entfernen Sie sie später mit `tailscale funnel reset` und `tailscale serve reset`.

### Option B: Reverse-Proxy (Caddy)

Leiten Sie nur den Webhook-Pfad weiter:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Anfragen an `your-domain.com/` werden ignoriert oder mit 404 beantwortet, während `your-domain.com/googlechat` an OpenClaw weitergeleitet wird.

### Option C: Cloudflare Tunnel

Konfigurieren Sie die Ingress-Regeln des Tunnels so, dass nur der Webhook-Pfad weitergeleitet wird:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Funktionsweise

1. Google Chat sendet JSON per POST an den Gateway-Webhook-Pfad (nur POST, JSON-Inhaltstyp erforderlich, Rate-Limit pro IP-Adresse).
2. OpenClaw authentifiziert jede Anfrage vor der Weiterleitung:
   - Chat-App-Ereignisse enthalten `Authorization: Bearer <token>`; das Token wird überprüft, bevor der vollständige Anfragetext analysiert wird.
   - Ereignisse von Google Workspace Add-ons enthalten das Token im Anfragetext (`authorizationEventObject.systemIdToken`) und werden vor der Überprüfung innerhalb eines strengeren Budgets für die Vorauthentifizierung gelesen (16 KB, 3 s).
3. Das Token wird anhand von `audienceType` + `audience` geprüft:
   - `audienceType: "app-url"` → Die Zielgruppe ist Ihre HTTPS-Webhook-URL.
   - `audienceType: "project-number"` → Die Zielgruppe ist die Nummer des Cloud-Projekts.
   - Add-on-Tokens unter `app-url` erfordern zusätzlich, dass `appPrincipal` auf die numerische OAuth-2.0-Client-ID der App gesetzt ist (21 Ziffern, keine E-Mail-Adresse); andernfalls schlägt die Überprüfung fehl und eine Warnung wird protokolliert.
4. Nachrichten werden anhand des Gruppenbereichs weitergeleitet:
   - Gruppenbereiche erhalten bereichsspezifische Sitzungen `agent:<agentId>:googlechat:group:<spaceId>`; Antworten werden im Nachrichten-Thread gesendet.
   - Direktnachrichten werden standardmäßig in der Hauptsitzung des Agenten zusammengeführt; legen Sie `session.dmScope` für Direktnachrichtensitzungen pro Kommunikationspartner fest (siehe [Sitzung](/de/concepts/session)).
5. Der Zugriff auf Direktnachrichten erfolgt standardmäßig durch Kopplung. Unbekannte Absender erhalten einen Kopplungscode; genehmigen Sie ihn mit:
   - `openclaw pairing approve googlechat <code>`
6. Gruppenbereiche erfordern standardmäßig eine @-Erwähnung. Erwähnungen werden anhand von Chat-Annotationen des Typs `USER_MENTION` erkannt, die auf die App verweisen; legen Sie `botUser` fest (z. B. `users/1234567890`), falls für die Erkennung der Name der Benutzerressource der App benötigt wird.
7. Wenn eine Genehmigung für einen Ausführungsbefehl oder ein Plugin aus Google Chat gestartet wird und ein stabiler Genehmiger im Format `users/<id>` konfiguriert ist, veröffentlicht OpenClaw eine native Genehmigungskarte (`cardsV2`) im ursprünglichen Gruppenbereich oder Thread. Die Schaltflächen der Karte enthalten undurchsichtige Callback-Tokens; die manuelle Aufforderung `/approve <id> <decision>` wird nur angezeigt, wenn die native Zustellung nicht verfügbar ist.

## Ziele

Verwenden Sie diese Bezeichner für die Zustellung und Zulassungslisten:

- Direktnachrichten: `users/<userId>` (empfohlen).
- Gruppenbereiche: `spaces/<spaceId>`.
- Eine einfache E-Mail-Adresse wie `name@example.com` ist veränderlich und wird nur für den Abgleich mit Zulassungslisten verwendet, wenn `channels.googlechat.dangerouslyAllowNameMatching: true` festgelegt ist.
- Veraltet: `users/<email>` wird als Benutzer-ID behandelt, nicht als E-Mail-Eintrag einer Zulassungsliste.
- Die Präfixe `googlechat:`, `google-chat:` und `gchat:` werden akzeptiert und entfernt.

## Wichtige Konfigurationsoptionen

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Hinweise:

- Anmeldedaten des Dienstkontos: `serviceAccountFile` (Pfad), `serviceAccount` (eingebettete JSON-Zeichenfolge oder eingebettetes Objekt) oder `serviceAccountRef` (SecretRef für Umgebungsvariable/Datei). Die Umgebungsvariablen `GOOGLE_CHAT_SERVICE_ACCOUNT` (eingebettetes JSON) und `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (Pfad) gelten nur für das Standardkonto. Konfigurationen mit mehreren Konten verwenden `channels.googlechat.accounts.<id>` mit denselben Schlüsseln, einschließlich eines kontospezifischen `serviceAccountRef`.
- Wenn `webhookPath` nicht festgelegt ist, lautet der standardmäßige Webhook-Pfad `/googlechat`; alternativ kann `webhookUrl` den Pfad bereitstellen.
- Gruppenschlüssel müssen stabile Gruppenbereichs-IDs (`spaces/<spaceId>`) sein. Schlüssel mit Anzeigenamen sind veraltet und werden entsprechend protokolliert.
- `dangerouslyAllowNameMatching` aktiviert den Abgleich veränderlicher E-Mail-Hauptkonten für Zulassungslisten erneut (Notfall-Kompatibilitätsmodus); Doctor warnt vor E-Mail-Einträgen.
- Reaktionsaktionen von Google Chat werden nicht bereitgestellt. Das Plugin verwendet die Authentifizierung per Dienstkonto, während die Reaktionsendpunkte von Google Chat eine Benutzerauthentifizierung erfordern. Eine vorhandene Konfiguration für `actions.reactions` wird aus Kompatibilitätsgründen akzeptiert, hat jedoch keine Wirkung.
- Native Genehmigungskarten verwenden Klicks auf Google-Chat-Schaltflächen vom Typ `cardsV2`, keine Reaktionsereignisse. Genehmiger stammen aus `dm.allowFrom` oder `defaultTo` und müssen stabile numerische Werte im Format `users/<id>` sein.
- Nachrichtenaktionen stellen nur den textbasierten Vorgang `send` bereit. Das Hochladen von Anhängen in Google Chat erfordert eine Benutzerauthentifizierung. Da dieses Plugin die Authentifizierung per Dienstkonto verwendet, wird das Hochladen ausgehender Dateien nicht bereitgestellt.
- `typingIndicator`: `message` (Standard) veröffentlicht einen Platzhalter `_<Bot> is typing..._` und wandelt ihn durch Bearbeitung in die erste Antwort um; `none` deaktiviert ihn; `reaction` erfordert Benutzer-OAuth und greift bei der Authentifizierung per Dienstkonto derzeit auf `message` zurück, wobei ein Fehler protokolliert wird.
- Eingehende Anhänge (der erste Anhang pro Nachricht) werden über die Chat API in die Medienpipeline heruntergeladen und durch `mediaMaxMb` begrenzt (Standardwert 20).
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. Mit `allowBots: true` verwenden akzeptierte Bot-Nachrichten den gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection): Konfigurieren Sie `channels.defaults.botLoopProtection` und überschreiben Sie ihn anschließend mit `channels.googlechat.botLoopProtection` oder `channels.googlechat.groups.<space>.botLoopProtection`.

Details zu Geheimnisreferenzen: [Verwaltung von Geheimnissen](/de/gateway/secrets).

## Fehlerbehebung

### 405 Methode nicht zulässig

Wenn der Google Cloud Logs Explorer Fehler wie den folgenden anzeigt:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

ist der Webhook-Handler nicht registriert. Häufige Ursachen:

1. **Kanal nicht konfiguriert**: Der Abschnitt `channels.googlechat` fehlt. Überprüfen Sie dies mit:

   ```bash
   openclaw config get channels.googlechat
   ```

   Wenn der Befehl „Config path not found“ zurückgibt, fügen Sie die Konfiguration hinzu (siehe [Wichtige Konfigurationsoptionen](#config-highlights)).

2. **Plugin nicht aktiviert**: Prüfen Sie den Plugin-Status:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Wenn „disabled“ angezeigt wird, fügen Sie Ihrer Konfiguration `plugins.entries.googlechat.enabled: true` hinzu.

3. **Gateway nach Konfigurationsänderungen nicht neu gestartet**:

   ```bash
   openclaw gateway restart
   ```

Überprüfen Sie, ob der Kanal ausgeführt wird:

```bash
openclaw channels status
# Sollte anzeigen: Google Chat default: enabled, configured, ...
```

### Weitere Probleme

- `openclaw channels status --probe` zeigt Authentifizierungsfehler und eine fehlende Zielgruppenkonfiguration an (`audience` und `audienceType` sind beide erforderlich).
- Wenn keine Nachrichten eintreffen, überprüfen Sie die Webhook-URL und die Trigger-Konfiguration der Chat-App.
- Wenn die Erwähnungsprüfung Antworten blockiert, setzen Sie `botUser` auf den Namen der Benutzerressource der App und überprüfen Sie `requireMention`.
- `openclaw logs --follow` zeigt beim Senden einer Testnachricht, ob die Anfragen das Gateway erreichen.

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungssteuerung
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
