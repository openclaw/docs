---
read_when:
    - Arbeiten an Google Chat-Kanalfunktionen
summary: Supportstatus, Funktionen und Konfiguration der Google Chat-App
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T20:41:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

Status: herunterladbares Plugin für Direktnachrichten + Gruppenbereiche über Google Chat API-Webhooks (nur HTTP).

## Installation

Installieren Sie Google Chat, bevor Sie den Channel konfigurieren:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokaler Checkout (wenn aus einem Git-Repository ausgeführt):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Schnelleinrichtung (Einsteiger)

1. Erstellen Sie ein Google Cloud-Projekt und aktivieren Sie die **Google Chat API**.
   - Rufen Sie auf: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktivieren Sie die API, falls sie noch nicht aktiviert ist.
2. Erstellen Sie ein **Service Account**:
   - Drücken Sie **Create Credentials** > **Service Account**.
   - Benennen Sie es nach Wunsch (z. B. `openclaw-chat`).
   - Lassen Sie Berechtigungen leer (drücken Sie **Continue**).
   - Lassen Sie Principals mit Zugriff leer (drücken Sie **Done**).
3. Erstellen und laden Sie den **JSON Key** herunter:
   - Klicken Sie in der Liste der Service Accounts auf das gerade erstellte Konto.
   - Wechseln Sie zum Tab **Keys**.
   - Klicken Sie auf **Add Key** > **Create new key**.
   - Wählen Sie **JSON** aus und drücken Sie **Create**.
4. Speichern Sie die heruntergeladene JSON-Datei auf Ihrem Gateway-Host (z. B. `~/.openclaw/googlechat-service-account.json`).
5. Erstellen Sie eine Google Chat-App in der [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Füllen Sie die **Application info** aus:
     - **App name**: (z. B. `OpenClaw`)
     - **Avatar URL**: (z. B. `https://openclaw.ai/logo.png`)
     - **Description**: (z. B. `Personal AI Assistant`)
   - Aktivieren Sie **Interactive features**.
   - Aktivieren Sie unter **Functionality** die Option **Join spaces and group conversations**.
   - Wählen Sie unter **Connection settings** die Option **HTTP endpoint URL** aus.
   - Wählen Sie unter **Triggers** die Option **Use a common HTTP endpoint URL for all triggers** aus und setzen Sie sie auf die öffentliche URL Ihres Gateways, gefolgt von `/googlechat`.
     - _Tipp: Führen Sie `openclaw status` aus, um die öffentliche URL Ihres Gateways zu finden._
   - Aktivieren Sie unter **Visibility** die Option **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Geben Sie Ihre E-Mail-Adresse (z. B. `user@example.com`) in das Textfeld ein.
   - Klicken Sie unten auf **Save**.
6. **Aktivieren Sie den App-Status**:
   - **Aktualisieren Sie die Seite** nach dem Speichern.
   - Suchen Sie den Abschnitt **App status** (nach dem Speichern normalerweise oben oder unten).
   - Ändern Sie den Status in **Live - available to users**.
   - Klicken Sie erneut auf **Save**.
7. Konfigurieren Sie OpenClaw mit dem Service-Account-Pfad + der Webhook-Audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Oder Konfiguration: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Legen Sie Typ + Wert der Webhook-Audience fest (entspricht Ihrer Chat-App-Konfiguration).
9. Starten Sie das Gateway. Google Chat sendet per POST an Ihren Webhook-Pfad.

## Zu Google Chat hinzufügen

Sobald das Gateway läuft und Ihre E-Mail zur Sichtbarkeitsliste hinzugefügt wurde:

1. Rufen Sie [Google Chat](https://chat.google.com/) auf.
2. Klicken Sie auf das **+**-Symbol (Plus) neben **Direct Messages**.
3. Geben Sie in der Suchleiste (in der Sie normalerweise Personen hinzufügen) den **App name** ein, den Sie in der Google Cloud Console konfiguriert haben.
   - **Hinweis**: Der Bot erscheint _nicht_ in der Durchsuchliste des „Marketplace“, da es sich um eine private App handelt. Sie müssen nach dem Namen suchen.
4. Wählen Sie Ihren Bot aus den Ergebnissen aus.
5. Klicken Sie auf **Add** oder **Chat**, um eine 1:1-Unterhaltung zu starten.
6. Senden Sie „Hello“, um den Assistenten auszulösen!

## Öffentliche URL (nur Webhook)

Google Chat-Webhooks erfordern einen öffentlichen HTTPS-Endpunkt. Aus Sicherheitsgründen sollten Sie **nur den Pfad `/googlechat`** im Internet freigeben. Halten Sie das OpenClaw-Dashboard und andere sensible Endpunkte in Ihrem privaten Netzwerk.

### Option A: Tailscale Funnel (empfohlen)

Verwenden Sie Tailscale Serve für das private Dashboard und Funnel für den öffentlichen Webhook-Pfad. Dadurch bleibt `/` privat, während nur `/googlechat` freigegeben wird.

1. **Prüfen Sie, an welche Adresse Ihr Gateway gebunden ist:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notieren Sie die IP-Adresse (z. B. `127.0.0.1`, `0.0.0.0` oder Ihre Tailscale-IP wie `100.x.x.x`).

2. **Geben Sie das Dashboard nur für das Tailnet frei (Port 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Geben Sie nur den Webhook-Pfad öffentlich frei:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisieren Sie den Node für Funnel-Zugriff:**
   Wenn Sie dazu aufgefordert werden, öffnen Sie die in der Ausgabe angezeigte Autorisierungs-URL, um Funnel für diesen Node in Ihrer Tailnet-Richtlinie zu aktivieren.

5. **Überprüfen Sie die Konfiguration:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ihre öffentliche Webhook-URL lautet:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ihr privates Dashboard bleibt nur im Tailnet erreichbar:
`https://<node-name>.<tailnet>.ts.net:8443/`

Verwenden Sie die öffentliche URL (ohne `:8443`) in der Google Chat-App-Konfiguration.

> Hinweis: Diese Konfiguration bleibt über Neustarts hinweg erhalten. Um sie später zu entfernen, führen Sie `tailscale funnel reset` und `tailscale serve reset` aus.

### Option B: Reverse Proxy (Caddy)

Wenn Sie einen Reverse Proxy wie Caddy verwenden, proxen Sie nur den spezifischen Pfad:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Mit dieser Konfiguration wird jede Anfrage an `your-domain.com/` ignoriert oder als 404 zurückgegeben, während `your-domain.com/googlechat` sicher an OpenClaw weitergeleitet wird.

### Option C: Cloudflare Tunnel

Konfigurieren Sie die Ingress-Regeln Ihres Tunnels so, dass nur der Webhook-Pfad geroutet wird:

- **Pfad**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Standardregel**: HTTP 404 (Nicht gefunden)

## Funktionsweise

1. Google Chat sendet Webhook-POSTs an das Gateway. Jede Anfrage enthält einen Header `Authorization: Bearer <token>`.
   - OpenClaw überprüft die Bearer-Authentifizierung, bevor vollständige Webhook-Bodies gelesen/geparst werden, wenn der Header vorhanden ist.
   - Google Workspace Add-on-Anfragen, die `authorizationEventObject.systemIdToken` im Body enthalten, werden über ein strengeres Pre-Auth-Body-Budget unterstützt.
2. OpenClaw überprüft das Token gegen den konfigurierten `audienceType` + `audience`:
   - `audienceType: "app-url"` → Audience ist Ihre HTTPS-Webhook-URL.
   - `audienceType: "project-number"` → Audience ist die Cloud-Projektnummer.
3. Nachrichten werden nach Gruppenbereich geroutet:
   - Direktnachrichten verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Gruppenbereiche verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:group:<spaceId>`.
4. Der Zugriff auf Direktnachrichten erfolgt standardmäßig per Pairing. Unbekannte Absender erhalten einen Pairing-Code; genehmigen Sie ihn mit:
   - `openclaw pairing approve googlechat <code>`
5. Gruppenbereiche erfordern standardmäßig eine @-Erwähnung. Verwenden Sie `botUser`, wenn die Erkennung von Erwähnungen den Benutzernamen der App benötigt.

## Ziele

Verwenden Sie diese Kennungen für Zustellung und Allowlists:

- Direktnachrichten: `users/<userId>` (empfohlen).
- Die rohe E-Mail-Adresse `name@example.com` ist veränderlich und wird nur für direkte Allowlist-Abgleiche verwendet, wenn `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Veraltet: `users/<email>` wird als Benutzer-ID behandelt, nicht als E-Mail-Allowlist.
- Gruppenbereiche: `spaces/<spaceId>`.

## Konfigurationshighlights

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
          allow: true,
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

- Service-Account-Anmeldedaten können auch inline mit `serviceAccount` (JSON-String) übergeben werden.
- `serviceAccountRef` wird ebenfalls unterstützt (Env-/Datei-SecretRef), einschließlich kontospezifischer Refs unter `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Der Standard-Webhook-Pfad ist `/googlechat`, wenn `webhookPath` nicht gesetzt ist.
- `dangerouslyAllowNameMatching` aktiviert den Abgleich veränderlicher E-Mail-Principals für Allowlists wieder (Break-Glass-Kompatibilitätsmodus).
- Reaktionen sind über das Tool `reactions` und `channels action` verfügbar, wenn `actions.reactions` aktiviert ist.
- Nachrichtenaktionen stellen `send` für Text und `upload-file` für explizite Anhangssendungen bereit. `upload-file` akzeptiert `media` / `filePath` / `path` plus optional `message`, `filename` und Thread-Zielangaben.
- `typingIndicator` unterstützt `none`, `message` (Standard) und `reaction` (Reaktion erfordert Benutzer-OAuth).
- Anhänge werden über die Chat API heruntergeladen und in der Medienpipeline gespeichert (Größe durch `mediaMaxMb` begrenzt).

Details zu Secret-Referenzen: [Secrets Management](/de/gateway/secrets).

## Fehlerbehebung

### 405 Method Not Allowed

Wenn Google Cloud Logs Explorer Fehler wie diese anzeigt:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

bedeutet dies, dass der Webhook-Handler nicht registriert ist. Häufige Ursachen:

1. **Channel nicht konfiguriert**: Der Abschnitt `channels.googlechat` fehlt in Ihrer Konfiguration. Überprüfen Sie dies mit:

   ```bash
   openclaw config get channels.googlechat
   ```

   Wenn „Config path not found“ zurückgegeben wird, fügen Sie die Konfiguration hinzu (siehe [Konfigurationshighlights](#konfigurationshighlights)).

2. **Plugin nicht aktiviert**: Prüfen Sie den Plugin-Status:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Wenn „disabled“ angezeigt wird, fügen Sie `plugins.entries.googlechat.enabled: true` zu Ihrer Konfiguration hinzu.

3. **Gateway nicht neu gestartet**: Starten Sie das Gateway nach dem Hinzufügen der Konfiguration neu:

   ```bash
   openclaw gateway restart
   ```

Überprüfen Sie, ob der Channel läuft:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Andere Probleme

- Prüfen Sie `openclaw channels status --probe` auf Authentifizierungsfehler oder fehlende Audience-Konfiguration.
- Wenn keine Nachrichten ankommen, bestätigen Sie die Webhook-URL + Ereignisabonnements der Chat-App.
- Wenn Mention-Gating Antworten blockiert, setzen Sie `botUser` auf den Benutzerressourcennamen der App und überprüfen Sie `requireMention`.
- Verwenden Sie `openclaw logs --follow`, während Sie eine Testnachricht senden, um zu sehen, ob Anfragen das Gateway erreichen.

Zugehörige Dokumentation:

- [Gateway-Konfiguration](/de/gateway/configuration)
- [Sicherheit](/de/gateway/security)
- [Reaktionen](/de/tools/reactions)

## Verwandt

- [Channel-Übersicht](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Channel-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
