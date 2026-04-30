---
read_when:
    - OpenClaw hinter einem identitätsbasierten Proxy betreiben
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten
    - Beheben von WebSocket-1008-Unauthorized-Fehlern bei Reverse-Proxy-Konfigurationen
    - Festlegen, wo HSTS und andere HTTP-Härtungs-Header gesetzt werden
sidebarTitle: Trusted proxy auth
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Authentifizierung über vertrauenswürdige Proxys
x-i18n:
    generated_at: "2026-04-30T06:57:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Sicherheitsrelevante Funktion.** Dieser Modus delegiert die Authentifizierung vollständig an Ihren Reverse Proxy. Eine Fehlkonfiguration kann Ihren Gateway für unbefugten Zugriff öffnen. Lesen Sie diese Seite sorgfältig, bevor Sie ihn aktivieren.
</Warning>

## Wann verwenden

Verwenden Sie den Auth-Modus `trusted-proxy`, wenn:

- Sie OpenClaw hinter einem **identitätsbewussten Proxy** betreiben (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + Forward Auth).
- Ihr Proxy die gesamte Authentifizierung übernimmt und die Benutzeridentität über Header weitergibt.
- Sie sich in einer Kubernetes- oder Container-Umgebung befinden, in der der Proxy der einzige Pfad zum Gateway ist.
- Sie WebSocket-Fehler `1008 unauthorized` erhalten, weil Browser keine Tokens in WS-Payloads übergeben können.

## Wann NICHT verwenden

- Wenn Ihr Proxy Benutzer nicht authentifiziert (nur ein TLS-Terminator oder Load Balancer ist).
- Wenn es irgendeinen Pfad zum Gateway gibt, der den Proxy umgeht (Firewall-Lücken, interner Netzwerkzugriff).
- Wenn Sie unsicher sind, ob Ihr Proxy weitergeleitete Header korrekt entfernt/überschreibt.
- Wenn Sie nur persönlichen Zugriff für einen einzelnen Benutzer benötigen (ziehen Sie Tailscale Serve + Loopback für eine einfachere Einrichtung in Betracht).

## Funktionsweise

<Steps>
  <Step title="Proxy authentifiziert den Benutzer">
    Ihr Reverse Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.).
  </Step>
  <Step title="Proxy fügt einen Identitäts-Header hinzu">
    Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu (z. B. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway prüft die vertrauenswürdige Quelle">
    OpenClaw prüft, ob die Anfrage von einer **vertrauenswürdigen Proxy-IP** stammt (konfiguriert in `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway extrahiert die Identität">
    OpenClaw extrahiert die Benutzeridentität aus dem konfigurierten Header.
  </Step>
  <Step title="Autorisieren">
    Wenn alle Prüfungen erfolgreich sind, wird die Anfrage autorisiert.
  </Step>
</Steps>

## Kopplungsverhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die trusted-proxy-Prüfungen besteht, können WebSocket-Sitzungen der Control UI ohne Geräte-Kopplungsidentität verbunden werden.

Auswirkungen:

- Die Kopplung ist in diesem Modus nicht mehr das primäre Gate für den Zugriff auf die Control UI.
- Ihre Auth-Richtlinie des Reverse Proxy und `allowUsers` werden zur effektiven Zugriffskontrolle.
- Beschränken Sie den Gateway-Ingress ausschließlich auf vertrauenswürdige Proxy-IPs (`gateway.trustedProxies` + Firewall).

## Konfiguration

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Wichtige Laufzeitregeln**

- Trusted-proxy-Auth lehnt Anfragen aus Loopback-Quellen (`127.0.0.1`, `::1`, Loopback-CIDRs) standardmäßig ab.
- Loopback-Reverse-Proxys auf demselben Host erfüllen trusted-proxy-Auth **nicht**, es sei denn, Sie setzen ausdrücklich `gateway.auth.trustedProxy.allowLoopback = true` und nehmen die Loopback-Adresse in `gateway.trustedProxies` auf.
- `allowLoopback` vertraut lokalen Prozessen auf dem Gateway-Host im gleichen Maße wie dem Reverse Proxy. Aktivieren Sie dies nur, wenn der Gateway weiterhin durch eine Firewall vor direktem Remote-Zugriff geschützt ist und der lokale Proxy vom Client gelieferte Identitäts-Header entfernt oder überschreibt.
- Interne Gateway-Clients, die nicht über den Reverse Proxy laufen, sollten `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` verwenden, nicht trusted-proxy-Identitäts-Header.
- Nicht-Loopback-Deployments der Control UI benötigen weiterhin explizit `gateway.controlUi.allowedOrigins`.
- **Forwarded-Header-Nachweise übersteuern Loopback-Lokalität für lokalen Direkt-Fallback.** Wenn eine Anfrage über Loopback eingeht, aber `X-Forwarded-For`- / `X-Forwarded-Host`- / `X-Forwarded-Proto`-Header mitführt, die auf einen nicht lokalen Ursprung zeigen, schließt dieser Nachweis den lokalen direkten Passwort-Fallback und die Geräteidentitätsprüfung aus. Mit `allowLoopback: true` kann trusted-proxy-Auth die Anfrage weiterhin als Proxy-Anfrage vom selben Host akzeptieren, während `requiredHeaders` und `allowUsers` weiterhin gelten.

</Warning>

### Konfigurationsreferenz

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array von Proxy-IP-Adressen, denen vertraut werden soll. Anfragen von anderen IPs werden abgelehnt.
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
  Zulassungsliste von Benutzeridentitäten. Leer bedeutet, dass alle authentifizierten Benutzer zugelassen sind.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Explizit aktivierbare Unterstützung für Loopback-Reverse-Proxys auf demselben Host. Standardwert ist `false`.
</ParamField>

<Warning>
Aktivieren Sie `allowLoopback` nur, wenn der lokale Reverse Proxy die beabsichtigte Vertrauensgrenze ist. Jeder lokale Prozess, der sich mit dem Gateway verbinden kann, kann versuchen, Proxy-Identitäts-Header zu senden. Halten Sie daher den direkten Gateway-Zugriff auf den Host beschränkt und verlangen Sie vom Proxy verwaltete Header wie `x-forwarded-proto` oder einen signierten Assertion-Header, sofern Ihr Proxy einen unterstützt.
</Warning>

## TLS-Terminierung und HSTS

Verwenden Sie einen TLS-Terminierungspunkt und wenden Sie HSTS dort an.

<Tabs>
  <Tab title="Proxy-TLS-Terminierung (empfohlen)">
    Wenn Ihr Reverse Proxy HTTPS für `https://control.example.com` verarbeitet, setzen Sie `Strict-Transport-Security` am Proxy für diese Domain.

    - Gut geeignet für internetseitige Deployments.
    - Hält Zertifikat und HTTP-Härtungsrichtlinie an einem Ort.
    - OpenClaw kann hinter dem Proxy auf Loopback-HTTP bleiben.

    Beispiel-Header-Wert:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway-TLS-Terminierung">
    Wenn OpenClaw selbst HTTPS direkt bereitstellt (ohne TLS-terminierenden Proxy), setzen Sie:

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

    `strictTransportSecurity` akzeptiert einen String-Header-Wert oder `false`, um die Funktion ausdrücklich zu deaktivieren.

  </Tab>
</Tabs>

### Rollout-Leitfaden

- Beginnen Sie zunächst mit einer kurzen maximalen Dauer (zum Beispiel `max-age=300`), während Sie den Traffic validieren.
- Erhöhen Sie erst dann auf langlebige Werte (zum Beispiel `max-age=31536000`), wenn das Vertrauen hoch ist.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain HTTPS-bereit ist.
- Verwenden Sie Preload nur, wenn Sie die Preload-Anforderungen für Ihren vollständigen Domain-Satz bewusst erfüllen.
- Lokale Entwicklung nur über Loopback profitiert nicht von HSTS.

## Beispiele für Proxy-Einrichtung

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium übergibt Identität in `x-pomerium-claim-email` (oder anderen Claim-Headern) und ein JWT in `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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

    Pomerium-Konfigurationsausschnitt:

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
    Caddy kann mit dem `caddy-security`-Plugin Benutzer authentifizieren und Identitäts-Header weitergeben.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
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
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
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
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

OpenClaw lehnt mehrdeutige Konfigurationen ab, bei denen sowohl ein `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`) als auch der Modus `trusted-proxy` gleichzeitig aktiv sind. Gemischte Token-Konfigurationen können dazu führen, dass Loopback-Anfragen stillschweigend über den falschen Auth-Pfad authentifiziert werden.

Wenn beim Start ein Fehler `mixed_trusted_proxy_token` angezeigt wird:

- Entfernen Sie das gemeinsame Token, wenn Sie den trusted-proxy-Modus verwenden, oder
- Wechseln Sie `gateway.auth.mode` zu `"token"`, wenn Sie tokenbasierte Auth beabsichtigen.

Loopback-trusted-proxy-Identitäts-Header schlagen weiterhin sicher fehl: Aufrufer vom selben Host werden nicht stillschweigend als Proxy-Benutzer authentifiziert. Interne OpenClaw-Aufrufer, die den Proxy umgehen, können sich stattdessen mit `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` authentifizieren. Token-Fallback bleibt im trusted-proxy-Modus absichtlich nicht unterstützt.

## Operator-Scopes-Header

Trusted-proxy-Auth ist ein **identitätstragender** HTTP-Modus, daher können Aufrufer optional Operator-Scopes mit `x-openclaw-scopes` deklarieren.

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw den deklarierten Scope-Satz.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Scopes.
- Wenn der Header fehlt, fallen normale identitätstragende HTTP-APIs auf den standardmäßigen Operator-Default-Scope-Satz zurück.
- Gateway-Auth-**Plugin-HTTP-Routen** sind standardmäßig enger gefasst: Wenn `x-openclaw-scopes` fehlt, fällt ihr Laufzeit-Scope auf `operator.write` zurück.
- HTTP-Anfragen aus Browser-Ursprüngen müssen weiterhin `gateway.controlUi.allowedOrigins` (oder den bewusst gewählten Host-Header-Fallback-Modus) bestehen, auch nachdem trusted-proxy-Auth erfolgreich war.

Praktische Regel: Senden Sie `x-openclaw-scopes` explizit, wenn eine trusted-proxy-Anfrage enger sein soll als die Standardwerte oder wenn eine Gateway-Auth-Plugin-Route etwas Stärkeres als Schreib-Scope benötigt.

## Sicherheitscheckliste

Prüfen Sie vor dem Aktivieren der Trusted-Proxy-Authentifizierung:

- [ ] **Proxy ist der einzige Pfad**: Der Gateway-Port ist gegen alles außer Ihrem Proxy per Firewall abgeschirmt.
- [ ] **trustedProxies ist minimal**: Nur die tatsächlichen IPs Ihres Proxys, keine ganzen Subnetze.
- [ ] **Loopback-Proxy-Quelle ist bewusst gewählt**: Trusted-Proxy-Authentifizierung schlägt für Anfragen von Loopback-Quellen sicher fehl, sofern `gateway.auth.trustedProxy.allowLoopback` nicht ausdrücklich für einen Proxy auf demselben Host aktiviert ist.
- [ ] **Proxy entfernt Header**: Ihr Proxy überschreibt `x-forwarded-*`-Header von Clients, statt sie anzuhängen.
- [ ] **TLS-Terminierung**: Ihr Proxy verarbeitet TLS; Benutzer verbinden sich per HTTPS.
- [ ] **allowedOrigins ist explizit**: Eine Steuerungsoberfläche außerhalb von Loopback verwendet explizite `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers ist gesetzt** (empfohlen): Beschränken Sie den Zugriff auf bekannte Benutzer, statt alle authentifizierten Personen zuzulassen.
- [ ] **Keine gemischte Token-Konfiguration**: Legen Sie nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"` fest.
- [ ] **Lokaler Passwort-Fallback ist privat**: Wenn Sie `gateway.auth.password` für interne direkte Aufrufer konfigurieren, schirmen Sie den Gateway-Port per Firewall ab, damit Remote-Clients außerhalb des Proxys ihn nicht direkt erreichen können.

## Sicherheits-Audit

`openclaw security audit` meldet Trusted-Proxy-Authentifizierung mit einem Befund der Schwere **kritisch**. Das ist beabsichtigt: Es erinnert Sie daran, dass Sie die Sicherheit an Ihre Proxy-Einrichtung delegieren.

Das Audit prüft auf:

- Grundlegende Warnung/kritische Erinnerung `gateway.trusted_proxy_auth`
- Fehlende `trustedProxies`-Konfiguration
- Fehlende `userHeader`-Konfiguration
- Leere `allowUsers` (lässt jeden authentifizierten Benutzer zu)
- Aktiviertes `allowLoopback` für Proxy-Quellen auf demselben Host
- Platzhalter- oder fehlende Browser-Origin-Richtlinie auf exponierten Oberflächen der Steuerungsoberfläche

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Die Anfrage kam nicht von einer IP in `gateway.trustedProxies`. Prüfen Sie:

    - Ist die Proxy-IP korrekt? (Docker-Container-IPs können sich ändern.)
    - Befindet sich vor Ihrem Proxy ein Load Balancer?
    - Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IPs zu finden.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw hat eine Trusted-Proxy-Anfrage von einer Loopback-Quelle abgelehnt.

    Prüfen Sie:

    - Verbindet sich der Proxy von `127.0.0.1` / `::1`?
    - Versuchen Sie, Trusted-Proxy-Authentifizierung mit einem Loopback-Reverse-Proxy auf demselben Host zu verwenden?

    Behebung:

    - Bevorzugen Sie Token-/Passwort-Authentifizierung für interne Clients auf demselben Host, die nicht über den Proxy gehen, oder
    - Leiten Sie über eine Nicht-Loopback-Adresse eines vertrauenswürdigen Proxys und behalten Sie diese IP in `gateway.trustedProxies`, oder
    - Setzen Sie für einen bewusst eingesetzten Reverse-Proxy auf demselben Host `gateway.auth.trustedProxy.allowLoopback = true`, behalten Sie die Loopback-Adresse in `gateway.trustedProxies`, und stellen Sie sicher, dass der Proxy Identitäts-Header entfernt oder überschreibt.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Der Benutzer-Header war leer oder fehlte. Prüfen Sie:

    - Ist Ihr Proxy so konfiguriert, dass er Identitäts-Header weitergibt?
    - Ist der Header-Name korrekt? (Groß-/Kleinschreibung ist unerheblich, aber die Schreibweise muss stimmen)
    - Ist der Benutzer tatsächlich am Proxy authentifiziert?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Ein erforderlicher Header war nicht vorhanden. Prüfen Sie:

    - Ihre Proxy-Konfiguration für diese spezifischen Header.
    - Ob Header irgendwo in der Kette entfernt werden.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Der Benutzer ist authentifiziert, befindet sich aber nicht in `allowUsers`. Fügen Sie ihn entweder hinzu oder entfernen Sie die Allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-Proxy-Authentifizierung war erfolgreich, aber der Browser-Header `Origin` hat die Origin-Prüfungen der Steuerungsoberfläche nicht bestanden.

    Prüfen Sie:

    - `gateway.controlUi.allowedOrigins` enthält die exakte Browser-Origin.
    - Sie verlassen sich nicht auf Platzhalter-Origins, sofern Sie nicht bewusst ein Verhalten zum Zulassen aller Origins wünschen.
    - Wenn Sie bewusst den Host-Header-Fallback-Modus verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` absichtlich gesetzt.

  </Accordion>
  <Accordion title="WebSocket schlägt weiterhin fehl">
    Stellen Sie sicher, dass Ihr Proxy:

    - WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`).
    - Die Identitäts-Header bei WebSocket-Upgrade-Anfragen weitergibt (nicht nur bei HTTP).
    - Keinen separaten Authentifizierungspfad für WebSocket-Verbindungen hat.

  </Accordion>
</AccordionGroup>

## Migration von Token-Authentifizierung

Wenn Sie von Token-Authentifizierung zu Trusted-Proxy wechseln:

<Steps>
  <Step title="Proxy konfigurieren">
    Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weitergibt.
  </Step>
  <Step title="Proxy unabhängig testen">
    Testen Sie die Proxy-Einrichtung unabhängig (curl mit Headern).
  </Step>
  <Step title="OpenClaw-Konfiguration aktualisieren">
    Aktualisieren Sie die OpenClaw-Konfiguration mit Trusted-Proxy-Authentifizierung.
  </Step>
  <Step title="Gateway neu starten">
    Starten Sie den Gateway neu.
  </Step>
  <Step title="WebSocket testen">
    Testen Sie WebSocket-Verbindungen von der Steuerungsoberfläche aus.
  </Step>
  <Step title="Audit">
    Führen Sie `openclaw security audit` aus und prüfen Sie die Befunde.
  </Step>
</Steps>

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration) — Konfigurationsreferenz
- [Remote-Zugriff](/de/gateway/remote) — andere Muster für Remote-Zugriff
- [Sicherheit](/de/gateway/security) — vollständiger Sicherheitsleitfaden
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für Zugriff nur innerhalb des Tailnet
