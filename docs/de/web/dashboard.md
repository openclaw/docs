---
read_when:
    - Dashboard-Authentifizierung oder Zugriffsmodi ändern
summary: Zugriff und Authentifizierung für das Gateway-Dashboard (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-07-12T16:01:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Das Gateway-Dashboard ist die browserbasierte Control UI, die standardmäßig unter `/` bereitgestellt wird (überschreibbar mit `gateway.controlUi.basePath`).

Schnellzugriff (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))
- Verwenden Sie bei `gateway.tls.enabled: true` `https://127.0.0.1:18789/` und `wss://127.0.0.1:18789` für den WebSocket-Endpunkt.

Wichtige Referenzen:

- [Control UI](/de/web/control-ui) zur Verwendung und zu den UI-Funktionen.
- [Tailscale](/de/gateway/tailscale) zur Serve-/Funnel-Automatisierung.
- [Weboberflächen](/de/web) zu Bindungsmodi und Sicherheitshinweisen.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Authentifizierungspfad des Gateways erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Identitätsheader eines vertrauenswürdigen Proxys, wenn `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` unter [Gateway-Konfiguration](/de/gateway/configuration).

<Warning>
Die Control UI ist eine **Administrationsoberfläche** (Chat, Konfiguration, Ausführungsgenehmigungen). Machen Sie sie nicht öffentlich zugänglich. Die UI speichert Dashboard-URL-Token für den aktuellen Browser-Tab und die ausgewählte Gateway-URL im sessionStorage und entfernt sie nach dem Laden aus der URL. Bevorzugen Sie localhost, Tailscale Serve oder einen SSH-Tunnel.
</Warning>

## Schnellster Weg (empfohlen)

- Nach dem Onboarding öffnet die CLI automatisch das Dashboard und gibt einen bereinigten Link (ohne Token) aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet nach Möglichkeit einen Browser und gibt bei einem System ohne grafische Oberfläche einen SSH-Hinweis aus).
- Falls sowohl die Übergabe an die Zwischenablage als auch an den Browser fehlschlägt, gibt `openclaw dashboard` dennoch die bereinigte URL aus und weist Sie an, Ihr Token (aus `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.token`) unter dem URL-Fragment-Schlüssel `token` anzuhängen; der Tokenwert wird niemals in Protokollen ausgegeben.
- Wenn die UI zur Authentifizierung mit einem gemeinsamen Geheimnis auffordert, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.

## Grundlagen der Authentifizierung (lokal und remote)

- **Localhost**: Öffnen Sie `http://127.0.0.1:18789/`.
- **Gateway-TLS**: Bei `gateway.tls.enabled: true` verwenden Dashboard-/Statuslinks `https://` und WebSocket-Links der Control UI `wss://`.
- **Quelle des Tokens für das gemeinsame Geheimnis**: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` kann es für die einmalige Ersteinrichtung über ein URL-Fragment übergeben; die Control UI speichert es für den aktuellen Tab und die ausgewählte Gateway-URL im sessionStorage, nicht im localStorage.
- Wenn `gateway.auth.token` über SecretRef verwaltet wird, gibt `openclaw dashboard` absichtlich eine URL ohne Token aus, kopiert und öffnet sie, um extern verwaltete Token nicht in Shell-Protokollen, dem Verlauf der Zwischenablage oder Argumenten zum Browserstart offenzulegen. Wenn die Referenz in Ihrer aktuellen Shell nicht aufgelöst werden kann, werden weiterhin die URL ohne Token sowie konkrete Anweisungen zur Einrichtung der Authentifizierung ausgegeben.
- **Passwort für das gemeinsame Geheimnis**: Verwenden Sie das konfigurierte `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über Neuladevorgänge hinweg.
- **Identitätsbasierte Modi**: Tailscale Serve erfüllt die Authentifizierungsanforderungen der Control UI und des WebSockets über Identitätsheader, wenn `gateway.auth.allowTailscale: true` gilt; ein identitätsfähiger Reverse-Proxy außerhalb der Loopback-Schnittstelle erfüllt sie mit `gateway.auth.mode: "trusted-proxy"`. In keinem der beiden Fälle muss für den WebSocket ein gemeinsames Geheimnis eingefügt werden.
- **Nicht localhost**: Verwenden Sie Tailscale Serve, eine Bindung außerhalb der Loopback-Schnittstelle mit gemeinsamem Geheimnis, einen identitätsfähigen Reverse-Proxy außerhalb der Loopback-Schnittstelle mit `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin die Authentifizierung mit einem gemeinsamen Geheimnis, sofern Sie nicht bewusst den privaten Ingress-Modus `gateway.auth.mode: "none"` oder die HTTP-Authentifizierung über einen vertrauenswürdigen Proxy einsetzen. Siehe [Weboberflächen](/de/web).

## In Telegram öffnen

Telegram-Bots können das Dashboard mit `/dashboard` als Telegram Mini App öffnen.

Anforderungen:

- `gateway.tailscale.mode: "serve"` oder `"funnel"`, damit Telegram eine HTTPS-URL für die Mini App erhält.
- Der Telegram-Absender muss der Bot-Eigentümer sein: eine numerische Telegram-Benutzer-ID in `commands.ownerAllowFrom` oder im effektiven `channels.telegram.allowFrom` des ausgewählten Kontos.
- Führen Sie `/dashboard` in einer Direktnachricht mit dem Bot aus. Aufrufe in Gruppen weisen Sie lediglich darauf hin, den Befehl in einer Direktnachricht zu öffnen, und enthalten keine Schaltfläche.
- Docker-Installationen: Für die Modi Serve/Funnel muss das Gateway neben `tailscaled` an die Loopback-Schnittstelle gebunden sein, was Bridge-Netzwerke mit veröffentlichten Ports nicht ermöglichen. Führen Sie den Gateway-Container mit `network_mode: host` aus und binden Sie den `tailscaled`-Socket des Hosts (`/var/run/tailscale`) sowie die `tailscale`-CLI in den Container ein.

Die Mini App führt eine einmalige Übergabe durch den Eigentümer aus und leitet mit einem kurzlebigen Bootstrap-Token zur Control UI weiter. Dabei wird kein gemeinsames Gateway-Token in der URL offengelegt.

Nichtziele für v1:

- Der Telegram-Web-iframe wird nicht unterstützt.
- Tailscale Serve/Funnel ist der einzige unterstützte Pfad für eine veröffentlichte URL.

<a id="if-you-see-unauthorized-1008"></a>

## Wenn „unauthorized“ / 1008 angezeigt wird

- Vergewissern Sie sich, dass das Gateway erreichbar ist: lokal mit `openclaw status`; remote über den SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, öffnen Sie anschließend `http://127.0.0.1:18789/`.
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen einzigen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Geräte-Token durchführen, wenn das Gateway entsprechende Hinweise zurückgibt; dieser Versuch verwendet erneut die zwischengespeicherten genehmigten Geltungsbereiche des Tokens (Aufrufer mit explizitem `deviceToken`/`scopes` behalten die von ihnen angeforderte Gruppe von Geltungsbereichen bei). Wenn die Authentifizierung danach weiterhin fehlschlägt, beheben Sie die Token-Abweichung manuell.
- Bei `AUTH_SCOPE_MISMATCH` wurde das Geräte-Token erkannt, besitzt jedoch nicht die angeforderten Geltungsbereiche; koppeln Sie das Gerät erneut oder genehmigen Sie die neue Gruppe von Geltungsbereichen, statt das gemeinsame Gateway-Token zu rotieren.
- Außerhalb dieses Wiederholungspfads gilt für die Verbindungs-Authentifizierung folgende Priorität: explizites gemeinsames Token/Passwort, danach explizites `deviceToken`, danach gespeichertes Geräte-Token und schließlich Bootstrap-Token.
- Im asynchronen Tailscale-Serve-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Begrenzer für fehlgeschlagene Authentifizierungen sie erfasst. Daher kann bei einem zweiten gleichzeitig ausgeführten fehlerhaften Wiederholungsversuch bereits `retry later` angezeigt werden.
- Schritte zur Behebung einer Token-Abweichung finden Sie in der [Checkliste zur Wiederherstellung bei Token-Abweichungen](/de/cli/devices#token-drift-recovery-checklist).
- Rufen Sie das gemeinsame Geheimnis vom Gateway-Host ab oder stellen Sie es dort bereit:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: Lösen Sie das konfigurierte `gateway.auth.password` oder `OPENCLAW_GATEWAY_PASSWORD` auf.
  - Über SecretRef verwaltetes Token: Lösen Sie den externen Secret-Provider auf oder exportieren Sie `OPENCLAW_GATEWAY_TOKEN` in dieser Shell und führen Sie `openclaw dashboard` erneut aus.
  - Kein gemeinsames Geheimnis konfiguriert: `openclaw doctor --generate-gateway-token`
- Fügen Sie in den Dashboard-Einstellungen das Token oder Passwort in das Authentifizierungsfeld ein und stellen Sie anschließend die Verbindung her.
- Die Sprachauswahl der UI befindet sich unter **Settings -> General -> Language**, nicht unter Appearance.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [WebChat](/de/web/webchat)
