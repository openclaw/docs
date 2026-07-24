---
read_when:
    - Dashboard-Authentifizierung oder Expositionsmodi ändern
summary: Zugriff und Authentifizierung für das Gateway-Dashboard (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-07-24T05:25:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca531ad2943dfdee1cd90a4efdc1fb69c4517780e2be52237fd558b8638e7cd0
    source_path: web/dashboard.md
    workflow: 16
---

Das Gateway-Dashboard ist die browserbasierte Control UI, die standardmäßig unter `/` bereitgestellt wird (Überschreibung mit `gateway.controlUi.basePath`).

Schnellzugriff (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))
- Verwenden Sie mit `gateway.tls.enabled: true` für den WebSocket-Endpunkt `https://127.0.0.1:18789/` und `wss://127.0.0.1:18789`.

Wichtige Referenzen:

- [Control UI](/de/web/control-ui) für Verwendung und UI-Funktionen.
- [Tailscale](/de/gateway/tailscale) für die Serve-/Funnel-Automatisierung.
- [Weboberflächen](/de/web) für Bindungsmodi und Sicherheitshinweise.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Gateway-Authentifizierungspfad erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader bei `gateway.auth.allowTailscale: true`
- Identitätsheader eines vertrauenswürdigen Proxys bei `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` unter [Gateway-Konfiguration](/de/gateway/configuration).

<Warning>
Die Control UI ist eine **Administrationsoberfläche** (Chat, Konfiguration, Ausführungsgenehmigungen). Machen Sie sie nicht öffentlich zugänglich. Die UI speichert Dashboard-URL-Token für den aktuellen Browser-Tab und die ausgewählte Gateway-URL in sessionStorage und entfernt sie nach dem Laden aus der URL. Bevorzugen Sie localhost, Tailscale Serve oder einen SSH-Tunnel.
</Warning>

## Schnellster Weg (empfohlen)

- Nach dem Onboarding öffnet die CLI automatisch das Dashboard und gibt einen bereinigten Link (ohne Token) aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet nach Möglichkeit einen Browser und gibt in einer Umgebung ohne grafische Oberfläche einen SSH-Hinweis aus).
- Wenn sowohl die Übermittlung über die Zwischenablage als auch über den Browser fehlschlägt, gibt `openclaw dashboard` weiterhin die bereinigte URL aus und fordert Sie auf, Ihr Token (aus `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.token`) als URL-Fragmentschlüssel `token` anzuhängen; der Tokenwert wird niemals in Protokollen ausgegeben.
- Wenn die UI zur Authentifizierung mit einem gemeinsamen Geheimnis auffordert, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.

## Grundlagen der Authentifizierung (lokal und remote)

- **Localhost**: Öffnen Sie `http://127.0.0.1:18789/`.
- **Gateway-TLS**: Wenn `gateway.tls.enabled: true` gilt, verwenden Dashboard-/Statuslinks `https://` und WebSocket-Links der Control UI `wss://`.
- **Quelle des Tokens für das gemeinsame Geheimnis**: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` kann es für die einmalige Ersteinrichtung über ein URL-Fragment übergeben; die Control UI speichert es für den aktuellen Tab und die ausgewählte Gateway-URL in sessionStorage, nicht in localStorage.
- **Laufzeit-Token bei fehlender Konfiguration**: Wenn beim Start gemeldet wird, dass ein Laufzeit-Token generiert wurde, ist dieses Token flüchtig und nicht über `openclaw config get gateway.auth.token` verfügbar. Auch Loopback erfordert eine Authentifizierung. Führen Sie `openclaw doctor --generate-gateway-token` aus, starten Sie das Gateway neu und fügen Sie anschließend das konfigurierte Token in die Einstellungen der Control UI ein.
- Wenn `gateway.auth.token` über SecretRef verwaltet wird, gibt `openclaw dashboard` absichtlich eine URL ohne Token aus, kopiert sie beziehungsweise öffnet sie, damit extern verwaltete Token nicht in Shell-Protokollen, dem Verlauf der Zwischenablage oder Browser-Startargumenten offengelegt werden. Wenn die Referenz in Ihrer aktuellen Shell nicht aufgelöst werden kann, wird weiterhin die URL ohne Token zusammen mit konkreten Anweisungen zur Einrichtung der Authentifizierung ausgegeben.
- **Passwort für das gemeinsame Geheimnis**: Verwenden Sie das konfigurierte `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über ein erneutes Laden hinweg.
- **Identitätsbasierte Modi**: Tailscale Serve erfüllt die Authentifizierungsanforderungen für Control UI/WebSocket über Identitätsheader, wenn `gateway.auth.allowTailscale: true` gilt; ein identitätsfähiger Reverse-Proxy außerhalb von Loopback erfüllt `gateway.auth.mode: "trusted-proxy"`. Für WebSocket muss in keinem der beiden Fälle ein gemeinsames Geheimnis eingefügt werden.
- **Nicht localhost**: Verwenden Sie Tailscale Serve, eine Bindung außerhalb von Loopback mit gemeinsamem Geheimnis, einen identitätsfähigen Reverse-Proxy außerhalb von Loopback mit `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin die Authentifizierung mit gemeinsamem Geheimnis, sofern Sie nicht bewusst `gateway.auth.mode: "none"` für privaten Ingress oder HTTP-Authentifizierung über einen vertrauenswürdigen Proxy einsetzen. Siehe [Weboberflächen](/de/web).

## In Telegram öffnen

Telegram-Bots können das Dashboard mit `/dashboard` als Telegram Mini App öffnen.

Anforderungen:

- `gateway.tailscale.mode: "serve"` oder `"funnel"`, damit Telegram eine HTTPS-URL für die Mini App erhält.
- Der Telegram-Absender muss der Bot-Eigentümer sein: eine numerische Telegram-Benutzer-ID in `commands.ownerAllowFrom` oder der effektive Wert von `channels.telegram.allowFrom` für das ausgewählte Konto.
- Führen Sie `/dashboard` in einer Direktnachricht an den Bot aus. Bei Aufrufen in Gruppen wird lediglich darauf hingewiesen, den Befehl in einer Direktnachricht zu öffnen; eine Schaltfläche wird nicht angezeigt.
- Docker-Installationen: Serve-/Funnel-Modi setzen voraus, dass das Gateway neben `tailscaled` an Loopback gebunden ist; dies ist mit Bridge-Netzwerken und veröffentlichten Ports nicht möglich. Führen Sie den Gateway-Container mit `network_mode: host` aus und binden Sie den Socket `tailscaled` des Hosts (`/var/run/tailscale`) sowie die CLI `tailscale` in den Container ein.

Die Mini App führt eine einmalige Übergabe des Eigentümers durch und leitet mit einem kurzlebigen Bootstrap-Token zur Control UI weiter. Sie legt kein gemeinsames Gateway-Token in der URL offen.

Nichtziele für v1:

- Der Telegram-Web-iframe wird nicht unterstützt.
- Tailscale Serve/Funnel ist der einzige unterstützte Pfad für eine veröffentlichte URL.

<a id="if-you-see-unauthorized-1008"></a>

## Wenn „unauthorized“ / 1008 angezeigt wird

- Vergewissern Sie sich, dass das Gateway erreichbar ist: lokal über `openclaw status`; remote über den SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, öffnen Sie anschließend `http://127.0.0.1:18789/`.
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen einzelnen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Geräte-Token ausführen, wenn das Gateway Hinweise für einen Wiederholungsversuch zurückgibt; dieser Wiederholungsversuch verwendet erneut die zwischengespeicherten genehmigten Geltungsbereiche des Tokens (Aufrufer mit explizitem `deviceToken`/`scopes` behalten den von ihnen angeforderten Satz von Geltungsbereichen bei). Wenn die Authentifizierung auch nach diesem Wiederholungsversuch fehlschlägt, beheben Sie die Token-Abweichung manuell.
- Bei `AUTH_SCOPE_MISMATCH` wurde das Geräte-Token erkannt, enthält jedoch nicht die angeforderten Geltungsbereiche; koppeln Sie das Gerät erneut oder genehmigen Sie den neuen Satz von Geltungsbereichen, anstatt das gemeinsame Gateway-Token zu rotieren.
- Außerhalb dieses Wiederholungsversuchspfads gilt für die Verbindungs-Authentifizierung folgende Rangfolge: explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Begrenzer für fehlgeschlagene Authentifizierungen sie erfasst. Daher kann bei einem zweiten gleichzeitigen fehlerhaften Wiederholungsversuch bereits `retry later` angezeigt werden.
- Schritte zur Behebung von Token-Abweichungen finden Sie in der [Checkliste zur Wiederherstellung bei Token-Abweichungen](/de/cli/devices#token-drift-recovery-checklist).
- Rufen Sie das gemeinsame Geheimnis vom Gateway-Host ab oder stellen Sie es dort bereit:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: Lösen Sie das konfigurierte `gateway.auth.password` oder `OPENCLAW_GATEWAY_PASSWORD` auf
  - Über SecretRef verwaltetes Token: Lösen Sie den externen Geheimnis-Provider auf oder exportieren Sie `OPENCLAW_GATEWAY_TOKEN` in dieser Shell und führen Sie `openclaw dashboard` erneut aus
  - Laufzeit-Token wurde generiert, weil kein gemeinsames Geheimnis konfiguriert war: Führen Sie `openclaw doctor --generate-gateway-token` aus, starten Sie das Gateway neu und verwenden Sie anschließend das konfigurierte Token
- Fügen Sie in den Dashboard-Einstellungen das Token oder Passwort in das Authentifizierungsfeld ein und stellen Sie anschließend die Verbindung her.
- Die Sprachauswahl der UI befindet sich unter **Settings -> General -> Language**, nicht unter Appearance.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [WebChat](/de/web/webchat)
