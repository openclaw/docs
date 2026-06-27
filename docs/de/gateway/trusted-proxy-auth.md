---
read_when:
    - OpenClaw hinter einem identitätsbewussten Proxy ausführen
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten
    - Beheben von WebSocket-1008-Unauthorized-Fehlern bei Reverse-Proxy-Setups
    - Entscheiden, wo HSTS und andere HTTP-Härtungsheader gesetzt werden
sidebarTitle: Trusted proxy auth
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Authentifizierung über vertrauenswürdigen Proxy
x-i18n:
    generated_at: "2026-06-27T17:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Sicherheitskritische Funktion.** Dieser Modus delegiert die Authentifizierung vollständig an Ihren Reverse Proxy. Eine Fehlkonfiguration kann Ihren Gateway unbefugtem Zugriff aussetzen. Lesen Sie diese Seite sorgfältig, bevor Sie ihn aktivieren.
</Warning>

## Wann verwenden

Verwenden Sie den Authentifizierungsmodus `trusted-proxy`, wenn:

- Sie OpenClaw hinter einem **identitätsbewussten Proxy** betreiben (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Ihr Proxy die gesamte Authentifizierung übernimmt und die Benutzeridentität über Header weitergibt.
- Sie sich in einer Kubernetes- oder Containerumgebung befinden, in der der Proxy der einzige Pfad zum Gateway ist.
- Sie WebSocket-Fehler vom Typ `1008 unauthorized` erhalten, weil Browser keine Tokens in WS-Payloads übergeben können.

## Wann NICHT verwenden

- Wenn Ihr Proxy Benutzer nicht authentifiziert (nur TLS-Terminierung oder Load Balancer).
- Wenn es irgendeinen Pfad zum Gateway gibt, der den Proxy umgeht (Firewall-Lücken, interner Netzwerkzugriff).
- Wenn Sie unsicher sind, ob Ihr Proxy weitergeleitete Header korrekt entfernt/überschreibt.
- Wenn Sie nur persönlichen Einzelbenutzerzugriff benötigen (erwägen Sie Tailscale Serve + Loopback für eine einfachere Einrichtung).

## Funktionsweise

<Steps>
  <Step title="Proxy authenticates the user">
    Ihr Reverse Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.).
  </Step>
  <Step title="Proxy adds an identity header">
    Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu (z. B. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw prüft, ob die Anfrage von einer **vertrauenswürdigen Proxy-IP** stammt (konfiguriert in `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw extrahiert die Benutzeridentität aus dem konfigurierten Header.
  </Step>
  <Step title="Authorize">
    Wenn alle Prüfungen erfolgreich sind, wird die Anfrage autorisiert.
  </Step>
</Steps>

## Pairing-Verhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die Trusted-Proxy-Prüfungen besteht, können Control-UI-WebSocket-Sitzungen ohne Geräte-Pairing-Identität verbunden werden.

Auswirkungen auf den Scope:

- Gerätelose Control-UI-WebSocket-Sitzungen verbinden sich, erhalten aber standardmäßig keine Operator-Scopes. OpenClaw leert die angeforderte Scope-Liste auf `[]`, sodass eine Sitzung, die nicht an ein genehmigtes gekoppeltes Gerät/Token gebunden ist, keine Berechtigungen selbst deklarieren kann.
- Wenn Methoden nach einer erfolgreichen WebSocket-Verbindung mit `missing scope` fehlschlagen, verwenden Sie HTTPS, damit der Browser eine Geräteidentität erzeugen und das Pairing abschließen kann. Siehe [unsicheres HTTP für die Control UI](/de/web/control-ui#insecure-http).
- Nur für den Notfall: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` behält angeforderte Scopes auch ohne Geräteidentität bei. Dies ist eine schwerwiegende Sicherheitsherabstufung; machen Sie sie schnell rückgängig. Siehe [unsicheres HTTP für die Control UI](/de/web/control-ui#insecure-http).

Scope-Begrenzung durch Reverse Proxy:

- Wenn Ihr Proxy `x-openclaw-scopes` bei der Control-UI-WebSocket-Upgrade-Anfrage sendet, begrenzt OpenClaw die Sitzungs-Scopes auf die Schnittmenge aus den angeforderten Scopes und den deklarierten Scopes. Dieser Header gewährt keine Scopes; er schränkt nur ein, was die Sitzung halten kann.

Auswirkungen:

- Pairing ist in diesem Modus nicht mehr die primäre Hürde für den Zugriff auf die Control UI.
- Die Authentifizierungsrichtlinie Ihres Reverse Proxys und `allowUsers` werden zur effektiven Zugriffskontrolle.
- Beschränken Sie den Gateway-Ingress ausschließlich auf vertrauenswürdige Proxy-IPs (`gateway.trustedProxies` + Firewall).

Benutzerdefinierte WebSocket-Clients sind keine Control-UI-Sitzungen. `gateway.controlUi.dangerouslyDisableDeviceAuth` gewährt beliebigen Clients mit `client.mode: "backend"` oder CLI-artigen Clients keine Scopes. Benutzerdefinierte Automatisierung sollte Geräteidentität/Pairing, den reservierten direkten lokalen Backend-Hilfspfad `client.id: "gateway-client"` oder das [Admin-HTTP-RPC-Plugin](/de/plugins/admin-http-rpc) verwenden, wenn eine HTTP-Anfrage/Antwort-Oberfläche besser passt.

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

- Trusted-Proxy-Authentifizierung lehnt Anfragen aus Loopback-Quellen (`127.0.0.1`, `::1`, Loopback-CIDRs) standardmäßig ab.
- Loopback-Reverse-Proxys auf demselben Host erfüllen die Trusted-Proxy-Authentifizierung **nicht**, es sei denn, Sie setzen ausdrücklich `gateway.auth.trustedProxy.allowLoopback = true` und nehmen die Loopback-Adresse in `gateway.trustedProxies` auf.
- `allowLoopback` vertraut lokalen Prozessen auf dem Gateway-Host im selben Maß wie dem Reverse Proxy. Aktivieren Sie dies nur, wenn der Gateway weiterhin per Firewall gegen direkten Remote-Zugriff abgeschirmt ist und der lokale Proxy vom Client gelieferte Identitäts-Header entfernt oder überschreibt.
- Interne Gateway-Clients, die nicht durch den Reverse Proxy laufen, sollten `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` verwenden, nicht Trusted-Proxy-Identitäts-Header.
- Nicht-Loopback-Bereitstellungen der Control UI benötigen weiterhin explizite `gateway.controlUi.allowedOrigins`.
- **Weitergeleitete Header-Nachweise haben Vorrang vor Loopback-Lokalität für lokalen direkten Fallback.** Wenn eine Anfrage über Loopback eingeht, aber `Forwarded`, beliebige `X-Forwarded-*`- oder `X-Real-IP`-Header-Nachweise enthält, disqualifizieren diese Nachweise den lokalen direkten Passwort-Fallback und die Geräteidentitätsprüfung. Mit `allowLoopback: true` kann Trusted-Proxy-Authentifizierung die Anfrage weiterhin als Proxy-Anfrage auf demselben Host akzeptieren, während `requiredHeaders` und `allowUsers` weiterhin gelten.

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
  Zulassungsliste von Benutzeridentitäten. Leer bedeutet, alle authentifizierten Benutzer zuzulassen.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Explizit aktivierte Unterstützung für Loopback-Reverse-Proxys auf demselben Host. Standardwert ist `false`.
</ParamField>

<Warning>
Aktivieren Sie `allowLoopback` nur, wenn der lokale Reverse Proxy die vorgesehene Vertrauensgrenze ist. Jeder lokale Prozess, der eine Verbindung zum Gateway herstellen kann, kann versuchen, Proxy-Identitäts-Header zu senden. Halten Sie daher direkten Gateway-Zugriff auf den Host beschränkt und verlangen Sie vom Proxy gesetzte Header wie `x-forwarded-proto` oder einen signierten Assertion-Header, sofern Ihr Proxy einen unterstützt.
</Warning>

## TLS-Terminierung und HSTS

Verwenden Sie einen einzigen TLS-Terminierungspunkt und wenden Sie HSTS dort an.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    Wenn Ihr Reverse Proxy HTTPS für `https://control.example.com` verarbeitet, setzen Sie `Strict-Transport-Security` am Proxy für diese Domain.

    - Gut geeignet für internetseitige Bereitstellungen.
    - Hält Zertifikat und HTTP-Härtungsrichtlinie an einem Ort.
    - OpenClaw kann hinter dem Proxy auf Loopback-HTTP bleiben.

    Beispiel-Header-Wert:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    Wenn OpenClaw selbst HTTPS direkt bereitstellt (kein TLS-terminierender Proxy), setzen Sie:

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

    `strictTransportSecurity` akzeptiert einen String-Header-Wert oder `false`, um explizit zu deaktivieren.

  </Tab>
</Tabs>

### Rollout-Empfehlungen

- Beginnen Sie zuerst mit einer kurzen maximalen Gültigkeitsdauer (zum Beispiel `max-age=300`), während Sie den Traffic validieren.
- Erhöhen Sie erst auf langlebige Werte (zum Beispiel `max-age=31536000`), wenn die Sicherheit hoch ist.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain HTTPS-bereit ist.
- Verwenden Sie Preload nur, wenn Sie die Preload-Anforderungen für Ihren vollständigen Domain-Satz absichtlich erfüllen.
- Reine Loopback-Entwicklung lokal profitiert nicht von HSTS.

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
  <Accordion title="Caddy with OAuth">
    Caddy mit dem `caddy-security`-Plugin kann Benutzer authentifizieren und Identitäts-Header übergeben.

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
  <Accordion title="Traefik with forward auth">
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

OpenClaw lehnt mehrdeutige Konfigurationen ab, bei denen sowohl ein `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`) als auch der Modus `trusted-proxy` gleichzeitig aktiv sind. Gemischte Token-Konfigurationen können dazu führen, dass Loopback-Anfragen stillschweigend über den falschen Authentifizierungspfad authentifiziert werden.

Wenn beim Start ein Fehler `mixed_trusted_proxy_token` angezeigt wird:

- Entfernen Sie das gemeinsame Token, wenn Sie den Trusted-Proxy-Modus verwenden, oder
- Wechseln Sie `gateway.auth.mode` zu `"token"`, wenn Sie tokenbasierte Authentifizierung beabsichtigen.

Loopback-Trusted-Proxy-Identitäts-Header verweigern weiterhin sicher: Aufrufer auf demselben Host werden nicht stillschweigend als Proxy-Benutzer authentifiziert. Interne OpenClaw-Aufrufer, die den Proxy umgehen, können sich stattdessen mit `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` authentifizieren. Token-Fallback bleibt im Trusted-Proxy-Modus absichtlich nicht unterstützt.

## Header für Operator-Scopes

Trusted-Proxy-Authentifizierung ist ein HTTP-Modus, der **Identität trägt**, daher können Aufrufer optional Operator-Scopes mit `x-openclaw-scopes` für HTTP-API-Anfragen deklarieren.

Hinweis: WebSocket-Scopes werden durch den Gateway-Protokoll-Handshake und die Geräteidentitätsbindung bestimmt. Bei WebSocket-Upgrade-Anfragen der Control UI ist `x-openclaw-scopes` nur eine Obergrenze für die ausgehandelten Sitzungs-Scopes, keine Gewährung. Informationen zum WebSocket-Scope-Verhalten mit Trusted Proxy finden Sie unter [Kopplungsverhalten der Control UI](#control-ui-pairing-behavior).

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw die deklarierte Scope-Menge.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Scopes.
- Wenn der Header fehlt, fallen normale identitätstragende HTTP-APIs auf die standardmäßige Operator-Default-Scope-Menge zurück.
- Gateway-Auth-**Plugin-HTTP-Routen** sind standardmäßig enger gefasst: Wenn `x-openclaw-scopes` fehlt, fällt ihr Laufzeit-Scope auf `operator.write` zurück.
- HTTP-Anfragen aus Browser-Ursprüngen müssen weiterhin `gateway.controlUi.allowedOrigins` bestehen (oder den bewusst gewählten Host-Header-Fallback-Modus), auch nachdem die Trusted-Proxy-Authentifizierung erfolgreich war.
- Für WebSocket-Sitzungen der Control UI ist `x-openclaw-scopes` eine Scope-Obergrenze, wenn der Header in der Upgrade-Anfrage vorhanden ist. Ein leerer Wert ergibt keine Scopes.

Praktische Regel: Senden Sie `x-openclaw-scopes` explizit, wenn eine Trusted-Proxy-Anfrage enger als die Defaults sein soll oder wenn eine Gateway-Auth-Plugin-Route etwas Stärkeres als Schreib-Scope benötigt.

## Sicherheits-Checkliste

Prüfen Sie vor dem Aktivieren der Trusted-Proxy-Authentifizierung:

- [ ] **Proxy ist der einzige Pfad**: Der Gateway-Port ist per Firewall vor allem außer Ihrem Proxy geschützt.
- [ ] **trustedProxies ist minimal**: Nur Ihre tatsächlichen Proxy-IPs, keine ganzen Subnetze.
- [ ] **Loopback-Proxy-Quelle ist beabsichtigt**: Trusted-Proxy-Authentifizierung verweigert Loopback-Quellanfragen sicher, sofern `gateway.auth.trustedProxy.allowLoopback` nicht explizit für einen Proxy auf demselben Host aktiviert ist.
- [ ] **Proxy entfernt Header**: Ihr Proxy überschreibt `x-forwarded-*`-Header von Clients, statt sie anzuhängen.
- [ ] **TLS-Terminierung**: Ihr Proxy übernimmt TLS; Benutzer verbinden sich per HTTPS.
- [ ] **allowedOrigins ist explizit**: Nicht-Loopback-Control-UI verwendet explizite `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers ist gesetzt** (empfohlen): Beschränken Sie den Zugriff auf bekannte Benutzer, statt beliebige authentifizierte Benutzer zuzulassen.
- [ ] **Keine gemischte Token-Konfiguration**: Setzen Sie nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Lokaler Passwort-Fallback ist privat**: Wenn Sie `gateway.auth.password` für interne direkte Aufrufer konfigurieren, schützen Sie den Gateway-Port per Firewall, damit entfernte Nicht-Proxy-Clients ihn nicht direkt erreichen können.

## Sicherheitsaudit

`openclaw security audit` markiert Trusted-Proxy-Authentifizierung mit einem Befund der Schwere **kritisch**. Das ist beabsichtigt — es erinnert daran, dass Sie die Sicherheit an Ihre Proxy-Einrichtung delegieren.

Das Audit prüft auf:

- Basiswarnung/kritische Erinnerung `gateway.trusted_proxy_auth`
- Fehlende `trustedProxies`-Konfiguration
- Fehlende `userHeader`-Konfiguration
- Leere `allowUsers` (erlaubt jeden authentifizierten Benutzer)
- Aktiviertes `allowLoopback` für Proxy-Quellen auf demselben Host
- Wildcard- oder fehlende Browser-Origin-Richtlinie auf exponierten Control-UI-Oberflächen

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Die Anfrage kam nicht von einer IP in `gateway.trustedProxies`. Prüfen Sie:

    - Ist die Proxy-IP korrekt? (Docker-Container-IPs können sich ändern.)
    - Gibt es einen Load Balancer vor Ihrem Proxy?
    - Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IPs zu finden.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw hat eine Trusted-Proxy-Anfrage aus einer Loopback-Quelle abgelehnt.

    Prüfen Sie:

    - Verbindet sich der Proxy von `127.0.0.1` / `::1`?
    - Versuchen Sie, Trusted-Proxy-Authentifizierung mit einem Loopback-Reverse-Proxy auf demselben Host zu verwenden?

    Behebung:

    - Bevorzugen Sie Token-/Passwortauthentifizierung für interne Clients auf demselben Host, die nicht über den Proxy laufen, oder
    - leiten Sie über eine Nicht-Loopback-Trusted-Proxy-Adresse und behalten Sie diese IP in `gateway.trustedProxies`, oder
    - setzen Sie für einen bewusst gewählten Reverse Proxy auf demselben Host `gateway.auth.trustedProxy.allowLoopback = true`, behalten Sie die Loopback-Adresse in `gateway.trustedProxies`, und stellen Sie sicher, dass der Proxy Identitäts-Header entfernt oder überschreibt.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Der Benutzer-Header war leer oder fehlte. Prüfen Sie:

    - Ist Ihr Proxy so konfiguriert, dass er Identitäts-Header weitergibt?
    - Ist der Header-Name korrekt? (Groß-/Kleinschreibung ist egal, aber die Schreibweise zählt.)
    - Ist der Benutzer tatsächlich am Proxy authentifiziert?

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
    Die Trusted-Proxy-Authentifizierung war erfolgreich, aber der Browser-Header `Origin` hat die Origin-Prüfungen der Control UI nicht bestanden.

    Prüfen Sie:

    - `gateway.controlUi.allowedOrigins` enthält den exakten Browser-Origin.
    - Sie verlassen sich nicht auf Wildcard-Origins, sofern Sie nicht absichtlich ein Allow-all-Verhalten wünschen.
    - Wenn Sie den Host-Header-Fallback-Modus bewusst verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` absichtlich gesetzt.

  </Accordion>
  <Accordion title="Verbindung erfolgreich, aber Methoden melden fehlenden Scope">
    Der WebSocket verbindet sich, aber `chat.history`, `sessions.list` oder
    `models.list` schlägt mit `missing scope: operator.read` fehl.

    Häufige Ursachen:

    - Gerätefreie Control-UI-Sitzung: Trusted-Proxy-Authentifizierung kann die WebSocket-Verbindung ohne Geräteidentität zulassen, aber OpenClaw entfernt Scopes bei gerätefreien Sitzungen absichtlich.
    - Benutzerdefinierter Backend-Client: `gateway.controlUi.dangerouslyDisableDeviceAuth` ist auf die Control UI beschränkt und gewährt beliebigen Backend- oder CLI-artigen WebSocket-Clients keine Scopes.
    - Zu enges `x-openclaw-scopes`: Wenn Ihr Proxy diesen Header in die WebSocket-Upgrade-Anfrage der Control UI injiziert, werden die Sitzungs-Scopes auf diese Menge begrenzt. Ein leerer Header-Wert ergibt keine Scopes.

    Behebung:

    - Verwenden Sie für die Control UI HTTPS, damit der Browser eine Geräteidentität erzeugen und die Kopplung abschließen kann.
    - Verwenden Sie für benutzerdefinierte Automatisierung Geräteidentität/Kopplung, den reservierten direkten lokalen `gateway-client`-Backend-Hilfspfad oder [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
    - Verwenden Sie `gateway.controlUi.dangerouslyDisableDeviceAuth: true` nur als temporären Break-Glass-Pfad für die Control UI.

  </Accordion>
  <Accordion title="WebSocket schlägt weiterhin fehl">
    Stellen Sie sicher, dass Ihr Proxy:

    - WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`).
    - Die Identitäts-Header bei WebSocket-Upgrade-Anfragen weitergibt (nicht nur bei HTTP).
    - Keinen separaten Authentifizierungspfad für WebSocket-Verbindungen hat.

  </Accordion>
</AccordionGroup>

## Migration von Token-Authentifizierung

Wenn Sie von Token-Authentifizierung zu Trusted Proxy wechseln:

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
    Testen Sie WebSocket-Verbindungen aus der Control UI.
  </Step>
  <Step title="Audit">
    Führen Sie `openclaw security audit` aus und prüfen Sie die Befunde.
  </Step>
</Steps>

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration) — Konfigurationsreferenz
- [Remotezugriff](/de/gateway/remote) — andere Remotezugriffsmuster
- [Sicherheit](/de/gateway/security) — vollständiger Sicherheitsleitfaden
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für reinen Tailnet-Zugriff
