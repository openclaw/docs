---
read_when:
    - Dashboard-Authentifizierung oder Expositionsmodi ändern
summary: Gateway-Dashboard (Control UI) Zugriff und Authentifizierung
title: Dashboard
x-i18n:
    generated_at: "2026-04-23T06:37:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

Das Gateway-Dashboard ist die browserbasierte Control UI, die standardmäßig unter `/` bereitgestellt wird
(überschreibbar mit `gateway.controlUi.basePath`).

Schnell öffnen (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wichtige Referenzen:

- [Control UI](/de/web/control-ui) für Nutzung und UI-Funktionen.
- [Tailscale](/de/gateway/tailscale) für Serve-/Funnel-Automatisierung.
- [Web surfaces](/de/web) für Bind-Modi und Sicherheitshinweise.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Gateway-
Auth-Pfad erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` in [Gateway configuration](/de/gateway/configuration).

Sicherheitshinweis: Die Control UI ist eine **Admin-Oberfläche** (Chat, Konfiguration, Exec-Genehmigungen).
Stelle sie nicht öffentlich bereit. Die UI speichert Dashboard-URL-Tokens in `sessionStorage`
für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL und entfernt sie nach dem Laden aus der URL.
Bevorzuge localhost, Tailscale Serve oder einen SSH-Tunnel.

## Schnellpfad (empfohlen)

- Nach dem Onboarding öffnet die CLI das Dashboard automatisch und gibt einen sauberen Link (ohne Token) aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet wenn möglich den Browser, zeigt bei Headless-Setups einen SSH-Hinweis).
- Wenn die UI zur Authentifizierung mit einem gemeinsamen Secret auffordert, füge das konfigurierte Token oder
  Passwort in die Einstellungen der Control UI ein.

## Grundlagen der Authentifizierung (lokal vs. remote)

- **Localhost**: Öffne `http://127.0.0.1:18789/`.
- **Quelle für Shared-Secret-Token**: `gateway.auth.token` (oder
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kann es über ein URL-Fragment
  für einmaliges Bootstrap übergeben, und die Control UI speichert es in `sessionStorage` für die
  aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL statt in `localStorage`.
- Wenn `gateway.auth.token` per SecretRef verwaltet wird, gibt `openclaw dashboard`
  absichtlich eine URL ohne Token aus/kopiert sie/öffnet sie. Dadurch wird vermieden,
  extern verwaltete Tokens in Shell-Logs, Zwischenablageverlauf oder Browser-Startargumenten offenzulegen.
- Wenn `gateway.auth.token` als SecretRef konfiguriert ist und in deiner
  aktuellen Shell nicht aufgelöst werden kann, gibt `openclaw dashboard` dennoch eine URL ohne Token plus
  umsetzbare Hinweise zur Einrichtung der Auth aus.
- **Shared-Secret-Passwort**: Verwende das konfigurierte `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über
  Reloads hinweg.
- **Identitätstragende Modi**: Tailscale Serve kann Auth für Control UI/WebSocket
  über Identitätsheader erfüllen, wenn `gateway.auth.allowTailscale: true`, und ein
  identitätsbewusster Reverse Proxy ohne Loopback kann
  `gateway.auth.mode: "trusted-proxy"` erfüllen. In diesen Modi benötigt das Dashboard
  kein eingefügtes Shared Secret für den WebSocket.
- **Nicht localhost**: Verwende Tailscale Serve, einen Bind ohne Loopback mit Shared Secret, einen
  identitätsbewussten Reverse Proxy ohne Loopback mit
  `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin
  Shared-Secret-Auth, sofern du nicht absichtlich privaten Ingress mit
  `gateway.auth.mode: "none"` oder Trusted-Proxy-HTTP-Auth verwendest. Siehe
  [Web surfaces](/de/web).

<a id="if-you-see-unauthorized-1008"></a>

## Wenn du „unauthorized“ / 1008 siehst

- Stelle sicher, dass das Gateway erreichbar ist (lokal: `openclaw status`; remote: SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen).
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Geräte-Token durchführen, wenn das Gateway Hinweise zum Wiederholen zurückgibt. Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet die zwischengespeicherten genehmigten Scopes des Tokens erneut; Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten ihre angeforderte Scope-Menge. Wenn die Auth nach diesem Wiederholungsversuch weiterhin fehlschlägt, behebe die Token-Abweichung manuell.
- Außerhalb dieses Wiederholungspfads gilt bei Connect-Auth folgende Priorität: explizites gemeinsames Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe
  `{scope, ip}` serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass der zweite gleichzeitige fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
- Für Schritte zur Behebung von Token-Abweichungen folge der [Token drift recovery checklist](/de/cli/devices#token-drift-recovery-checklist).
- Rufe das Shared Secret vom Gateway-Host ab oder gib es an:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: das konfigurierte `gateway.auth.password` oder
    `OPENCLAW_GATEWAY_PASSWORD` auflösen
  - SecretRef-verwaltetes Token: den externen Secret-Provider auflösen oder
    `OPENCLAW_GATEWAY_TOKEN` in dieser Shell exportieren und dann `openclaw dashboard`
    erneut ausführen
  - Kein Shared Secret konfiguriert: `openclaw doctor --generate-gateway-token`
- Füge in den Dashboard-Einstellungen das Token oder Passwort in das Auth-Feld ein
  und verbinde dich dann.
- Die Sprachauswahl der UI befindet sich unter **Overview -> Gateway Access -> Language**.
  Sie ist Teil der Zugriffskarte, nicht des Bereichs Appearance.
