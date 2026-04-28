---
read_when:
    - OpenClaw hinter einem identitätsbewussten Proxy betreiben
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten
    - WebSocket-1008-Fehler „unauthorized“ bei Reverse-Proxy-Setups beheben
    - Entscheiden, wo HSTS und andere HTTP-Härtungs-Header gesetzt werden sollen
sidebarTitle: Trusted proxy auth
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse-Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Vertrauenswürdige Proxy-Authentifizierung
x-i18n:
    generated_at: "2026-04-26T11:31:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Sicherheitskritisches Feature.** Dieser Modus delegiert die Authentifizierung vollständig an Ihren Reverse-Proxy. Eine Fehlkonfiguration kann Ihr Gateway unbefugtem Zugriff aussetzen. Lesen Sie diese Seite sorgfältig, bevor Sie die Funktion aktivieren.
</Warning>

## Wann verwenden

Verwenden Sie den Authentifizierungsmodus `trusted-proxy`, wenn:

- Sie OpenClaw hinter einem **identitätsbewussten Proxy** betreiben (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + Forward Auth).
- Ihr Proxy die gesamte Authentifizierung übernimmt und die Benutzeridentität über Header weitergibt.
- Sie sich in einer Kubernetes- oder Container-Umgebung befinden, in der der Proxy der einzige Pfad zum Gateway ist.
- Sie auf WebSocket-Fehler `1008 unauthorized` stoßen, weil Browser keine Tokens in WS-Payloads übergeben können.

## Wann NICHT verwenden

- Wenn Ihr Proxy Benutzer nicht authentifiziert (nur TLS-Terminierung oder Load Balancer).
- Wenn es irgendeinen Pfad zum Gateway gibt, der den Proxy umgeht (Firewall-Lücken, interner Netzwerkzugriff).
- Wenn Sie nicht sicher sind, ob Ihr Proxy weitergeleitete Header korrekt entfernt/überschreibt.
- Wenn Sie nur persönlichen Einzelbenutzerzugriff benötigen (erwägen Sie Tailscale Serve + Loopback für ein einfacheres Setup).

## So funktioniert es

<Steps>
  <Step title="Proxy authentifiziert den Benutzer">
    Ihr Reverse-Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.).
  </Step>
  <Step title="Proxy fügt einen Identitäts-Header hinzu">
    Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu (z. B. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway prüft vertrauenswürdige Quelle">
    OpenClaw prüft, ob die Anfrage von einer **vertrauenswürdigen Proxy-IP** stammt (konfiguriert in `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway extrahiert die Identität">
    OpenClaw extrahiert die Benutzeridentität aus dem konfigurierten Header.
  </Step>
  <Step title="Autorisieren">
    Wenn alles passt, wird die Anfrage autorisiert.
  </Step>
</Steps>

## Pairing-Verhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die Prüfungen für vertrauenswürdige Proxys besteht, können WebSocket-Sitzungen der Control UI auch ohne Geräte-Pairing-Identität eine Verbindung herstellen.

Auswirkungen:

- Pairing ist in diesem Modus nicht mehr die primäre Schranke für den Zugriff auf die Control UI.
- Ihre Authentifizierungsrichtlinie des Reverse-Proxys und `allowUsers` werden zur effektiven Zugriffskontrolle.
- Halten Sie den Gateway-Ingress ausschließlich auf vertrauenswürdige Proxy-IPs beschränkt (`gateway.trustedProxies` + Firewall).

## Konfiguration

```json5
{
  gateway: {
    // trusted-proxy-Authentifizierung erwartet Anfragen von einer vertrauenswürdigen Proxy-Quelle ohne Loopback
    bind: "lan",

    // KRITISCH: Nur die IP(s) Ihres Proxys hier hinzufügen
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header mit der authentifizierten Benutzeridentität (erforderlich)
        userHeader: "x-forwarded-user",

        // Optional: Header, die vorhanden sein MÜSSEN (Proxy-Verifizierung)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: auf bestimmte Benutzer beschränken (leer = alle zulassen)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Wichtige Laufzeitregeln**

- trusted-proxy-Authentifizierung lehnt Anfragen von Loopback-Quellen ab (`127.0.0.1`, `::1`, Loopback-CIDRs).
- Reverse-Proxys auf demselben Host mit Loopback erfüllen die trusted-proxy-Authentifizierung **nicht**.
- Für Proxy-Setups auf demselben Host mit Loopback verwenden Sie stattdessen Token-/Passwort-Authentifizierung oder leiten über eine vertrauenswürdige Proxy-Adresse ohne Loopback, die OpenClaw verifizieren kann.
- Nicht-Loopback-Deployments der Control UI benötigen weiterhin explizites `gateway.controlUi.allowedOrigins`.
- **Belege aus Forwarded-Headern überschreiben die Loopback-Lokalität.** Wenn eine Anfrage über Loopback eingeht, aber `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`-Header trägt, die auf einen nicht lokalen Ursprung zeigen, widerlegen diese Belege die Behauptung der Loopback-Lokalität. Die Anfrage wird für Pairing, trusted-proxy-Authentifizierung und das Gate für Geräteidentität der Control UI als entfernt behandelt. Das verhindert, dass ein Loopback-Proxy auf demselben Host die Identität aus Forwarded-Headern in die trusted-proxy-Authentifizierung einschleust.

</Warning>

### Konfigurationsreferenz

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array von Proxy-IP-Adressen, denen vertraut wird. Anfragen von anderen IPs werden abgelehnt.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Muss `"trusted-proxy"` sein.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Header-Name, der die authentifizierte Benutzeridentität enthält.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Zusätzliche Header, die vorhanden sein müssen, damit der Anfrage vertraut wird.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Allowlist von Benutzeridentitäten. Leer bedeutet, dass alle authentifizierten Benutzer zugelassen sind.
</ParamField>

## TLS-Terminierung und HSTS

Verwenden Sie einen einzigen Punkt für die TLS-Terminierung und wenden Sie dort HSTS an.

<Tabs>
  <Tab title="TLS-Terminierung am Proxy (empfohlen)">
    Wenn Ihr Reverse-Proxy HTTPS für `https://control.example.com` übernimmt, setzen Sie `Strict-Transport-Security` am Proxy für diese Domain.

    - Gut geeignet für internetzugängliche Deployments.
    - Hält Zertifikate + HTTP-Härtungsrichtlinie an einem Ort.
    - OpenClaw kann hinter dem Proxy auf Loopback-HTTP bleiben.

    Beispielwert für den Header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="TLS-Terminierung am Gateway">
    Wenn OpenClaw selbst direkt HTTPS bereitstellt (kein Proxy mit TLS-Terminierung), setzen Sie:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` akzeptiert einen Zeichenfolgenwert für den Header oder `false`, um explizit zu deaktivieren.

  </Tab>
</Tabs>

### Hinweise zur Einführung

- Beginnen Sie zunächst mit einem kurzen Max-Age-Wert (zum Beispiel `max-age=300`), während Sie den Traffic validieren.
- Erhöhen Sie auf langlebige Werte (zum Beispiel `max-age=31536000`) erst, wenn das Vertrauen hoch ist.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain für HTTPS bereit ist.
- Verwenden Sie Preload nur, wenn Sie die Preload-Anforderungen bewusst für Ihren gesamten Domainbestand erfüllen.
- Für reine lokale Entwicklung mit Loopback bringt HSTS keinen Nutzen.

## Beispiele für Proxy-Setups

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium übergibt Identität in `x-pomerium-claim-email` (oder anderen Claim-Headern) und ein JWT in `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP von Pomerium
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Konfigurationsausschnitt für Pomerium:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy mit OAuth">
    Caddy mit dem Plugin `caddy-security` kann Benutzer authentifizieren und Identitäts-Header weitergeben.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP von Caddy/Sidecar-Proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile-Ausschnitt:

    ```
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy authentifiziert Benutzer und übergibt die Identität in `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP von nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    nginx-Konfigurationsausschnitt:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik mit Forward Auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP des Traefik-Containers
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Gemischte Token-Konfiguration

OpenClaw lehnt mehrdeutige Konfigurationen ab, bei denen sowohl `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`) als auch der Modus `trusted-proxy` gleichzeitig aktiv sind. Gemischte Token-Konfigurationen können dazu führen, dass Loopback-Anfragen stillschweigend über den falschen Authentifizierungspfad authentifiziert werden.

Wenn Sie beim Start einen Fehler `mixed_trusted_proxy_token` sehen:

- Entfernen Sie das gemeinsame Token, wenn Sie den Modus trusted-proxy verwenden, oder
- setzen Sie `gateway.auth.mode` auf `"token"`, wenn Sie tokenbasierte Authentifizierung beabsichtigen.

Auch die Loopback-Authentifizierung per trusted-proxy schlägt fail-closed fehl: Aufrufer auf demselben Host müssen die konfigurierten Identitäts-Header über einen vertrauenswürdigen Proxy bereitstellen, statt stillschweigend authentifiziert zu werden.

## Header für Operator-Bereiche

Trusted-proxy-Authentifizierung ist ein **identitätstragender** HTTP-Modus, daher können Aufrufer optional Operator-Bereiche mit `x-openclaw-scopes` deklarieren.

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw den deklarierten Bereichssatz.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Bereiche.
- Wenn der Header fehlt, greifen normale identitätstragende HTTP-APIs auf den standardmäßigen Operatorsatz zurück.
- HTTP-Routen von Gateway-Auth-**Plugins** sind standardmäßig enger: Wenn `x-openclaw-scopes` fehlt, fällt ihr Laufzeitbereich auf `operator.write` zurück.
- Browserseitige HTTP-Anfragen müssen weiterhin `gateway.controlUi.allowedOrigins` bestehen (oder den absichtlichen Host-Header-Fallback-Modus), auch nachdem die trusted-proxy-Authentifizierung erfolgreich war.

Praktische Regel: Senden Sie `x-openclaw-scopes` explizit, wenn Sie möchten, dass eine trusted-proxy-Anfrage enger als die Standardwerte ist, oder wenn eine Gateway-Auth-Plugin-Route etwas Stärkeres als Schreibrechte benötigt.

## Sicherheits-Checkliste

Bevor Sie die trusted-proxy-Authentifizierung aktivieren, prüfen Sie:

- [ ] **Der Proxy ist der einzige Pfad**: Der Gateway-Port ist für alles außer Ihrem Proxy durch die Firewall gesperrt.
- [ ] **trustedProxies ist minimal**: Nur die tatsächlichen Proxy-IPs, keine ganzen Subnetze.
- [ ] **Keine Loopback-Proxy-Quelle**: trusted-proxy-Authentifizierung schlägt für Anfragen von Loopback-Quellen fail-closed fehl.
- [ ] **Proxy entfernt Header**: Ihr Proxy überschreibt (nicht anhängt) `x-forwarded-*`-Header von Clients.
- [ ] **TLS-Terminierung**: Ihr Proxy übernimmt TLS; Benutzer verbinden sich per HTTPS.
- [ ] **allowedOrigins ist explizit**: Nicht-Loopback-Control-UI verwendet explizites `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers ist gesetzt** (empfohlen): Beschränken Sie auf bekannte Benutzer, statt jeden authentifizierten Benutzer zuzulassen.
- [ ] **Keine gemischte Token-Konfiguration**: Setzen Sie nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"`.

## Sicherheitsprüfung

`openclaw security audit` markiert die trusted-proxy-Authentifizierung mit einem Fund der Schwere **kritisch**. Das ist beabsichtigt — es soll daran erinnern, dass Sie die Sicherheit an Ihr Proxy-Setup delegieren.

Die Prüfung kontrolliert Folgendes:

- Grundlegende Warnung/Kritische Erinnerung `gateway.trusted_proxy_auth`
- Fehlende Konfiguration von `trustedProxies`
- Fehlende Konfiguration von `userHeader`
- Leeres `allowUsers` (lässt jeden authentifizierten Benutzer zu)
- Wildcard- oder fehlende Browser-Origin-Richtlinie auf exponierten Oberflächen der Control UI

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Die Anfrage kam nicht von einer IP in `gateway.trustedProxies`. Prüfen Sie:

    - Ist die Proxy-IP korrekt? (IP-Adressen von Docker-Containern können sich ändern.)
    - Befindet sich ein Load Balancer vor Ihrem Proxy?
    - Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IPs zu finden.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw hat eine trusted-proxy-Anfrage von einer Loopback-Quelle abgelehnt.

    Prüfen Sie:

    - Verbindet sich der Proxy von `127.0.0.1` / `::1`?
    - Versuchen Sie, trusted-proxy-Authentifizierung mit einem Reverse-Proxy auf demselben Host über Loopback zu verwenden?

    Behebung:

    - Verwenden Sie Token-/Passwort-Authentifizierung für Proxy-Setups auf demselben Host mit Loopback, oder
    - leiten Sie über eine vertrauenswürdige Proxy-Adresse ohne Loopback und behalten Sie diese IP in `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Der Benutzer-Header war leer oder fehlte. Prüfen Sie:

    - Ist Ihr Proxy so konfiguriert, dass er Identitäts-Header weitergibt?
    - Ist der Header-Name korrekt? (Groß-/Kleinschreibung wird ignoriert, aber die Schreibweise muss stimmen)
    - Ist der Benutzer am Proxy tatsächlich authentifiziert?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Ein erforderlicher Header war nicht vorhanden. Prüfen Sie:

    - Ihre Proxy-Konfiguration für diese spezifischen Header.
    - Ob Header irgendwo in der Kette entfernt werden.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Der Benutzer ist authentifiziert, aber nicht in `allowUsers`. Fügen Sie ihn entweder hinzu oder entfernen Sie die Allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Die trusted-proxy-Authentifizierung war erfolgreich, aber der Browser-Header `Origin` hat die Origin-Prüfungen der Control UI nicht bestanden.

    Prüfen Sie:

    - `gateway.controlUi.allowedOrigins` enthält genau den Browser-Origin.
    - Sie verlassen sich nicht auf Wildcard-Origins, es sei denn, Sie möchten bewusst ein Allow-all-Verhalten.
    - Wenn Sie absichtlich den Host-Header-Fallback-Modus verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bewusst gesetzt.

  </Accordion>
  <Accordion title="WebSocket funktioniert immer noch nicht">
    Stellen Sie sicher, dass Ihr Proxy:

    - WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`).
    - die Identitäts-Header bei WebSocket-Upgrade-Anfragen weitergibt (nicht nur bei HTTP).
    - keinen separaten Authentifizierungspfad für WebSocket-Verbindungen hat.

  </Accordion>
</AccordionGroup>

## Migration von Token-Authentifizierung

Wenn Sie von Token-Authentifizierung zu trusted-proxy wechseln:

<Steps>
  <Step title="Den Proxy konfigurieren">
    Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weitergibt.
  </Step>
  <Step title="Den Proxy unabhängig testen">
    Testen Sie das Proxy-Setup unabhängig (curl mit Headern).
  </Step>
  <Step title="OpenClaw-Konfiguration aktualisieren">
    Aktualisieren Sie die OpenClaw-Konfiguration mit trusted-proxy-Authentifizierung.
  </Step>
  <Step title="Das Gateway neu starten">
    Starten Sie das Gateway neu.
  </Step>
  <Step title="WebSocket testen">
    Testen Sie WebSocket-Verbindungen aus der Control UI.
  </Step>
  <Step title="Prüfen">
    Führen Sie `openclaw security audit` aus und prüfen Sie die Ergebnisse.
  </Step>
</Steps>

## Verwandte Inhalte

- [Konfiguration](/de/gateway/configuration) — Konfigurationsreferenz
- [Remote-Zugriff](/de/gateway/remote) — andere Muster für Remote-Zugriff
- [Sicherheit](/de/gateway/security) — vollständiger Sicherheitsleitfaden
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für Zugriff nur im Tailnet
