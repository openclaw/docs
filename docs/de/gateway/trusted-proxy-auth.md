---
read_when:
    - OpenClaw hinter einem identitätsbewussten Proxy ausführen
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten
    - Beheben von WebSocket-1008-Fehlern „unauthorized“ bei Reverse-Proxy-Konfigurationen
    - Entscheiden, wo HSTS und andere HTTP-Härtungsheader festgelegt werden sollen
sidebarTitle: Trusted proxy auth
summary: Delegieren Sie die Gateway-Authentifizierung an einen vertrauenswürdigen Reverse-Proxy (Pomerium, Caddy, nginx + OAuth)
title: Authentifizierung über vertrauenswürdigen Proxy
x-i18n:
    generated_at: "2026-07-12T15:29:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Sicherheitssensible Funktion.** Dieser Modus überträgt die Authentifizierung vollständig an Ihren Reverse-Proxy. Eine Fehlkonfiguration kann Ihren Gateway unbefugtem Zugriff aussetzen. Lesen Sie diese Seite sorgfältig, bevor Sie den Modus aktivieren.
</Warning>

## Wann verwenden

- Sie betreiben OpenClaw hinter einem **identitätsbewussten Proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + Forward-Authentifizierung).
- Ihr Proxy übernimmt die gesamte Authentifizierung und übermittelt die Benutzeridentität über Header.
- Sie verwenden eine Kubernetes- oder Container-Umgebung, in der der Proxy der einzige Pfad zum Gateway ist.
- Es treten WebSocket-Fehler vom Typ `1008 unauthorized` auf, weil Browser keine Token in WS-Nutzdaten übermitteln können.

## Wann NICHT verwenden

- Ihr Proxy authentifiziert keine Benutzer (sondern dient lediglich als TLS-Endpunkt oder Load-Balancer).
- Es gibt einen Pfad zum Gateway, der den Proxy umgeht (Lücken in der Firewall, interner Netzwerkzugriff).
- Sie sind nicht sicher, ob Ihr Proxy weitergeleitete Header ordnungsgemäß entfernt oder überschreibt.
- Sie benötigen nur persönlichen Einzelbenutzerzugriff (erwägen Sie stattdessen Tailscale Serve + Loopback).

## Funktionsweise

<Steps>
  <Step title="Proxy authentifiziert den Benutzer">
    Ihr Reverse-Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.).
  </Step>
  <Step title="Proxy fügt einen Identitäts-Header hinzu">
    Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu (z. B. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway überprüft die vertrauenswürdige Quelle">
    OpenClaw prüft, ob die Anfrage von einer **vertrauenswürdigen Proxy-IP-Adresse** (`gateway.trustedProxies`) stammt und ob es sich dabei nicht um die eigene Loopback- oder lokale Schnittstellenadresse des Gateways handelt.
  </Step>
  <Step title="Gateway extrahiert die Identität">
    OpenClaw liest die erforderlichen Header und anschließend die Benutzeridentität aus dem konfigurierten Header.
  </Step>
  <Step title="Autorisieren">
    Wenn alle Prüfungen erfolgreich sind und der Benutzer `allowUsers` erfüllt (falls festgelegt), wird die Anfrage autorisiert.
  </Step>
</Steps>

## Konfiguration

```json5
{
  gateway: {
    // Bei der Authentifizierung über einen vertrauenswürdigen Proxy darf die Quell-IP des Proxys standardmäßig keine Loopback-Adresse sein
    bind: "lan",

    // KRITISCH: Fügen Sie hier ausschließlich die IP-Adresse(n) Ihres Proxys hinzu
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header mit der authentifizierten Benutzeridentität (erforderlich)
        userHeader: "x-forwarded-user",

        // Optional: Header, die vorhanden sein MÜSSEN (Proxy-Überprüfung)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: auf bestimmte Benutzer beschränken (leer = alle zulassen)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: einen Loopback-Proxy auf demselben Host nach ausdrücklicher Aktivierung zulassen
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Laufzeitregeln in Auswertungsreihenfolge**

1. Die Quell-IP-Adresse der Anfrage muss mit `gateway.trustedProxies` übereinstimmen (CIDR-fähig), andernfalls wird sie abgelehnt (`trusted_proxy_untrusted_source`).
2. Anfragen aus Loopback-Quellen (`127.0.0.1`, `::1`) werden abgelehnt, sofern nicht `gateway.auth.trustedProxy.allowLoopback = true` gesetzt ist und sich die Loopback-Adresse ebenfalls in `trustedProxies` befindet (`trusted_proxy_loopback_source`). Diese Prüfung erfolgt vor den Header-Prüfungen. Daher schlägt eine Loopback-Quelle auf diese Weise fehl, selbst wenn zusätzlich erforderliche Header fehlen.
3. Nicht-Loopback-Quellen, die mit einer der eigenen lokalen Netzwerkschnittstellenadressen des Gateway-Hosts übereinstimmen, werden zum Schutz vor Spoofing abgelehnt (`trusted_proxy_local_interface_source`). Wenn die Ermittlung der Schnittstellen selbst fehlschlägt, wird die Anfrage ebenfalls abgelehnt (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` und `userHeader` müssen vorhanden und dürfen nicht leer sein.
5. Wenn `allowUsers` nicht leer ist, muss die extrahierte Benutzeridentität darin enthalten sein.

**Nachweise durch weitergeleitete Header haben für den lokalen direkten Fallback Vorrang vor der Loopback-Lokalität.** Wenn eine Anfrage über Loopback eingeht, aber einen `Forwarded`-, einen beliebigen `X-Forwarded-*`- oder einen `X-Real-IP`-Header enthält, schließt dieser Nachweis sie vom lokalen direkten Passwort-Fallback und von der Geräteidentitätsprüfung aus, obwohl die Authentifizierung über den vertrauenswürdigen Proxy aufgrund der Loopback-Quelle weiterhin fehlschlägt.

`allowLoopback` vertraut lokalen Prozessen auf dem Gateway-Host im selben Maß wie dem Reverse-Proxy. Aktivieren Sie diese Option nur, wenn der Gateway weiterhin durch eine Firewall vor direktem Remote-Zugriff geschützt ist und der lokale Proxy vom Client bereitgestellte Identitäts-Header entfernt oder überschreibt.

Interne Gateway-Clients, deren Datenverkehr nicht durch den Reverse-Proxy läuft, sollten `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und keine Identitäts-Header für vertrauenswürdige Proxys verwenden. Control-UI-Bereitstellungen außerhalb von Loopback benötigen weiterhin eine explizite Konfiguration von `gateway.controlUi.allowedOrigins`.
</Warning>

### Konfigurationsreferenz

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array der vertrauenswürdigen Proxy-IP-Adressen (oder CIDRs). Anfragen von anderen IP-Adressen werden abgelehnt.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Muss `"trusted-proxy"` sein.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Name des Headers, der die authentifizierte Benutzeridentität enthält.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Zusätzliche Header, die vorhanden sein müssen, damit die Anfrage als vertrauenswürdig gilt.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Zulassungsliste der Benutzeridentitäten. Leer bedeutet, dass alle authentifizierten Benutzer zugelassen werden.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Explizit zu aktivierende Unterstützung für Loopback-Reverse-Proxys auf demselben Host.
</ParamField>

<Warning>
Aktivieren Sie `allowLoopback` nur, wenn der lokale Reverse-Proxy die beabsichtigte Vertrauensgrenze darstellt. Jeder lokale Prozess, der eine Verbindung zum Gateway herstellen kann, kann versuchen, Proxy-Identitäts-Header zu senden. Beschränken Sie daher den direkten Gateway-Zugriff auf den Host und verlangen Sie vom Proxy kontrollierte Header wie `x-forwarded-proto` oder einen signierten Assertion-Header, sofern Ihr Proxy dies unterstützt.
</Warning>

## Kopplungsverhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die Prüfungen für vertrauenswürdige Proxys besteht, können Control-UI-WebSocket-Sitzungen ohne Geräteidentität für die Kopplung eine Verbindung herstellen.

Auswirkungen auf Scopes:

- Control-UI-WebSocket-Sitzungen ohne Gerät können eine Verbindung herstellen, erhalten jedoch standardmäßig keine Operator-Scopes. OpenClaw setzt die angeforderte Scope-Liste auf `[]`, damit eine Sitzung, die nicht an ein genehmigtes gekoppeltes Gerät/Token gebunden ist, keine Berechtigungen selbst deklarieren kann.
- Wenn Methoden nach einer erfolgreichen WebSocket-Verbindung mit `missing scope` fehlschlagen, verwenden Sie HTTPS, damit der Browser eine Geräteidentität erzeugen und die Kopplung abschließen kann. Siehe [Unsicheres HTTP der Control UI](/de/web/control-ui#insecure-http).
- Nur für den Notfall: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` behält die angeforderten Scopes auch ohne Geräteidentität bei. Dies stellt eine erhebliche Herabstufung der Sicherheit dar; machen Sie die Änderung schnellstmöglich rückgängig. Siehe [Unsicheres HTTP der Control UI](/de/web/control-ui#insecure-http).

Begrenzung der Scopes durch den Reverse-Proxy: Wenn Ihr Proxy bei der WebSocket-Upgrade-Anfrage der Control UI `x-openclaw-scopes` sendet, begrenzt OpenClaw die Sitzungs-Scopes auf die Schnittmenge der angeforderten und der deklarierten Scopes. Dieser Header gewährt keine Scopes; er schränkt lediglich ein, welche Scopes die Sitzung besitzen kann.

Auswirkungen:

- Die Kopplung ist in diesem Modus nicht mehr die primäre Zugangsschranke für die Control UI.
- Die Authentifizierungsrichtlinie Ihres Reverse-Proxys und `allowUsers` bilden die effektive Zugriffskontrolle.
- Beschränken Sie eingehende Gateway-Verbindungen ausschließlich auf vertrauenswürdige Proxy-IP-Adressen (`gateway.trustedProxies` + Firewall).

Benutzerdefinierte WebSocket-Clients sind keine Control-UI-Sitzungen. `gateway.controlUi.dangerouslyDisableDeviceAuth` gewährt beliebigen Clients mit `client.mode: "backend"` oder CLI-ähnlichen Clients keine Scopes. Benutzerdefinierte Automatisierungen sollten die Geräteidentität/Kopplung, den reservierten direkten lokalen Backend-Hilfspfad `client.id: "gateway-client"` oder das [Admin-HTTP-RPC-Plugin](/de/plugins/admin-http-rpc) verwenden, wenn eine HTTP-Anfrage/Antwort-Schnittstelle besser geeignet ist.

## Header für Operator-Scopes

Die Authentifizierung über einen vertrauenswürdigen Proxy ist ein **identitätstragender** HTTP-Modus. Daher können Aufrufer bei HTTP-API-Anfragen optional Operator-Scopes mit `x-openclaw-scopes` deklarieren.

Hinweis: WebSocket-Scopes werden durch den Gateway-Protokoll-Handshake und die Bindung der Geräteidentität bestimmt. Bei WebSocket-Upgrade-Anfragen der Control UI dient `x-openclaw-scopes` lediglich als Obergrenze für die ausgehandelten Sitzungs-Scopes und gewährt keine Scopes. Siehe [Kopplungsverhalten der Control UI](#control-ui-pairing-behavior).

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw die deklarierte Scope-Menge.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Scopes.
- Wenn der Header fehlt, greifen normale identitätstragende HTTP-APIs auf die standardmäßige Operator-Scope-Menge zurück (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Durch den Gateway authentifizierte **Plugin-HTTP-Routen** sind standardmäßig stärker eingeschränkt: Wenn `x-openclaw-scopes` fehlt, wird für ihren Laufzeit-Scope ausschließlich `operator.write` verwendet.
- HTTP-Anfragen aus Browser-Ursprüngen müssen auch nach erfolgreicher Authentifizierung über den vertrauenswürdigen Proxy weiterhin `gateway.controlUi.allowedOrigins` (oder den bewusst aktivierten Host-Header-Fallback-Modus) erfüllen.

Praktische Regel: Senden Sie `x-openclaw-scopes` explizit, wenn eine Anfrage über einen vertrauenswürdigen Proxy stärker als durch die Standardwerte eingeschränkt werden soll oder wenn eine durch den Gateway authentifizierte Plugin-Route einen umfangreicheren Scope als den Schreib-Scope benötigt.

## TLS-Terminierung und HSTS

Verwenden Sie einen einzigen TLS-Terminierungspunkt und wenden Sie HSTS dort an.

<Tabs>
  <Tab title="TLS-Terminierung am Proxy (empfohlen)">
    Wenn Ihr Reverse-Proxy HTTPS für `https://control.example.com` verarbeitet, legen Sie `Strict-Transport-Security` am Proxy für diese Domain fest.

    - Gut geeignet für Bereitstellungen mit Internetzugriff.
    - Hält die Richtlinien für Zertifikate und HTTP-Härtung an einem Ort.
    - OpenClaw kann hinter dem Proxy über Loopback-HTTP erreichbar bleiben.

    Beispiel für einen Header-Wert:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="TLS-Terminierung am Gateway">
    Wenn OpenClaw HTTPS direkt bereitstellt (ohne TLS-terminierenden Proxy), legen Sie Folgendes fest:

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

    `strictTransportSecurity` akzeptiert einen Header-Wert als Zeichenfolge oder `false`, um die Funktion ausdrücklich zu deaktivieren.

  </Tab>
</Tabs>

### Hinweise zur Einführung

- Beginnen Sie zunächst mit einem kurzen Höchstalter (zum Beispiel `max-age=300`), während Sie den Datenverkehr überprüfen.
- Erhöhen Sie den Wert erst dann auf eine lange Gültigkeitsdauer (zum Beispiel `max-age=31536000`), wenn Sie ausreichend Vertrauen gewonnen haben.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain für HTTPS vorbereitet ist.
- Verwenden Sie Preloading nur, wenn Sie die Preload-Anforderungen für Ihre gesamte Domain-Menge bewusst erfüllen.
- Eine rein lokale Entwicklung über Loopback profitiert nicht von HSTS.

## Beispiele für die Proxy-Einrichtung

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium übermittelt die Identität in `x-pomerium-claim-email` (oder anderen Claim-Headern) und ein JWT in `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP-Adresse von Pomerium
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
    Caddy kann mit dem Plugin `caddy-security` Benutzer authentifizieren und Identitäts-Header übermitteln.

    ```json5
    {
      gateway: {
        bind: "lan",
    ```
    ```json5
        trustedProxies: ["10.0.0.1"], // IP des Caddy-/Sidecar-Proxys
    ```
    ```json5
        auth: {
    ```
    ```json5
          mode: "trusted-proxy",
    ```
    ```json5
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
    Caddyfile-Ausschnitt:

    ```caddy
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
  <Accordion title="Traefik mit Forward-Authentifizierung">
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

Der Start des Gateways lehnt die Trusted-Proxy-Authentifizierung ab, wenn zugleich ein gemeinsam verwendetes Token konfiguriert ist (`gateway.auth.token` oder `OPENCLAW_GATEWAY_TOKEN`). Beide schließen einander aus, da sich Aufrufer auf demselben Host mit einem gemeinsam verwendeten Token über einen völlig anderen Pfad authentifizieren könnten als über die vom Proxy verifizierte Identität, deren Durchsetzung dieser Modus dient.

Wenn der Start mit einem Fehler wie `gateway auth mode is trusted-proxy, but a shared token is also configured` fehlschlägt:

- Entfernen Sie das gemeinsam verwendete Token, wenn Sie den Trusted-Proxy-Modus verwenden, oder
- Ändern Sie `gateway.auth.mode` in `"token"`, wenn Sie eine tokenbasierte Authentifizierung verwenden möchten.

Trusted-Proxy-Identitätsheader über die Loopback-Schnittstelle schlagen weiterhin nach dem Fail-Closed-Prinzip fehl: Aufrufer auf demselben Host werden nicht stillschweigend als Proxy-Benutzer authentifiziert. Interne OpenClaw-Aufrufer, die den Proxy umgehen, können sich stattdessen mit `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` authentifizieren. Ein Token-Fallback wird im Trusted-Proxy-Modus weiterhin bewusst nicht unterstützt.

  ## Sicherheitscheckliste

  Bevor Sie die Trusted-Proxy-Authentifizierung aktivieren, überprüfen Sie Folgendes:

  - [ ] **Proxy ist der einzige Zugriffsweg**: Der Gateway-Port ist durch eine Firewall so geschützt, dass ausschließlich Ihr Proxy darauf zugreifen kann.
  - [ ] **trustedProxies ist minimal**: Nur die tatsächlichen IP-Adressen Ihres Proxys, nicht ganze Subnetze.
  - [ ] **Loopback-Proxy-Quelle ist beabsichtigt**: Die Trusted-Proxy-Authentifizierung lehnt Anfragen aus Loopback-Quellen standardmäßig ab, sofern `gateway.auth.trustedProxy.allowLoopback` nicht ausdrücklich für einen Proxy auf demselben Host aktiviert ist.
  - [ ] **Proxy entfernt Header**: Ihr Proxy überschreibt die `x-forwarded-*`-Header von Clients, statt Werte anzuhängen.
  - [ ] **TLS-Terminierung**: Ihr Proxy verarbeitet TLS; Benutzer stellen die Verbindung über HTTPS her.
  - [ ] **allowedOrigins ist explizit festgelegt**: Die Control UI außerhalb der Loopback-Schnittstelle verwendet explizit festgelegte `gateway.controlUi.allowedOrigins`.
  - [ ] **allowUsers ist festgelegt** (empfohlen): Beschränken Sie den Zugriff auf bekannte Benutzer, statt allen authentifizierten Benutzern Zugriff zu gewähren.
  - [ ] **Keine gemischte Token-Konfiguration**: Legen Sie nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"` fest.
  - [ ] **Lokaler Passwort-Fallback ist privat**: Wenn Sie `gateway.auth.password` für interne direkte Aufrufer konfigurieren, schützen Sie den Gateway-Port mit einer Firewall, damit entfernte Clients, die nicht über den Proxy zugreifen, ihn nicht direkt erreichen können.

  ## Sicherheitsüberprüfung

  `openclaw security audit` kennzeichnet die Trusted-Proxy-Authentifizierung mit einem Befund des Schweregrads **kritisch**. Dies ist beabsichtigt; es erinnert Sie daran, dass Sie die Sicherheit an Ihre Proxy-Konfiguration delegieren.

  Die Überprüfung sucht nach Folgendem:

  - Grundlegender Warnhinweis bzw. kritischer Hinweis für `gateway.trusted_proxy_auth`.
  - Fehlende `trustedProxies`-Konfiguration.
  - Fehlende `userHeader`-Konfiguration.
  - Leeres `allowUsers` (erlaubt jeden authentifizierten Benutzer).
  - Aktiviertes `allowLoopback` für Proxy-Quellen auf demselben Host.

  Separate Befunde, die nicht speziell die Trusted-Proxy-Authentifizierung betreffen, gelten ebenfalls, sobald die Control UI erreichbar ist: Platzhalterwerte oder fehlende `gateway.controlUi.allowedOrigins` sowie der Fallback der Herkunftsprüfung auf den Host-Header.

  ## Fehlerbehebung

  <AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Die Anfrage stammte nicht von einer IP-Adresse aus `gateway.trustedProxies`. Überprüfen Sie Folgendes:

    - Ist die Proxy-IP-Adresse korrekt? (IP-Adressen von Docker-Containern können sich ändern.)
    - Befindet sich vor Ihrem Proxy ein Load-Balancer?
    - Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IP-Adressen zu ermitteln.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw hat eine Trusted-Proxy-Anfrage aus einer Loopback-Quelle abgelehnt.

    Überprüfen Sie Folgendes:

    - Stellt der Proxy die Verbindung von `127.0.0.1` / `::1` her?
    - Versuchen Sie, die Trusted-Proxy-Authentifizierung mit einem Loopback-Reverse-Proxy auf demselben Host zu verwenden?

    Lösung:

    - Verwenden Sie für interne Clients auf demselben Host, die nicht über den Proxy geleitet werden, vorzugsweise Token-/Passwortauthentifizierung, oder
    - leiten Sie den Datenverkehr über eine vertrauenswürdige Proxy-Adresse weiter, die keine Loopback-Adresse ist, und behalten Sie diese IP in `gateway.trustedProxies` bei, oder
    - setzen Sie für einen bewusst eingesetzten Reverse-Proxy auf demselben Host `gateway.auth.trustedProxy.allowLoopback = true`, behalten Sie die Loopback-Adresse in `gateway.trustedProxies` bei und stellen Sie sicher, dass der Proxy Identitäts-Header entfernt oder überschreibt.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    Die Quell-IP der Anfrage stimmte mit einer der eigenen Netzwerk-Schnittstellenadressen des Gateway-Hosts überein, die keine Loopback-Adresse ist (nicht mit dem Proxy). Dies dient als Schutz vor gefälschtem Datenverkehr vom selben Host in Tailnets oder Docker-Bridge-Netzwerken. `..._check_failed` bedeutet, dass bei der Ermittlung der Schnittstellen selbst ein Fehler aufgetreten ist, sodass OpenClaw nach dem Fail-Closed-Prinzip vorgeht.

    Prüfen Sie:

    - Sendet ein Prozess auf dem Gateway-Host selbst Identitäts-Header direkt und umgeht dabei den Proxy?
    - Wird der Proxy im selben Netzwerk-Namespace wie das Gateway ausgeführt und verwendet er eine IP, die ebenfalls als lokale Schnittstelle angezeigt wird?

    Lösung: Leiten Sie den Proxy-Datenverkehr über eine Adresse, die nicht zugleich lokal an den Gateway-Host gebunden ist, oder verwenden Sie `allowLoopback` nur für eine echte Proxy-Konfiguration auf demselben Host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Der Benutzer-Header war leer oder fehlte. Prüfen Sie:

    - Ist Ihr Proxy so konfiguriert, dass er Identitäts-Header weiterleitet?
    - Ist der Header-Name korrekt? (Groß-/Kleinschreibung wird nicht berücksichtigt, die Schreibweise ist jedoch relevant.)
    - Ist der Benutzer tatsächlich am Proxy authentifiziert?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Ein erforderlicher Header war nicht vorhanden. Prüfen Sie:

    - Ihre Proxy-Konfiguration für diese spezifischen Header.
    - Ob Header an einer Stelle in der Verarbeitungskette entfernt werden.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Der Benutzer ist authentifiziert, befindet sich jedoch nicht in `allowUsers`. Fügen Sie ihn entweder hinzu oder entfernen Sie die Positivliste.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` ist auf `"trusted-proxy"` gesetzt, aber `gateway.trustedProxies` ist leer, oder `gateway.auth.trustedProxy` selbst fehlt. Jede Anfrage wird abgelehnt, bis beide festgelegt sind.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Die Trusted-Proxy-Authentifizierung war erfolgreich, aber der Browser-Header `Origin` hat die Ursprungsprüfungen der Control UI nicht bestanden.

    Prüfen Sie:

    - `gateway.controlUi.allowedOrigins` enthält den exakten Browser-Ursprung.
    - Sie verlassen sich nicht auf Platzhalter-Ursprünge, sofern Sie nicht bewusst ein Verhalten zulassen möchten, das alle Ursprünge erlaubt.
    - Wenn Sie bewusst den Host-Header-Fallbackmodus verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` absichtlich festgelegt.

  </Accordion>
  <Accordion title="Verbindung erfolgreich, aber Methoden melden fehlenden Scope">
    Die WebSocket-Verbindung wird hergestellt, aber `chat.history`, `sessions.list` oder
    `models.list` schlägt mit `missing scope: operator.read` fehl.

    Häufige Ursachen:

    - Control-UI-Sitzung ohne Gerät: Die Trusted-Proxy-Authentifizierung kann die WebSocket-Verbindung ohne Geräteidentität zulassen, OpenClaw entfernt jedoch bei Sitzungen ohne Gerät absichtlich die Scopes.
    - Benutzerdefinierter Backend-Client: `gateway.controlUi.dangerouslyDisableDeviceAuth` gilt nur für die Control UI und gewährt beliebigen Backend- oder CLI-ähnlichen WebSocket-Clients keine Scopes.
    - Zu eng gefasstes `x-openclaw-scopes`: Wenn Ihr Proxy diesen Header in die WebSocket-Upgrade-Anfrage der Control UI einfügt, werden die Sitzungs-Scopes auf diese Menge begrenzt. Ein leerer Header-Wert führt dazu, dass keine Scopes vorhanden sind.

    Lösung:

    - Verwenden Sie für die Control UI HTTPS, damit der Browser eine Geräteidentität erzeugen und das Pairing abschließen kann.
    - Verwenden Sie für benutzerdefinierte Automatisierung eine Geräteidentität bzw. ein Pairing, den reservierten direkten lokalen Backend-Hilfspfad `gateway-client` oder [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
    - Verwenden Sie `gateway.controlUi.dangerouslyDisableDeviceAuth: true` nur vorübergehend als Notfallpfad für die Control UI.

  </Accordion>
  <Accordion title="WebSocket schlägt weiterhin fehl">
    Stellen Sie sicher, dass Ihr Proxy:

    - WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`).
    - Die Identitäts-Header bei WebSocket-Upgrade-Anfragen weiterleitet (nicht nur bei HTTP).
    - Keinen separaten Authentifizierungspfad für WebSocket-Verbindungen verwendet.

  </Accordion>
</AccordionGroup>

## Migration von der Token-Authentifizierung

<Steps>
  <Step title="Proxy konfigurieren">
    Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weiterleitet.
  </Step>
  <Step title="Proxy unabhängig testen">
    Testen Sie die Proxy-Konfiguration unabhängig (curl mit Headern).
  </Step>
  <Step title="OpenClaw-Konfiguration aktualisieren">
    Aktualisieren Sie die OpenClaw-Konfiguration mit Trusted-Proxy-Authentifizierung.
  </Step>
  <Step title="Gateway neu starten">
    Starten Sie das Gateway neu.
  </Step>
  <Step title="WebSocket testen">
    Testen Sie WebSocket-Verbindungen über die Control UI.
  </Step>
  <Step title="Audit durchführen">
    Führen Sie `openclaw security audit` aus und prüfen Sie die Ergebnisse.
  </Step>
</Steps>

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration) — Konfigurationsreferenz
- [Operator-Scopes](/de/gateway/operator-scopes) — Rollen, Scopes und Genehmigungsprüfungen
- [Remote-Zugriff](/de/gateway/remote) — weitere Muster für den Remote-Zugriff
- [Sicherheit](/de/gateway/security) — vollständiger Sicherheitsleitfaden
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für den ausschließlichen Zugriff über ein Tailnet
