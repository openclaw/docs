---
read_when:
    - Dashboard-Authentifizierung oder Expositionsmodi ändern
summary: Zugriff und Authentifizierung für das Gateway-Dashboard (Control UI)
title: Übersicht
x-i18n:
    generated_at: "2026-05-05T01:50:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Das Gateway-Dashboard ist die browserbasierte Control UI, die standardmäßig unter `/` bereitgestellt wird
(überschreiben mit `gateway.controlUi.basePath`).

Schnell öffnen (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))
- Mit `gateway.tls.enabled: true` verwenden Sie `https://127.0.0.1:18789/` und
  `wss://127.0.0.1:18789` für den WebSocket-Endpunkt.

Wichtige Referenzen:

- [Control UI](/de/web/control-ui) für Nutzung und UI-Funktionen.
- [Tailscale](/de/gateway/tailscale) für Serve/Funnel-Automatisierung.
- [Web-Oberflächen](/de/web) für Bind-Modi und Sicherheitshinweise.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Gateway-
Authentifizierungspfad erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identitäts-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitäts-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` in der [Gateway-Konfiguration](/de/gateway/configuration).

Sicherheitshinweis: Die Control UI ist eine **Admin-Oberfläche** (Chat, Konfiguration, Ausführungsgenehmigungen).
Machen Sie sie nicht öffentlich zugänglich. Die UI speichert Dashboard-URL-Tokens in sessionStorage
für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL und entfernt sie nach dem Laden aus der URL.
Bevorzugen Sie localhost, Tailscale Serve oder einen SSH-Tunnel.

## Schneller Weg (empfohlen)

- Nach dem Onboarding öffnet die CLI automatisch das Dashboard und gibt einen sauberen (nicht tokenisierten) Link aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet wenn möglich den Browser, zeigt bei Headless-Umgebungen einen SSH-Hinweis).
- Wenn Zwischenablage und Browser-Übergabe fehlschlagen, gibt `openclaw dashboard` trotzdem die
  saubere URL aus und weist Sie an, das Token aus `OPENCLAW_GATEWAY_TOKEN` oder
  `gateway.auth.token` als URL-Fragment-Schlüssel `token` zu verwenden; Token-
  Werte werden nicht in Logs ausgegeben.
- Wenn die UI zur Shared-Secret-Authentifizierung auffordert, fügen Sie das konfigurierte Token oder
  Passwort in die Einstellungen der Control UI ein.

## Auth-Grundlagen (lokal vs. remote)

- **Localhost**: Öffnen Sie `http://127.0.0.1:18789/`.
- **Gateway-TLS**: Wenn `gateway.tls.enabled: true`, verwenden Dashboard-/Statuslinks
  `https://` und WebSocket-Links der Control UI `wss://`.
- **Shared-Secret-Token-Quelle**: `gateway.auth.token` (oder
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kann es für ein einmaliges
  Bootstrap über das URL-Fragment übergeben, und die Control UI speichert es in sessionStorage für die
  aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL statt in localStorage.
- Wenn `gateway.auth.token` SecretRef-verwaltet ist, gibt `openclaw dashboard`
  absichtlich eine nicht tokenisierte URL aus/kopiert/öffnet sie. Dadurch wird vermieden,
  extern verwaltete Tokens in Shell-Logs, dem Verlauf der Zwischenablage oder Browser-Startargumenten offenzulegen.
- Wenn `gateway.auth.token` als SecretRef konfiguriert ist und in Ihrer
  aktuellen Shell nicht aufgelöst ist, gibt `openclaw dashboard` trotzdem eine nicht tokenisierte URL plus
  umsetzbare Hinweise zur Auth-Einrichtung aus.
- **Shared-Secret-Passwort**: Verwenden Sie das konfigurierte `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über
  Neuladevorgänge hinweg.
- **Identitätstragende Modi**: Tailscale Serve kann die Authentifizierung für Control UI/WebSocket
  über Identitäts-Header erfüllen, wenn `gateway.auth.allowTailscale: true`, und ein
  nicht auf loopback beschränkter identitätsbewusster Reverse Proxy kann
  `gateway.auth.mode: "trusted-proxy"` erfüllen. In diesen Modi benötigt das Dashboard
  kein eingefügtes Shared Secret für den WebSocket.
- **Nicht localhost**: Verwenden Sie Tailscale Serve, eine nicht auf loopback beschränkte Shared-Secret-Bindung, einen
  nicht auf loopback beschränkten identitätsbewussten Reverse Proxy mit
  `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin
  Shared-Secret-Authentifizierung, sofern Sie nicht bewusst den Private-Ingress-Modus
  `gateway.auth.mode: "none"` oder Trusted-Proxy-HTTP-Auth verwenden. Siehe
  [Web-Oberflächen](/de/web).

<a id="if-you-see-unauthorized-1008"></a>

## Wenn Sie „unauthorized“ / 1008 sehen

- Stellen Sie sicher, dass das Gateway erreichbar ist (lokal: `openclaw status`; remote: SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen).
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Geräte-Token durchführen, wenn das Gateway Wiederholungshinweise zurückgibt. Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet die zwischengespeicherten genehmigten Scopes des Tokens wieder; Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten ihren angeforderten Scope-Satz. Wenn die Authentifizierung nach diesem Wiederholungsversuch weiterhin fehlschlägt, beheben Sie die Token-Abweichung manuell.
- Außerhalb dieses Wiederholungspfads gilt für die Verbindungs-Authentifizierung diese Priorität: zuerst explizites Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Auf dem asynchronen Tailscale Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe
  `{scope, ip}` serialisiert, bevor der Failed-Auth-Limiter sie aufzeichnet, sodass
  der zweite gleichzeitig fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
- Schritte zur Reparatur von Token-Abweichungen finden Sie in der [Checkliste zur Wiederherstellung bei Token-Abweichung](/de/cli/devices#token-drift-recovery-checklist).
- Rufen Sie das Shared Secret vom Gateway-Host ab oder stellen Sie es dort bereit:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: Lösen Sie das konfigurierte `gateway.auth.password` oder
    `OPENCLAW_GATEWAY_PASSWORD` auf
  - SecretRef-verwaltetes Token: Lösen Sie den externen Secret-Provider auf oder exportieren Sie
    `OPENCLAW_GATEWAY_TOKEN` in dieser Shell und führen Sie dann `openclaw dashboard` erneut aus
  - Kein Shared Secret konfiguriert: `openclaw doctor --generate-gateway-token`
- Fügen Sie in den Dashboard-Einstellungen das Token oder Passwort in das Auth-Feld ein,
  und verbinden Sie sich dann.
- Die Sprachauswahl der UI befindet sich unter **Übersicht -> Gateway-Zugriff -> Sprache**.
  Sie ist Teil der Zugriffskarte, nicht des Bereichs Darstellung.

## Verwandt

- [Control UI](/de/web/control-ui)
- [WebChat](/de/web/webchat)
