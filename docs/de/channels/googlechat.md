---
read_when:
    - Arbeiten an Funktionen des Google Chat-Kanals
summary: Supportstatus, Funktionen und Konfiguration der Google Chat-App
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Status: herunterladbares Plugin für Direktnachrichten + Spaces über Google Chat API-Webhooks (nur HTTP).

## Installation

Installieren Sie Google Chat, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokaler Checkout (wenn Sie aus einem Git-Repo ausführen):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Schnelle Einrichtung (Einsteiger)

1. Erstellen Sie ein Google Cloud-Projekt und aktivieren Sie die **Google Chat API**.
   - Gehen Sie zu: [Google Chat API-Anmeldedaten](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Aktivieren Sie die API, falls sie noch nicht aktiviert ist.
2. Erstellen Sie ein **Dienstkonto**:
   - Klicken Sie auf **Create Credentials** > **Service Account**.
   - Benennen Sie es beliebig (z. B. `openclaw-chat`).
   - Lassen Sie Berechtigungen leer (klicken Sie auf **Continue**).
   - Lassen Sie Principals mit Zugriff leer (klicken Sie auf **Done**).
3. Erstellen Sie den **JSON Key** und laden Sie ihn herunter:
   - Klicken Sie in der Liste der Dienstkonten auf das gerade erstellte Konto.
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
   - Wählen Sie unter **Connection settings** die Option **HTTP endpoint URL** aus.
   - Wählen Sie unter **Triggers** die Option **Use a common HTTP endpoint URL for all triggers** aus und setzen Sie sie auf die öffentliche URL Ihres Gateways, gefolgt von `/googlechat`.
     - _Tipp: Führen Sie `openclaw status` aus, um die öffentliche URL Ihres Gateways zu finden._
   - Aktivieren Sie unter **Visibility** die Option **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Geben Sie Ihre E-Mail-Adresse (z. B. `user@example.com`) in das Textfeld ein.
   - Klicken Sie unten auf **Save**.
6. **Aktivieren Sie den App-Status**:
   - **Aktualisieren Sie die Seite** nach dem Speichern.
   - Suchen Sie den Abschnitt **App status** (nach dem Speichern meist oben oder unten).
   - Ändern Sie den Status zu **Live - available to users**.
   - Klicken Sie erneut auf **Save**.
7. Konfigurieren Sie OpenClaw mit dem Dienstkonto-Pfad + der Webhook-Audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Oder Konfiguration: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Legen Sie Webhook-Audience-Typ + Wert fest (entspricht Ihrer Chat-App-Konfiguration).
9. Starten Sie das Gateway. Google Chat sendet POST-Anfragen an Ihren Webhook-Pfad.

## Zu Google Chat hinzufügen

Sobald das Gateway läuft und Ihre E-Mail zur Sichtbarkeitsliste hinzugefügt wurde:

1. Öffnen Sie [Google Chat](https://chat.google.com/).
2. Klicken Sie auf das **+**-Symbol (Plus) neben **Direct Messages**.
3. Geben Sie in der Suchleiste (wo Sie normalerweise Personen hinzufügen) den **App-Namen** ein, den Sie in der Google Cloud Console konfiguriert haben.
   - **Hinweis**: Der Bot erscheint _nicht_ in der „Marketplace“-Durchsuchliste, da er eine private App ist. Sie müssen nach seinem Namen suchen.
4. Wählen Sie Ihren Bot aus den Ergebnissen aus.
5. Klicken Sie auf **Add** oder **Chat**, um eine 1:1-Unterhaltung zu starten.
6. Senden Sie „Hello“, um den Assistenten auszulösen!

## Öffentliche URL (nur Webhook)

Google Chat-Webhooks erfordern einen öffentlichen HTTPS-Endpunkt. Aus Sicherheitsgründen sollten Sie **nur den Pfad `/googlechat`** im Internet verfügbar machen. Halten Sie das OpenClaw-Dashboard und andere sensible Endpunkte in Ihrem privaten Netzwerk.

### Option A: Tailscale Funnel (empfohlen)

Verwenden Sie Tailscale Serve für das private Dashboard und Funnel für den öffentlichen Webhook-Pfad. Dadurch bleibt `/` privat, während nur `/googlechat` veröffentlicht wird.

1. **Prüfen Sie, an welche Adresse Ihr Gateway gebunden ist:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notieren Sie die IP-Adresse (z. B. `127.0.0.1`, `0.0.0.0` oder Ihre Tailscale-IP wie `100.x.x.x`).

2. **Machen Sie das Dashboard nur im Tailnet verfügbar (Port 8443):**

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

4. **Autorisieren Sie den Node für Funnel-Zugriff:**
   Wenn Sie dazu aufgefordert werden, öffnen Sie die in der Ausgabe angezeigte Autorisierungs-URL, um Funnel für diesen Node in Ihrer Tailnet-Richtlinie zu aktivieren.

5. **Überprüfen Sie die Konfiguration:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ihre öffentliche Webhook-URL lautet:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ihr privates Dashboard bleibt auf das Tailnet beschränkt:
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

Konfigurieren Sie die Ingress-Regeln Ihres Tunnels so, dass nur der Webhook-Pfad weitergeleitet wird:

- **Pfad**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Standardregel**: HTTP 404 (Not Found)

## Funktionsweise

1. Google Chat sendet Webhook-POSTs an das Gateway. Jede Anfrage enthält einen Header `Authorization: Bearer <token>`.
   - OpenClaw verifiziert die Bearer-Authentifizierung, bevor vollständige Webhook-Bodys gelesen/geparst werden, wenn der Header vorhanden ist.
   - Google Workspace Add-on-Anfragen, die `authorizationEventObject.systemIdToken` im Body enthalten, werden über ein strengeres Pre-Auth-Body-Budget unterstützt.
2. OpenClaw verifiziert das Token gegen den konfigurierten `audienceType` + `audience`:
   - `audienceType: "app-url"` → Audience ist Ihre HTTPS-Webhook-URL.
   - `audienceType: "project-number"` → Audience ist die Cloud-Projektnummer.
3. Nachrichten werden nach Space weitergeleitet:
   - Direktnachrichten verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces verwenden den Sitzungsschlüssel `agent:<agentId>:googlechat:group:<spaceId>`.
4. Der Zugriff auf Direktnachrichten erfolgt standardmäßig per Pairing. Unbekannte Absender erhalten einen Pairing-Code; genehmigen Sie ihn mit:
   - `openclaw pairing approve googlechat <code>`
5. Gruppen-Spaces erfordern standardmäßig eine @-Erwähnung. Verwenden Sie `botUser`, wenn die Erwähnungserkennung den Benutzernamen der App benötigt.
6. Wenn eine Exec- oder Plugin-Genehmigungsanfrage aus Google Chat startet und ein stabiler `users/<id>`-Genehmiger konfiguriert ist, postet OpenClaw eine native Google Chat-Genehmigungskarte im ursprünglichen Space oder Thread. Die Kartenbuttons verwenden opake Callback-Tokens, und die manuelle Aufforderung `/approve <id> <decision>` wird nur angezeigt, wenn native Genehmigungszustellung nicht verfügbar ist.

## Ziele

Verwenden Sie diese Bezeichner für Zustellung und Allowlists:

- Direktnachrichten: `users/<userId>` (empfohlen).
- Die rohe E-Mail `name@example.com` ist veränderlich und wird nur für direkte Allowlist-Abgleiche verwendet, wenn `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Veraltet: `users/<email>` wird als Benutzer-ID behandelt, nicht als E-Mail-Allowlist.
- Spaces: `spaces/<spaceId>`.

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
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Hinweise:

- Dienstkonto-Anmeldedaten können auch inline mit `serviceAccount` (JSON-String) übergeben werden.
- `serviceAccountRef` wird ebenfalls unterstützt (Env/File SecretRef), einschließlich refs pro Konto unter `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Der Standard-Webhook-Pfad ist `/googlechat`, wenn `webhookPath` nicht gesetzt ist.
- `dangerouslyAllowNameMatching` aktiviert den Abgleich veränderlicher E-Mail-Principals für Allowlists erneut (Break-Glass-Kompatibilitätsmodus).
- Reaktionen sind über das Tool `reactions` und `channels action` verfügbar, wenn `actions.reactions` aktiviert ist.
- Native Genehmigungskarten verwenden Google Chat `cardsV2`-Buttonklicks, keine Reaktionsereignisse. Genehmiger stammen aus `dm.allowFrom` oder `defaultTo` und müssen stabile numerische `users/<id>`-Werte sein.
- Nachrichtenaktionen stellen `send` für Text und `upload-file` für explizite Anhangsendungen bereit. `upload-file` akzeptiert `media` / `filePath` / `path` plus optional `message`, `filename` und Thread-Zielauswahl.
- `typingIndicator` unterstützt `message` (Standard), `none` und `reaction` (`reaction` erfordert Benutzer-OAuth).
- Anhänge werden über die Chat API heruntergeladen und in der Medienpipeline gespeichert (Größe durch `mediaMaxMb` begrenzt).
- Von Bots verfasste Google Chat-Nachrichten werden standardmäßig ignoriert. Wenn Sie absichtlich `allowBots: true` setzen, verwenden akzeptierte von Bots verfasste Nachrichten den gemeinsamen [Bot-Loop-Schutz](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` und überschreiben Sie dann mit `channels.googlechat.botLoopProtection` oder `channels.googlechat.groups.<space>.botLoopProtection`, wenn ein Space ein anderes Budget benötigt.

Details zur Secrets-Referenz: [Secrets-Verwaltung](/de/gateway/secrets).

## Fehlerbehebung

### 405 Method Not Allowed

Wenn Google Cloud Logs Explorer Fehler wie diese anzeigt:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

bedeutet das, dass der Webhook-Handler nicht registriert ist. Häufige Ursachen:

1. **Kanal nicht konfiguriert**: Der Abschnitt `channels.googlechat` fehlt in Ihrer Konfiguration. Überprüfen Sie dies mit:

   ```bash
   openclaw config get channels.googlechat
   ```

   Wenn „Config path not found“ zurückgegeben wird, fügen Sie die Konfiguration hinzu (siehe [Konfigurationshighlights](#config-highlights)).

2. **Plugin nicht aktiviert**: Prüfen Sie den Plugin-Status:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Wenn „disabled“ angezeigt wird, fügen Sie `plugins.entries.googlechat.enabled: true` zu Ihrer Konfiguration hinzu.

3. **Gateway nicht neu gestartet**: Starten Sie nach dem Hinzufügen der Konfiguration das Gateway neu:

   ```bash
   openclaw gateway restart
   ```

Überprüfen Sie, ob der Kanal läuft:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Andere Probleme

- Prüfen Sie `openclaw channels status --probe` auf Authentifizierungsfehler oder fehlende Audience-Konfiguration.
- Wenn keine Nachrichten eintreffen, bestätigen Sie die Webhook-URL + Ereignisabonnements der Chat-App.
- Wenn Erwähnungs-Gating Antworten blockiert, setzen Sie `botUser` auf den Benutzerressourcennamen der App und überprüfen Sie `requireMention`.
- Verwenden Sie `openclaw logs --follow`, während Sie eine Testnachricht senden, um zu sehen, ob Anfragen das Gateway erreichen.

Verwandte Dokumentation:

- [Gateway-Konfiguration](/de/gateway/configuration)
- [Sicherheit](/de/gateway/security)
- [Reaktionen](/de/tools/reactions)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
