---
read_when:
    - OpenClaw hinter einem identitätsbasierten Proxy ausführen
    - Einrichtung von Pomerium, Caddy oder nginx mit OAuth vor OpenClaw
    - Beheben nicht autorisierter WebSocket-1008-Fehler bei Reverse-Proxy-Konfigurationen
    - Entscheiden, wo HSTS und andere HTTP-Härtungsheader festgelegt werden sollen
sidebarTitle: Trusted proxy auth
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse-Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Authentifizierung über vertrauenswürdigen Proxy
x-i18n:
    generated_at: "2026-07-12T01:43:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Sicherheitssensible Funktion.** Dieser Modus delegiert die Authentifizierung vollständig an Ihren Reverse-Proxy. Eine Fehlkonfiguration kann Ihren Gateway unbefugtem Zugriff aussetzen. Lesen Sie diese Seite sorgfältig, bevor Sie den Modus aktivieren.
</Warning>

## Wann verwenden

- Sie betreiben OpenClaw hinter einem **identitätsbewussten Proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + Forward-Authentifizierung).
- Ihr Proxy übernimmt die gesamte Authentifizierung und übergibt die Benutzeridentität über Header.
- Sie verwenden eine Kubernetes- oder Container-Umgebung, in der der Proxy der einzige Pfad zum Gateway ist.
- Es treten WebSocket-Fehler vom Typ `1008 unauthorized` auf, weil Browser keine Token in WS-Nutzdaten übergeben können.

## Wann NICHT verwenden

- Ihr Proxy authentifiziert keine Benutzer, sondern dient lediglich als TLS-Endpunkt oder Load-Balancer.
- Es gibt einen Pfad zum Gateway, der den Proxy umgeht, etwa durch Lücken in der Firewall oder internen Netzwerkzugriff.
- Sie sind nicht sicher, ob Ihr Proxy weitergeleitete Header ordnungsgemäß entfernt oder überschreibt.
- Sie benötigen lediglich persönlichen Einzelbenutzerzugriff; ziehen Sie stattdessen Tailscale Serve + loopback in Betracht.

## Funktionsweise

<Steps>
  <Step title="Der Proxy authentifiziert den Benutzer">
    Ihr Reverse-Proxy authentifiziert Benutzer über OAuth, OIDC, SAML usw.
  </Step>
  <Step title="Der Proxy fügt einen Identitäts-Header hinzu">
    Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu, z. B. `x-forwarded-user: nick@example.com`.
  </Step>
  <Step title="Der Gateway überprüft die vertrauenswürdige Quelle">
    OpenClaw prüft, ob die Anfrage von einer **vertrauenswürdigen Proxy-IP-Adresse** (`gateway.trustedProxies`) stammt und ob diese nicht der loopback- oder lokalen Schnittstellenadresse des Gateways entspricht.
  </Step>
  <Step title="Der Gateway extrahiert die Identität">
    OpenClaw liest die erforderlichen Header und anschließend die Benutzeridentität aus dem konfigurierten Header.
  </Step>
  <Step title="Autorisieren">
    Wenn alle Prüfungen erfolgreich sind und der Benutzer die Prüfung durch `allowUsers` besteht, sofern festgelegt, wird die Anfrage autorisiert.
  </Step>
</Steps>

## Konfiguration

```json5
{
  gateway: {
    // Die Authentifizierung über einen vertrauenswürdigen Proxy erwartet standardmäßig,
    // dass die Quell-IP des Proxys keine Loopback-Adresse ist
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

        // Optional: einen Loopback-Proxy auf demselben Host nach expliziter Zustimmung zulassen
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Laufzeitregeln in der Reihenfolge ihrer Auswertung**

1. Die Quell-IP-Adresse der Anfrage muss unter Berücksichtigung von CIDR mit `gateway.trustedProxies` übereinstimmen, andernfalls wird sie abgelehnt (`trusted_proxy_untrusted_source`).
2. Anfragen von Loopback-Quellen (`127.0.0.1`, `::1`) werden abgelehnt, sofern nicht `gateway.auth.trustedProxy.allowLoopback = true` festgelegt ist und die Loopback-Adresse außerdem in `trustedProxies` enthalten ist (`trusted_proxy_loopback_source`). Diese Prüfung erfolgt vor den Header-Prüfungen. Eine Loopback-Quelle schlägt daher auf diese Weise fehl, selbst wenn zusätzlich erforderliche Header fehlen.
3. Nicht von Loopback-Quellen stammende Anfragen, die mit einer lokalen Netzwerkschnittstellenadresse des Gateway-Hosts übereinstimmen, werden zum Schutz vor Spoofing abgelehnt (`trusted_proxy_local_interface_source`). Wenn bereits die Ermittlung der Schnittstellen fehlschlägt, wird die Anfrage ebenfalls abgelehnt (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` und `userHeader` müssen vorhanden und dürfen nicht leer sein.
5. Wenn `allowUsers` nicht leer ist, muss die extrahierte Benutzeridentität darin enthalten sein.

**Nachweise durch weitergeleitete Header setzen für den lokalen direkten Rückgriff die Loopback-Lokalität außer Kraft.** Wenn eine Anfrage über loopback eingeht, aber einen `Forwarded`-, einen beliebigen `X-Forwarded-*`- oder einen `X-Real-IP`-Header enthält, schließt dieser Nachweis sie vom lokalen direkten Passwort-Rückgriff und von der Geräteidentitätsprüfung aus, obwohl die Authentifizierung über einen vertrauenswürdigen Proxy aufgrund der Loopback-Quelle weiterhin fehlschlägt.

`allowLoopback` vertraut lokalen Prozessen auf dem Gateway-Host im selben Maß wie dem Reverse-Proxy. Aktivieren Sie diese Option nur, wenn der Gateway weiterhin durch eine Firewall vor direktem Remotezugriff geschützt ist und der lokale Proxy vom Client bereitgestellte Identitäts-Header entfernt oder überschreibt.

Interne Gateway-Clients, deren Datenverkehr nicht durch den Reverse-Proxy läuft, sollten `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und keine Identitäts-Header eines vertrauenswürdigen Proxys verwenden. Control-UI-Bereitstellungen außerhalb von loopback benötigen weiterhin eine explizite Konfiguration von `gateway.controlUi.allowedOrigins`.
</Warning>

### Konfigurationsreferenz

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array der vertrauenswürdigen Proxy-IP-Adressen oder CIDR-Bereiche. Anfragen von anderen IP-Adressen werden abgelehnt.
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
  Positivliste der Benutzeridentitäten. Eine leere Liste lässt alle authentifizierten Benutzer zu.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Explizit zu aktivierende Unterstützung für Loopback-Reverse-Proxys auf demselben Host.
</ParamField>

<Warning>
Aktivieren Sie `allowLoopback` nur, wenn der lokale Reverse-Proxy die vorgesehene Vertrauensgrenze darstellt. Jeder lokale Prozess, der eine Verbindung zum Gateway herstellen kann, kann versuchen, Proxy-Identitäts-Header zu senden. Beschränken Sie daher den direkten Gateway-Zugriff auf den Host und verlangen Sie Proxy-eigene Header wie `x-forwarded-proto` oder, sofern Ihr Proxy dies unterstützt, einen signierten Bestätigungs-Header.
</Warning>

## Kopplungsverhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die Prüfungen für vertrauenswürdige Proxys besteht, können WebSocket-Sitzungen der Control UI ohne Identität eines gekoppelten Geräts eine Verbindung herstellen.

Auswirkungen auf Berechtigungsbereiche:

- WebSocket-Sitzungen der Control UI ohne Gerät stellen eine Verbindung her, erhalten jedoch standardmäßig keine Operator-Berechtigungsbereiche. OpenClaw setzt die Liste der angeforderten Berechtigungsbereiche auf `[]`, sodass eine Sitzung, die nicht an ein genehmigtes gekoppeltes Gerät oder Token gebunden ist, keine Berechtigungen selbst deklarieren kann.
- Wenn Methoden nach einer erfolgreichen WebSocket-Verbindung mit `missing scope` fehlschlagen, verwenden Sie HTTPS, damit der Browser eine Geräteidentität erzeugen und die Kopplung abschließen kann. Siehe [Unsicheres HTTP für die Control UI](/de/web/control-ui#insecure-http).
- Nur für Notfälle: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` behält angeforderte Berechtigungsbereiche auch ohne Geräteidentität bei. Dies stellt eine erhebliche Herabstufung der Sicherheit dar; machen Sie die Änderung schnellstmöglich rückgängig. Siehe [Unsicheres HTTP für die Control UI](/de/web/control-ui#insecure-http).

Begrenzung der Berechtigungsbereiche durch den Reverse-Proxy: Wenn Ihr Proxy beim WebSocket-Upgrade der Control UI `x-openclaw-scopes` sendet, begrenzt OpenClaw die Berechtigungsbereiche der Sitzung auf die Schnittmenge der angeforderten und der deklarierten Berechtigungsbereiche. Dieser Header gewährt keine Berechtigungsbereiche, sondern schränkt lediglich ein, welche Berechtigungsbereiche die Sitzung besitzen kann.

Auswirkungen:

- Die Kopplung ist in diesem Modus nicht länger die primäre Zugangsschranke für die Control UI.
- Die Authentifizierungsrichtlinie Ihres Reverse-Proxys und `allowUsers` bilden die effektive Zugriffskontrolle.
- Beschränken Sie den eingehenden Gateway-Datenverkehr ausschließlich auf vertrauenswürdige Proxy-IP-Adressen (`gateway.trustedProxies` + Firewall).

Benutzerdefinierte WebSocket-Clients sind keine Sitzungen der Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` gewährt beliebigen Clients mit `client.mode: "backend"` oder CLI-ähnlichen Clients keine Berechtigungsbereiche. Benutzerdefinierte Automatisierungen sollten die Geräteidentität und Kopplung, den reservierten direkten lokalen Hilfspfad für Backends mit `client.id: "gateway-client"` oder das [Plugin für administrative HTTP-RPC](/de/plugins/admin-http-rpc) verwenden, wenn eine HTTP-Anfrage-Antwort-Schnittstelle besser geeignet ist.

## Header für Operator-Berechtigungsbereiche

Die Authentifizierung über einen vertrauenswürdigen Proxy ist ein **identitätstragender** HTTP-Modus. Aufrufer können daher bei HTTP-API-Anfragen optional Operator-Berechtigungsbereiche mit `x-openclaw-scopes` deklarieren.

Hinweis: WebSocket-Berechtigungsbereiche werden durch den Gateway-Protokoll-Handshake und die Bindung der Geräteidentität bestimmt. Bei WebSocket-Upgrade-Anfragen der Control UI begrenzt `x-openclaw-scopes` lediglich die ausgehandelten Berechtigungsbereiche der Sitzung und gewährt keine. Siehe [Kopplungsverhalten der Control UI](#control-ui-pairing-behavior).

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw die deklarierte Menge an Berechtigungsbereichen.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Berechtigungsbereiche.
- Wenn der Header fehlt, greifen normale identitätstragende HTTP-APIs auf die standardmäßige Menge an Operator-Berechtigungsbereichen zurück (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Durch Gateway-Authentifizierung geschützte **HTTP-Routen von Plugins** sind standardmäßig stärker eingeschränkt: Wenn `x-openclaw-scopes` fehlt, fällt ihr Laufzeit-Berechtigungsbereich ausschließlich auf `operator.write` zurück.
- HTTP-Anfragen mit Browser-Ursprung müssen auch nach erfolgreicher Authentifizierung über einen vertrauenswürdigen Proxy weiterhin `gateway.controlUi.allowedOrigins` oder den bewusst aktivierten Rückgriff auf den Host-Header bestehen.

Praxisregel: Senden Sie `x-openclaw-scopes` explizit, wenn eine Anfrage über einen vertrauenswürdigen Proxy stärker als die Standardwerte eingeschränkt sein soll oder wenn eine durch Gateway-Authentifizierung geschützte Plugin-Route einen umfassenderen Berechtigungsbereich als den Schreibzugriff benötigt.

## TLS-Terminierung und HSTS

Verwenden Sie einen einzigen TLS-Terminierungspunkt und wenden Sie HSTS dort an.

<Tabs>
  <Tab title="TLS-Terminierung am Proxy (empfohlen)">
    Wenn Ihr Reverse-Proxy HTTPS für `https://control.example.com` verarbeitet, legen Sie `Strict-Transport-Security` am Proxy für diese Domain fest.

    - Gut geeignet für Bereitstellungen mit Internetzugriff.
    - Bündelt die Zertifikats- und HTTP-Härtungsrichtlinie an einer Stelle.
    - OpenClaw kann hinter dem Proxy weiterhin HTTP über loopback verwenden.

    Beispielwert für den Header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="TLS-Terminierung am Gateway">
    Wenn OpenClaw selbst HTTPS direkt bereitstellt, ohne einen TLS-terminierenden Proxy, legen Sie Folgendes fest:

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

    `strictTransportSecurity` akzeptiert einen Headerwert als Zeichenfolge oder `false`, um die Funktion explizit zu deaktivieren.

  </Tab>
</Tabs>

### Empfehlungen für die Einführung

- Beginnen Sie während der Überprüfung des Datenverkehrs zunächst mit einer kurzen maximalen Gültigkeitsdauer, beispielsweise `max-age=300`.
- Erhöhen Sie den Wert erst bei ausreichender Sicherheit auf eine lange Gültigkeitsdauer, beispielsweise `max-age=31536000`.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain für HTTPS bereit ist.
- Verwenden Sie die Preload-Funktion nur, wenn Sie die Preload-Anforderungen für Ihre gesamte Domain-Gruppe bewusst erfüllen.
- Eine ausschließlich über loopback erreichbare lokale Entwicklungsumgebung profitiert nicht von HSTS.

## Beispiele für die Proxy-Einrichtung

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium übergibt die Identität in `x-pomerium-claim-email` oder anderen Anspruchs-Headern und ein JWT in `x-pomerium-jwt-assertion`.

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
    Caddy kann mit dem Plugin `caddy-security` Benutzer authentifizieren und Identitäts-Header übergeben.

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
  <Accordion title="Traefik mit Forward-Authentifizierung">
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

Der Gateway-Start lehnt die Trusted-Proxy-Authentifizierung ab, wenn zusätzlich ein gemeinsames Token konfiguriert ist (`gateway.auth.token` oder `OPENCLAW_GATEWAY_TOKEN`). Beide schließen sich gegenseitig aus, da ein gemeinsames Token Aufrufern auf demselben Host die Authentifizierung über einen völlig anderen Pfad als die von diesem Modus erzwungene, durch den Proxy verifizierte Identität ermöglichen würde.

Wenn der Start mit einem Fehler wie `gateway auth mode is trusted-proxy, but a shared token is also configured` fehlschlägt:

- Entfernen Sie das gemeinsame Token, wenn Sie den Trusted-Proxy-Modus verwenden, oder
- ändern Sie `gateway.auth.mode` in `"token"`, wenn Sie eine tokenbasierte Authentifizierung verwenden möchten.

Trusted-Proxy-Identitätsheader über local loopback werden weiterhin nach dem Fail-Closed-Prinzip abgelehnt: Aufrufer auf demselben Host werden nicht stillschweigend als Proxy-Benutzer authentifiziert. Interne OpenClaw-Aufrufer, die den Proxy umgehen, können sich stattdessen mit `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` authentifizieren. Ein Token-Fallback wird im Trusted-Proxy-Modus bewusst weiterhin nicht unterstützt.

## Sicherheitscheckliste

Prüfen Sie vor dem Aktivieren der Trusted-Proxy-Authentifizierung Folgendes:

- [ ] **Der Proxy ist der einzige Zugriffsweg**: Der Gateway-Port ist durch eine Firewall für alle Zugriffe außer denen Ihres Proxys gesperrt.
- [ ] **trustedProxies ist minimal**: Nur die tatsächlichen IP-Adressen Ihres Proxys, nicht vollständige Subnetze.
- [ ] **Die Loopback-Proxyquelle ist beabsichtigt**: Die Trusted-Proxy-Authentifizierung lehnt Anfragen aus Loopback-Quellen nach dem Fail-Closed-Prinzip ab, sofern `gateway.auth.trustedProxy.allowLoopback` nicht ausdrücklich für einen Proxy auf demselben Host aktiviert ist.
- [ ] **Der Proxy entfernt Header**: Ihr Proxy überschreibt von Clients stammende `x-forwarded-*`-Header, statt Werte anzuhängen.
- [ ] **TLS-Terminierung**: Ihr Proxy verarbeitet TLS; Benutzer stellen die Verbindung über HTTPS her.
- [ ] **allowedOrigins ist explizit festgelegt**: Eine Control UI außerhalb von local loopback verwendet explizite `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers ist festgelegt** (empfohlen): Beschränken Sie den Zugriff auf bekannte Benutzer, statt jeden authentifizierten Benutzer zuzulassen.
- [ ] **Keine gemischte Token-Konfiguration**: Legen Sie nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"` fest.
- [ ] **Der lokale Passwort-Fallback ist geschützt**: Wenn Sie `gateway.auth.password` für interne direkte Aufrufer konfigurieren, schützen Sie den Gateway-Port mit einer Firewall, damit Remote-Clients außerhalb des Proxys nicht direkt darauf zugreifen können.

## Sicherheitsprüfung

`openclaw security audit` kennzeichnet die Trusted-Proxy-Authentifizierung mit einem Befund des Schweregrads **kritisch**. Dies ist beabsichtigt; es erinnert Sie daran, dass Sie die Sicherheit an Ihre Proxy-Konfiguration delegieren.

Die Prüfung kontrolliert Folgendes:

- Grundlegende Warnung bzw. kritischer Hinweis `gateway.trusted_proxy_auth`.
- Fehlende `trustedProxies`-Konfiguration.
- Fehlende `userHeader`-Konfiguration.
- Leere `allowUsers`-Liste (lässt jeden authentifizierten Benutzer zu).
- Aktiviertes `allowLoopback` für Proxyquellen auf demselben Host.

Separate, nicht speziell auf Trusted Proxy bezogene Befunde gelten ebenfalls, wenn die Control UI erreichbar ist: Platzhalter oder fehlende `gateway.controlUi.allowedOrigins` sowie der Origin-Fallback über den Host-Header.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Die Anfrage stammte nicht von einer IP-Adresse in `gateway.trustedProxies`. Prüfen Sie Folgendes:

    - Ist die Proxy-IP-Adresse korrekt? (IP-Adressen von Docker-Containern können sich ändern.)
    - Befindet sich vor Ihrem Proxy ein Load Balancer?
    - Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IP-Adressen zu ermitteln.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw hat eine Trusted-Proxy-Anfrage aus einer Loopback-Quelle abgelehnt.

    Prüfen Sie Folgendes:

    - Stellt der Proxy die Verbindung von `127.0.0.1` / `::1` her?
    - Versuchen Sie, die Trusted-Proxy-Authentifizierung mit einem Loopback-Reverse-Proxy auf demselben Host zu verwenden?

    Behebung:

    - Verwenden Sie vorzugsweise eine Token-/Passwortauthentifizierung für interne Clients auf demselben Host, die den Proxy nicht durchlaufen, oder
    - leiten Sie den Datenverkehr über eine vertrauenswürdige Proxyadresse außerhalb von local loopback und behalten Sie diese IP-Adresse in `gateway.trustedProxies` bei, oder
    - legen Sie für einen bewusst verwendeten Reverse-Proxy auf demselben Host `gateway.auth.trustedProxy.allowLoopback = true` fest, behalten Sie die Loopback-Adresse in `gateway.trustedProxies` bei und stellen Sie sicher, dass der Proxy Identitätsheader entfernt oder überschreibt.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    Die Quell-IP-Adresse der Anfrage stimmte mit einer der eigenen Netzwerkadressen einer Nicht-Loopback-Schnittstelle des Gateway-Hosts überein (nicht mit dem Proxy). Dies dient als Schutz vor gefälschtem Datenverkehr vom selben Host in Tailnets oder Docker-Bridge-Netzwerken. `..._check_failed` bedeutet, dass bei der Ermittlung der Schnittstellen selbst ein Fehler aufgetreten ist, sodass OpenClaw nach dem Fail-Closed-Prinzip ablehnt.

    Prüfen Sie Folgendes:

    - Sendet ein Prozess auf dem Gateway-Host selbst Identitätsheader direkt und umgeht dabei den Proxy?
    - Wird der Proxy im selben Netzwerk-Namespace wie der Gateway ausgeführt und besitzt er eine IP-Adresse, die ebenfalls als lokale Schnittstelle erscheint?

    Behebung: Leiten Sie den Proxy-Datenverkehr über eine Adresse, die nicht zugleich lokal an den Gateway-Host gebunden ist, oder verwenden Sie `allowLoopback` ausschließlich für eine echte Proxy-Konfiguration auf demselben Host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Der Benutzerheader war leer oder fehlte. Prüfen Sie Folgendes:

    - Ist Ihr Proxy so konfiguriert, dass er Identitätsheader weitergibt?
    - Ist der Headername korrekt? (Groß-/Kleinschreibung wird nicht berücksichtigt, die Schreibweise muss jedoch stimmen.)
    - Ist der Benutzer tatsächlich am Proxy authentifiziert?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Ein erforderlicher Header war nicht vorhanden. Prüfen Sie Folgendes:

    - Die Konfiguration Ihres Proxys für diese spezifischen Header.
    - Ob Header an einer Stelle in der Verarbeitungskette entfernt werden.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Der Benutzer ist authentifiziert, befindet sich jedoch nicht in `allowUsers`. Fügen Sie ihn entweder hinzu oder entfernen Sie die Zulassungsliste.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` ist auf `"trusted-proxy"` gesetzt, aber `gateway.trustedProxies` ist leer oder `gateway.auth.trustedProxy` selbst fehlt. Jede Anfrage wird abgelehnt, bis beides festgelegt ist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Die Trusted-Proxy-Authentifizierung war erfolgreich, aber der Browserheader `Origin` hat die Origin-Prüfungen der Control UI nicht bestanden.

    Prüfen Sie Folgendes:

    - `gateway.controlUi.allowedOrigins` enthält den exakten Browser-Origin.
    - Sie verlassen sich nicht auf Platzhalter-Origins, sofern Sie nicht bewusst ein Verhalten wünschen, das alle Origins zulässt.
    - Wenn Sie bewusst den Fallback-Modus über den Host-Header verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ausdrücklich festgelegt.

  </Accordion>
  <Accordion title="Verbindung erfolgreich, aber Methoden melden fehlenden Scope">
    Die WebSocket-Verbindung wird hergestellt, aber `chat.history`, `sessions.list` oder
    `models.list` schlägt mit `missing scope: operator.read` fehl.

    Häufige Ursachen:

    - Control-UI-Sitzung ohne Gerät: Die Trusted-Proxy-Authentifizierung kann die WebSocket-Verbindung ohne Geräteidentität zulassen, OpenClaw entfernt jedoch konstruktionsbedingt die Scopes aus Sitzungen ohne Gerät.
    - Benutzerdefinierter Backend-Client: `gateway.controlUi.dangerouslyDisableDeviceAuth` ist auf die Control UI beschränkt und gewährt beliebigen Backend- oder CLI-artigen WebSocket-Clients keine Scopes.
    - Zu eng gefasstes `x-openclaw-scopes`: Wenn Ihr Proxy diesen Header bei der WebSocket-Upgrade-Anfrage der Control UI einfügt, werden die Sitzungsscopes auf diese Menge beschränkt. Ein leerer Headerwert führt dazu, dass keine Scopes vorhanden sind.

    Behebung:

    - Verwenden Sie für die Control UI HTTPS, damit der Browser eine Geräteidentität erzeugen und die Kopplung abschließen kann.
    - Verwenden Sie für benutzerdefinierte Automatisierungen eine Geräteidentität/Kopplung, den reservierten direkten lokalen Backend-Hilfspfad `gateway-client` oder [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
    - Verwenden Sie `gateway.controlUi.dangerouslyDisableDeviceAuth: true` ausschließlich als vorübergehenden Notfallzugang für die Control UI.

  </Accordion>
  <Accordion title="WebSocket schlägt weiterhin fehl">
    Stellen Sie sicher, dass Ihr Proxy:

    - WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`).
    - Die Identitätsheader bei WebSocket-Upgrade-Anfragen weitergibt (nicht nur bei HTTP).
    - Keinen separaten Authentifizierungspfad für WebSocket-Verbindungen verwendet.

  </Accordion>
</AccordionGroup>

## Migration von der Token-Authentifizierung

<Steps>
  <Step title="Proxy konfigurieren">
    Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weitergibt.
  </Step>
  <Step title="Proxy unabhängig testen">
    Testen Sie die Proxy-Konfiguration unabhängig (curl mit Headern).
  </Step>
  <Step title="OpenClaw-Konfiguration aktualisieren">
    Aktualisieren Sie die OpenClaw-Konfiguration mit der Trusted-Proxy-Authentifizierung.
  </Step>
  <Step title="Gateway neu starten">
    Starten Sie den Gateway neu.
  </Step>
  <Step title="WebSocket testen">
    Testen Sie WebSocket-Verbindungen aus der Control UI.
  </Step>
  <Step title="Prüfung">
    Führen Sie `openclaw security audit` aus und prüfen Sie die Befunde.
  </Step>
</Steps>

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration) — Konfigurationsreferenz
- [Operator-Scopes](/de/gateway/operator-scopes) — Rollen, Scopes und Genehmigungsprüfungen
- [Remote-Zugriff](/de/gateway/remote) — weitere Muster für den Remote-Zugriff
- [Sicherheit](/de/gateway/security) — vollständiger Sicherheitsleitfaden
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für den ausschließlichen Zugriff über ein Tailnet
