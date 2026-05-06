---
read_when:
    - Arbeiten an Funktionen des Google Chat-Kanals
summary: Supportstatus, Funktionen und Konfiguration der Google Chat-App
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T06:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

Status: herunterladbares Plugin für DMs + Bereiche über Google Chat API-Webhooks (nur HTTP).

## Installation

Installieren Sie Google Chat, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokaler Checkout (bei Ausführung aus einem Git-Repo):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Schnelle Einrichtung (Einsteiger)

1. Erstellen Sie ein Google Cloud-Projekt und aktivieren Sie die **Google Chat API**.
   - Gehen Sie zu: [Google Chat API-Zugangsdaten](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktivieren Sie die API, falls sie noch nicht aktiviert ist.
2. Erstellen Sie ein **Service Account**:
   - Klicken Sie auf **Create Credentials** > **Service Account**.
   - Benennen Sie ihn beliebig (z. B. `openclaw-chat`).
   - Lassen Sie Berechtigungen leer (klicken Sie auf **Continue**).
   - Lassen Sie Prinzipale mit Zugriff leer (klicken Sie auf **Done**).
3. Erstellen Sie den **JSON Key** und laden Sie ihn herunter:
   - Klicken Sie in der Liste der Service Accounts auf den gerade erstellten.
   - Wechseln Sie zum Tab **Keys**.
   - Klicken Sie auf **Add Key** > **Create new key**.
   - Wählen Sie **JSON** aus und klicken Sie auf **Create**.
4. Speichern Sie die heruntergeladene JSON-Datei auf Ihrem Gateway-Host (z. B. `~/.openclaw/googlechat-service-account.json`).
5. Erstellen Sie eine Google Chat-App in der [Google Cloud Console Chat-Konfiguration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Füllen Sie die **Application info** aus:
     - **App name**: (z. B. `OpenClaw`)
     - **Avatar URL**: (z. B. `https://openclaw.ai/logo.png`)
     - **Description**: (z. B. `Personal AI Assistant`)
   - Aktivieren Sie **Interactive features**.
   - Aktivieren Sie unter **Functionality** die Option **Join spaces and group conversations**.
   - Wählen Sie unter **Connection settings** die Option **HTTP endpoint URL**.
   - Wählen Sie unter **Triggers** die Option **Use a common HTTP endpoint URL for all triggers** und setzen Sie sie auf die öffentliche URL Ihres Gateways, gefolgt von `/googlechat`.
     - _Tipp: Führen Sie `openclaw status` aus, um die öffentliche URL Ihres Gateways zu finden._
   - Aktivieren Sie unter **Visibility** die Option **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Geben Sie Ihre E-Mail-Adresse (z. B. `user@example.com`) in das Textfeld ein.
   - Klicken Sie unten auf **Save**.
6. **Aktivieren Sie den App-Status**:
   - **Aktualisieren Sie nach dem Speichern die Seite**.
   - Suchen Sie nach dem Abschnitt **App status** (nach dem Speichern normalerweise oben oder unten).
   - Ändern Sie den Status in **Live - available to users**.
   - Klicken Sie erneut auf **Save**.
7. Konfigurieren Sie OpenClaw mit dem Service-Account-Pfad + Webhook-Audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Oder Konfiguration: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Legen Sie den Webhook-Audience-Typ + Wert fest (entspricht Ihrer Chat-App-Konfiguration).
9. Starten Sie das Gateway. Google Chat sendet per POST an Ihren Webhook-Pfad.

## Zu Google Chat hinzufügen

Sobald das Gateway läuft und Ihre E-Mail zur Sichtbarkeitsliste hinzugefügt wurde:

1. Gehen Sie zu [Google Chat](https://chat.google.com/).
2. Klicken Sie auf das **+**-Symbol (Plus) neben **Direct Messages**.
3. Geben Sie in der Suchleiste (in der Sie normalerweise Personen hinzufügen) den **App name** ein, den Sie in der Google Cloud Console konfiguriert haben.
   - **Hinweis**: Der Bot wird _nicht_ in der Browse-Liste des „Marketplace“ angezeigt, da es sich um eine private App handelt. Sie müssen nach seinem Namen suchen.
4. Wählen Sie Ihren Bot aus den Ergebnissen aus.
5. Klicken Sie auf **Add** oder **Chat**, um eine 1:1-Unterhaltung zu starten.
6. Senden Sie „Hello“, um den Assistenten auszulösen!

## Öffentliche URL (nur Webhook)

Google Chat-Webhooks erfordern einen öffentlichen HTTPS-Endpunkt. Aus Sicherheitsgründen sollten Sie **nur den Pfad `/googlechat`** im Internet verfügbar machen. Belassen Sie das OpenClaw-Dashboard und andere sensible Endpunkte in Ihrem privaten Netzwerk.

### Option A: Tailscale Funnel (empfohlen)

Verwenden Sie Tailscale Serve für das private Dashboard und Funnel für den öffentlichen Webhook-Pfad. Dadurch bleibt `/` privat, während nur `/googlechat` verfügbar gemacht wird.

1. **Prüfen Sie, an welche Adresse Ihr Gateway gebunden ist:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notieren Sie die IP-Adresse (z. B. `127.0.0.1`, `0.0.0.0` oder Ihre Tailscale-IP wie `100.x.x.x`).

2. **Machen Sie das Dashboard nur für das Tailnet verfügbar (Port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Machen Sie nur den Webhook-Pfad öffentlich verfügbar:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisieren Sie die Node für Funnel-Zugriff:**
   Wenn Sie dazu aufgefordert werden, rufen Sie die in der Ausgabe angezeigte Autorisierungs-URL auf, um Funnel für diese Node in Ihrer Tailnet-Richtlinie zu aktivieren.

5. **Überprüfen Sie die Konfiguration:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ihre öffentliche Webhook-URL lautet:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ihr privates Dashboard bleibt ausschließlich im Tailnet erreichbar:
`https://<node-name>.<tailnet>.ts.net:8443/`

Verwenden Sie die öffentliche URL (ohne `:8443`) in der Google Chat-App-Konfiguration.

> Hinweis: Diese Konfiguration bleibt über Neustarts hinweg bestehen. Um sie später zu entfernen, führen Sie `tailscale funnel reset` und `tailscale serve reset` aus.

### Option B: Reverse Proxy (Caddy)

Wenn Sie einen Reverse Proxy wie Caddy verwenden, proxyen Sie nur den spezifischen Pfad:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Mit dieser Konfiguration wird jede Anfrage an `your-domain.com/` ignoriert oder als 404 zurückgegeben, während `your-domain.com/googlechat` sicher an OpenClaw weitergeleitet wird.

### Option C: Cloudflare Tunnel

Konfigurieren Sie die Ingress-Regeln Ihres Tunnels so, dass nur der Webhook-Pfad geroutet wird:

- **Pfad**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Standardregel**: HTTP 404 (Not Found)

## Funktionsweise

1. Google Chat sendet Webhook-POSTs an das Gateway. Jede Anfrage enthält einen Header `Authorization: Bearer <token>`.
   - OpenClaw verifiziert die Bearer-Authentifizierung, bevor vollständige Webhook-Bodys gelesen/geparst werden, wenn der Header vorhanden ist.
   - Google Workspace Add-on-Anfragen, die `authorizationEventObject.systemIdToken` im Body tragen, werden über ein strengeres Pre-Auth-Body-Budget unterstützt.
2. OpenClaw verifiziert das Token anhand des konfigurierten `audienceType` + `audience`:
   - `audienceType: "app-url"` → Audience ist Ihre HTTPS-Webhook-URL.
   - `audienceType: "project-number"` → Audience ist die Cloud-Projektnummer.
3. Nachrichten werden nach Bereich geroutet:
   - DMs verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Bereiche verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:group:<spaceId>`.
4. DM-Zugriff erfolgt standardmäßig per Pairing. Unbekannte Absender erhalten einen Pairing-Code; genehmigen Sie ihn mit:
   - `openclaw pairing approve googlechat <code>`
5. Gruppenbereiche erfordern standardmäßig eine @-Erwähnung. Verwenden Sie `botUser`, wenn die Erkennung von Erwähnungen den Benutzernamen der App benötigt.

## Ziele

Verwenden Sie diese Bezeichner für Zustellung und Allowlists:

- Direktnachrichten: `users/<userId>` (empfohlen).
- Rohe E-Mail `name@example.com` ist veränderlich und wird nur für direkte Allowlist-Abgleiche verwendet, wenn `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Veraltet: `users/<email>` wird als Benutzer-ID behandelt, nicht als E-Mail-Allowlist.
- Bereiche: `spaces/<spaceId>`.

## Konfigurations-Highlights

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Hinweise:

- Service-Account-Zugangsdaten können auch inline mit `serviceAccount` (JSON-String) übergeben werden.
- `serviceAccountRef` wird ebenfalls unterstützt (env/file SecretRef), einschließlich kontospezifischer Refs unter `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Der Standard-Webhook-Pfad ist `/googlechat`, wenn `webhookPath` nicht gesetzt ist.
- `dangerouslyAllowNameMatching` aktiviert den Abgleich veränderlicher E-Mail-Prinzipale für Allowlists wieder (Break-Glass-Kompatibilitätsmodus).
- Reaktionen sind über das Tool `reactions` und `channels action` verfügbar, wenn `actions.reactions` aktiviert ist.
- Nachrichtenaktionen stellen `send` für Text und `upload-file` für explizites Senden von Anhängen bereit. `upload-file` akzeptiert `media` / `filePath` / `path` plus optional `message`, `filename` und Thread-Zielangaben.
- `typingIndicator` unterstützt `none`, `message` (Standard) und `reaction` (`reaction` erfordert Benutzer-OAuth).
- Anhänge werden über die Chat API heruntergeladen und in der Medien-Pipeline gespeichert (Größe durch `mediaMaxMb` begrenzt).

Details zu Secrets-Referenzen: [Secrets-Verwaltung](/de/gateway/secrets).

## Fehlerbehebung

### 405 Method Not Allowed

Wenn der Google Cloud Logs Explorer Fehler wie diese anzeigt:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Bedeutet dies, dass der Webhook-Handler nicht registriert ist. Häufige Ursachen:

1. **Kanal nicht konfiguriert**: Der Abschnitt `channels.googlechat` fehlt in Ihrer Konfiguration. Überprüfen Sie dies mit:

   ```bash
   openclaw config get channels.googlechat
   ```

   Wenn `"Config path not found"` zurückgegeben wird, fügen Sie die Konfiguration hinzu (siehe [Konfigurations-Highlights](#config-highlights)).

2. **Plugin nicht aktiviert**: Prüfen Sie den Plugin-Status:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Wenn `"disabled"` angezeigt wird, fügen Sie Ihrer Konfiguration `plugins.entries.googlechat.enabled: true` hinzu.

3. **Gateway nicht neu gestartet**: Starten Sie nach dem Hinzufügen der Konfiguration das Gateway neu:

   ```bash
   openclaw gateway restart
   ```

Überprüfen Sie, ob der Kanal läuft:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Weitere Probleme

- Prüfen Sie `openclaw channels status --probe` auf Authentifizierungsfehler oder fehlende Audience-Konfiguration.
- Wenn keine Nachrichten ankommen, bestätigen Sie die Webhook-URL + Ereignisabonnements der Chat-App.
- Wenn das Erwähnungs-Gating Antworten blockiert, setzen Sie `botUser` auf den Benutzerressourcennamen der App und überprüfen Sie `requireMention`.
- Verwenden Sie `openclaw logs --follow`, während Sie eine Testnachricht senden, um zu sehen, ob Anfragen das Gateway erreichen.

Verwandte Dokumentation:

- [Gateway-Konfiguration](/de/gateway/configuration)
- [Sicherheit](/de/gateway/security)
- [Reaktionen](/de/tools/reactions)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
