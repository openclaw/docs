---
read_when:
    - Dashboard-Authentifizierung oder Freigabemodi ändern
summary: Zugriff und Authentifizierung für das Gateway-Dashboard (Steuerungs-UI)
title: Übersicht
x-i18n:
    generated_at: "2026-05-11T20:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Das Gateway-Dashboard ist die browserbasierte Steuerungs-UI, die standardmäßig unter `/` bereitgestellt wird
(überschreibbar mit `gateway.controlUi.basePath`).

Schnell öffnen (lokales Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))
- Mit `gateway.tls.enabled: true` verwenden Sie `https://127.0.0.1:18789/` und
  `wss://127.0.0.1:18789` für den WebSocket-Endpunkt.

Wichtige Referenzen:

- [Steuerungs-UI](/de/web/control-ui) für Nutzung und UI-Funktionen.
- [Tailscale](/de/gateway/tailscale) für Serve/Funnel-Automatisierung.
- [Web-Oberflächen](/de/web) für Bind-Modi und Sicherheitshinweise.

Die Authentifizierung wird beim WebSocket-Handshake über den konfigurierten Gateway-
Authentifizierungspfad erzwungen:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Identitätsheader eines vertrauenswürdigen Proxys, wenn `gateway.auth.mode: "trusted-proxy"`

Siehe `gateway.auth` in der [Gateway-Konfiguration](/de/gateway/configuration).

Sicherheitshinweis: Die Steuerungs-UI ist eine **Administrationsoberfläche** (Chat, Konfiguration, Ausführungsgenehmigungen).
Setzen Sie sie nicht öffentlich frei. Die UI speichert Dashboard-URL-Token in sessionStorage
für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL und entfernt sie nach dem Laden aus der URL.
Bevorzugen Sie localhost, Tailscale Serve oder einen SSH-Tunnel.

## Schneller Weg (empfohlen)

- Nach dem Onboarding öffnet die CLI das Dashboard automatisch und gibt einen sauberen (nicht tokenisierten) Link aus.
- Jederzeit erneut öffnen: `openclaw dashboard` (kopiert den Link, öffnet nach Möglichkeit den Browser, zeigt bei Headless-Umgebungen einen SSH-Hinweis).
- Wenn Zwischenablage und Browser-Übergabe fehlschlagen, gibt `openclaw dashboard` dennoch die
  saubere URL aus und weist Sie an, das Token aus `OPENCLAW_GATEWAY_TOKEN` oder
  `gateway.auth.token` als URL-Fragment-Schlüssel `token` zu verwenden; Token-
  Werte werden nicht in Logs ausgegeben.
- Wenn die UI zur Shared-Secret-Authentifizierung auffordert, fügen Sie das konfigurierte Token oder
  Passwort in die Einstellungen der Steuerungs-UI ein.

## Authentifizierungsgrundlagen (lokal und remote)

- **Localhost**: Öffnen Sie `http://127.0.0.1:18789/`.
- **Gateway-TLS**: Wenn `gateway.tls.enabled: true`, verwenden Dashboard-/Statuslinks
  `https://` und WebSocket-Links der Steuerungs-UI `wss://`.
- **Shared-Secret-Token-Quelle**: `gateway.auth.token` (oder
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kann es für das einmalige Bootstrap
  über ein URL-Fragment übergeben, und die Steuerungs-UI speichert es in sessionStorage für die
  aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL statt in localStorage.
- Wenn `gateway.auth.token` über SecretRef verwaltet wird, gibt `openclaw dashboard`
  absichtlich eine nicht tokenisierte URL aus, kopiert sie oder öffnet sie. Dadurch wird vermieden,
  extern verwaltete Token in Shell-Logs, Zwischenablageverläufen oder Browser-Startargumenten offenzulegen.
- Wenn `gateway.auth.token` als SecretRef konfiguriert ist und in Ihrer
  aktuellen Shell nicht aufgelöst ist, gibt `openclaw dashboard` dennoch eine nicht tokenisierte URL plus
  umsetzbare Hinweise zur Authentifizierungseinrichtung aus.
- **Shared-Secret-Passwort**: Verwenden Sie das konfigurierte `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_PASSWORD`). Das Dashboard speichert Passwörter nicht über
  Neuladevorgänge hinweg.
- **Modi mit Identität**: Tailscale Serve kann die Authentifizierung der Steuerungs-UI/des WebSocket
  über Identitätsheader erfüllen, wenn `gateway.auth.allowTailscale: true`, und ein
  nicht an Loopback gebundener identitätsbewusster Reverse-Proxy kann
  `gateway.auth.mode: "trusted-proxy"` erfüllen. In diesen Modi benötigt das Dashboard
  kein eingefügtes Shared Secret für den WebSocket.
- **Nicht localhost**: Verwenden Sie Tailscale Serve, eine nicht an Loopback gebundene Shared-Secret-Bindung, einen
  nicht an Loopback gebundenen identitätsbewussten Reverse-Proxy mit
  `gateway.auth.mode: "trusted-proxy"` oder einen SSH-Tunnel. HTTP-APIs verwenden weiterhin
  Shared-Secret-Authentifizierung, sofern Sie nicht bewusst
  `gateway.auth.mode: "none"` für private Ingress-Umgebungen oder trusted-proxy-HTTP-Authentifizierung ausführen. Siehe
  [Web-Oberflächen](/de/web).

<a id="if-you-see-unauthorized-1008"></a>

## Wenn Sie "unauthorized" / 1008 sehen

- Stellen Sie sicher, dass das Gateway erreichbar ist (lokal: `openclaw status`; remote: SSH-Tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen).
- Bei `AUTH_TOKEN_MISMATCH` können Clients einen vertrauenswürdigen Wiederholungsversuch mit einem zwischengespeicherten Gerätetoken durchführen, wenn das Gateway Wiederholungshinweise zurückgibt. Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet die zwischengespeicherten genehmigten Scopes des Tokens erneut; Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten ihre angeforderte Scope-Menge. Wenn die Authentifizierung danach weiterhin fehlschlägt, beheben Sie die Token-Abweichung manuell.
- Bei `AUTH_SCOPE_MISMATCH` wurde das Gerätetoken erkannt, enthält aber nicht die vom Dashboard angeforderten Scopes; koppeln Sie erneut oder genehmigen Sie den angeforderten Scope-Vertrag, statt das gemeinsame Gateway-Token zu rotieren.
- Außerhalb dieses Wiederholungspfads gilt für die Verbindungs-Authentifizierung diese Reihenfolge: explizites Shared Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
- Im asynchronen Tailscale Serve-Pfad der Steuerungs-UI werden fehlgeschlagene Versuche für denselben
  `{scope, ip}` serialisiert, bevor der Limiter für fehlgeschlagene Authentifizierung sie erfasst, sodass
  der zweite gleichzeitig fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
- Für Schritte zur Behebung von Token-Abweichungen folgen Sie der [Checkliste zur Wiederherstellung bei Token-Abweichung](/de/cli/devices#token-drift-recovery-checklist).
- Rufen Sie das Shared Secret vom Gateway-Host ab oder stellen Sie es dort bereit:
  - Token: `openclaw config get gateway.auth.token`
  - Passwort: Lösen Sie das konfigurierte `gateway.auth.password` oder
    `OPENCLAW_GATEWAY_PASSWORD` auf
  - SecretRef-verwaltetes Token: Lösen Sie den externen Secret-Provider auf oder exportieren Sie
    `OPENCLAW_GATEWAY_TOKEN` in dieser Shell und führen Sie dann `openclaw dashboard` erneut aus
  - Kein Shared Secret konfiguriert: `openclaw doctor --generate-gateway-token`
- Fügen Sie in den Dashboard-Einstellungen das Token oder Passwort in das Authentifizierungsfeld ein,
  und verbinden Sie sich dann.
- Die UI-Sprachauswahl befindet sich unter **Übersicht -> Gateway-Zugriff -> Sprache**.
  Sie ist Teil der Zugriffskarte, nicht des Bereichs Darstellung.

## Verwandt

- [Steuerungs-UI](/de/web/control-ui)
- [WebChat](/de/web/webchat)
