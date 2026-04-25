---
read_when:
    - Ändern der Authentifizierung oder der Freigabemodi des Dashboards
summary: Zugriff auf das Gateway-Dashboard (Control UI) und Authentifizierung
title: Dashboard
x-i18n:
    generated_at: "2026-04-25T13:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

Das Gateway-Dashboard ist die browserbasierte Control UI, die standardmäßig unter `/` bereitgestellt wird
(überschreibbar mit `gateway.controlUi.basePath`).

Schnell öffnen (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))
- Mit `gateway.tls.enabled: true` verwende `https://127.0.0.1:18789/` und
  `wss://127.0.0.1:18789` für den WebSocket-Endpunkt.

Wichtige Referenzen:

- [Control UI](/de/web/control-ui) für Nutzung und UI-Funktionen.
- [Tailscale](/de/gateway/tailscale) für die Automatisierung mit Serve/Funnel.
- [Web surfaces](/de/web) für Bindungsmodi und Sicherheitshinweise.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Gateway-
Authentifizierungspfad erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identity-Header, wenn `gateway.auth.allowTailscale: true`
- Identity-Header vertrauenswürdiger Proxys, wenn `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` in der [Gateway-Konfiguration](/de/gateway/configuration).

Sicherheitshinweis: Die Control UI ist eine **Admin-Oberfläche** (Chat, Konfiguration, Ausführungsfreigaben).
Sie sollte nicht öffentlich zugänglich gemacht werden. Die UI speichert Dashboard-URL-Token in `sessionStorage`
für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL und entfernt sie nach dem Laden aus der URL.
Bevorzuge localhost, Tailscale Serve oder einen SSH-Tunnel.

## Schnellpfad (empfohlen)

- Nach dem Onboarding öffnet die CLI das Dashboard automatisch und gibt einen sauberen Link ohne Token aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet den Browser, wenn möglich, und zeigt einen SSH-Hinweis an, wenn headless).
- Wenn die UI nach einer Authentifizierung mit gemeinsamem Geheimnis fragt, füge das konfigurierte Token oder
  Passwort in die Einstellungen der Control UI ein.

## Grundlagen der Authentifizierung (lokal vs. remote)

- **Localhost**: Öffne `http://127.0.0.1:18789/`.
- **Gateway-TLS**: Wenn `gateway.tls.enabled: true`, verwenden
  Dashboard-/Status-Links `https://` und Control-UI-WebSocket-Links `wss://`.
- **Quelle für Shared-Secret-Token**: `gateway.auth.token` (oder
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kann es über ein URL-Fragment
  für einmaliges Bootstrap übergeben, und die Control UI speichert es in `sessionStorage` für die
  aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL statt in `localStorage`.
- Wenn `gateway.auth.token` als SecretRef verwaltet wird, gibt `openclaw dashboard`
  absichtlich eine URL ohne Token aus, kopiert und öffnet sie. Dadurch wird vermieden,
  extern verwaltete Token in Shell-Logs, der Zwischenablagen-Historie oder Browser-Startargumenten offenzulegen.
- Wenn `gateway.auth.token` als SecretRef konfiguriert ist und in deiner
  aktuellen Shell nicht aufgelöst werden kann, gibt `openclaw dashboard` dennoch eine URL ohne Token sowie
  konkrete Hinweise zur Einrichtung der Authentifizierung aus.
- **Shared-Secret-Passwort**: Verwende das konfigurierte `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über
  Neuladevorgänge hinweg.
- **Modi mit Identitätsübertragung**: Tailscale Serve kann die Authentifizierung für Control UI/WebSocket
  über Identity-Header erfüllen, wenn `gateway.auth.allowTailscale: true`, und ein
  nicht auf Loopback beschränkter Reverse-Proxy mit Identitätsbewusstsein kann dies bei
  `gateway.auth.mode: "trusted-proxy"` ebenfalls leisten. In diesen Modi benötigt das Dashboard
  kein eingefügtes Shared Secret für den WebSocket.
- **Nicht localhost**: Verwende Tailscale Serve, ein nicht auf Loopback beschränktes Shared-Secret-Binding, einen
  nicht auf Loopback beschränkten Reverse-Proxy mit Identitätsbewusstsein und
  `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin
  die Shared-Secret-Authentifizierung, es sei denn, du betreibst absichtlich einen privaten Ingress mit
  `gateway.auth.mode: "none"` oder HTTP-Authentifizierung über trusted-proxy. Siehe
  [Web surfaces](/de/web).

<a id="if-you-see-unauthorized-1008"></a>

## Wenn du „unauthorized“ / 1008 siehst

- Stelle sicher, dass das Gateway erreichbar ist (lokal: `openclaw status`; remote: SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen).
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Gerätetoken durchführen, wenn das Gateway Retry-Hinweise zurückgibt. Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet die zwischengespeicherten genehmigten Scopes des Tokens erneut; Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten ihren angeforderten Scope-Satz bei. Wenn die Authentifizierung nach diesem Wiederholungsversuch weiterhin fehlschlägt, behebe die Token-Abweichung manuell.
- Außerhalb dieses Wiederholungspfads ist die Priorität für Connect-Authentifizierung wie folgt: zuerst explizites Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe
  `{scope, ip}` serialisiert, bevor der Failed-Auth-Limiter sie erfasst, daher kann bereits der zweite gleichzeitige fehlerhafte Wiederholungsversuch `retry later` anzeigen.
- Für Schritte zur Behebung von Token-Abweichungen folge der [Checkliste zur Wiederherstellung bei Token-Abweichung](/de/cli/devices#token-drift-recovery-checklist).
- Hole oder übergib das Shared Secret vom Gateway-Host:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: das konfigurierte `gateway.auth.password` oder
    `OPENCLAW_GATEWAY_PASSWORD` auflösen
  - SecretRef-verwaltetes Token: den externen Secret-Anbieter auflösen oder
    `OPENCLAW_GATEWAY_TOKEN` in dieser Shell exportieren und dann `openclaw dashboard`
    erneut ausführen
  - Kein Shared Secret konfiguriert: `openclaw doctor --generate-gateway-token`
- Füge in den Dashboard-Einstellungen das Token oder Passwort in das Auth-Feld ein
  und verbinde dich dann.
- Die Sprachauswahl der UI befindet sich unter **Overview -> Gateway Access -> Language**.
  Sie ist Teil der Zugriffskarte, nicht des Bereichs Appearance.

## Zugehörig

- [Control UI](/de/web/control-ui)
- [WebChat](/de/web/webchat)
