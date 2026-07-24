---
read_when:
    - OpenClaw hinter einem identitätsbewussten Proxy ausführen
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten
    - Beheben von WebSocket-1008-Fehlern wegen fehlender Autorisierung bei Reverse-Proxy-Konfigurationen
    - Entscheidung, wo HSTS und andere HTTP-Härtungsheader festgelegt werden sollen
sidebarTitle: Trusted proxy auth
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse-Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Authentifizierung über vertrauenswürdigen Proxy
x-i18n:
    generated_at: "2026-07-24T03:50:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 39bf8f12b3ae95f53b21bfed12deb1c8ed8f767711955bbee52c74538052a89f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Sicherheitskritische Funktion.** Dieser Modus delegiert die Authentifizierung vollständig an Ihren Reverse-Proxy. Eine Fehlkonfiguration kann unbefugten Zugriff auf Ihr Gateway ermöglichen. Lesen Sie diese Seite sorgfältig, bevor Sie die Funktion aktivieren.
</Warning>

## Verwendung

- Sie betreiben OpenClaw hinter einem **identitätsbewussten Proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + Forward Auth).
- Ihr Proxy übernimmt die gesamte Authentifizierung und übermittelt die Benutzeridentität über Header.
- Sie verwenden eine Kubernetes- oder Containerumgebung, in der der Proxy der einzige Pfad zum Gateway ist.
- WebSocket-Fehler vom Typ `1008 unauthorized` treten auf, weil Browser keine Token in WS-Nutzdaten übermitteln können.

## Nicht verwenden

- Ihr Proxy authentifiziert keine Benutzer, sondern dient lediglich als TLS-Terminator oder Load-Balancer.
- Es gibt einen Pfad zum Gateway, der den Proxy umgeht, etwa Firewall-Lücken oder internen Netzwerkzugriff.
- Sie sind nicht sicher, ob Ihr Proxy weitergeleitete Header korrekt entfernt oder überschreibt.
- Sie benötigen nur persönlichen Einzelbenutzerzugriff (ziehen Sie stattdessen Tailscale Serve + Loopback in Betracht).

## Funktionsweise

<Steps>
  <Step title="Proxy authentifiziert den Benutzer">
    Ihr Reverse-Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.).
  </Step>
  <Step title="Proxy fügt einen Identitäts-Header hinzu">
    Der Proxy fügt einen Header mit der Identität des authentifizierten Benutzers hinzu (z. B. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway überprüft die vertrauenswürdige Quelle">
    OpenClaw prüft, ob die Anfrage von einer **vertrauenswürdigen Proxy-IP** (`gateway.trustedProxies`) stammt und ob es sich nicht um die eigene Loopback- oder lokale Schnittstellenadresse des Gateways handelt.
  </Step>
  <Step title="Gateway extrahiert die Identität">
    OpenClaw liest die erforderlichen Header und anschließend die Benutzeridentität aus dem konfigurierten Header.
  </Step>
  <Step title="Autorisieren">
    Wenn alle Prüfungen erfolgreich sind und der Benutzer `allowUsers` erfüllt (sofern festgelegt), wird die Anfrage autorisiert.
  </Step>
</Steps>

## Konfiguration

```json5
{
  gateway: {
    // Die Authentifizierung über einen vertrauenswürdigen Proxy erwartet standardmäßig eine Nicht-Loopback-Quell-IP des Proxys
    bind: "lan",

    // KRITISCH: Fügen Sie hier ausschließlich die IP-Adresse(n) Ihres Proxys hinzu
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header mit der Identität des authentifizierten Benutzers (erforderlich)
        userHeader: "x-forwarded-user",

        // Optional: Header, die vorhanden sein MÜSSEN (Proxy-Verifizierung)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: auf bestimmte Benutzer beschränken (leer = alle zulassen)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: einen Loopback-Proxy auf demselben Host nach ausdrücklicher Aktivierung zulassen
        allowLoopback: false,

        // Optional: authentifizierten Proxy-Benutzern das Registrieren neuer Browsergeräte gestatten
        deviceAutoApprove: {
          enabled: false,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

<Warning>
**Laufzeitregeln in Auswertungsreihenfolge**

1. Die Quell-IP der Anfrage muss mit `gateway.trustedProxies` übereinstimmen (CIDR-fähig), andernfalls wird sie abgelehnt (`trusted_proxy_untrusted_source`).
2. Anfragen aus Loopback-Quellen (`127.0.0.1`, `::1`) werden abgelehnt, sofern nicht `gateway.auth.trustedProxy.allowLoopback = true` gilt und die Loopback-Adresse außerdem in `trustedProxies` enthalten ist (`trusted_proxy_loopback_source`). Diese Prüfung erfolgt vor den Header-Prüfungen. Daher schlägt eine Loopback-Quelle auf diese Weise fehl, selbst wenn zusätzlich erforderliche Header fehlen.
3. Nicht-Loopback-Quellen, die mit einer der eigenen lokalen Netzwerkschnittstellenadressen des Gateway-Hosts übereinstimmen, werden zum Schutz vor Spoofing abgelehnt (`trusted_proxy_local_interface_source`). Schlägt die Ermittlung der Schnittstellen selbst fehl, wird die Anfrage ebenfalls abgelehnt (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` und `userHeader` müssen vorhanden und dürfen nicht leer sein.
5. `allowUsers` muss, sofern nicht leer, den extrahierten Benutzer enthalten.

**Der Nachweis durch weitergeleitete Header hat für den lokalen direkten Fallback Vorrang vor der Loopback-Lokalität.** Wenn eine Anfrage über Loopback eingeht, aber einen `Forwarded`-, einen beliebigen `X-Forwarded-*`- oder einen `X-Real-IP`-Header enthält, schließt dieser Nachweis sie vom lokalen direkten Passwort-Fallback und der Geräteidentitätsprüfung aus, obwohl die Authentifizierung über einen vertrauenswürdigen Proxy aufgrund der Loopback-Quelle weiterhin fehlschlägt.

`allowLoopback` vertraut lokalen Prozessen auf dem Gateway-Host im selben Maß wie dem Reverse-Proxy. Aktivieren Sie diese Option nur, wenn das Gateway weiterhin durch eine Firewall vor direktem Fernzugriff geschützt ist und der lokale Proxy vom Client bereitgestellte Identitäts-Header entfernt oder überschreibt.

Interne Gateway-Clients, deren Datenverkehr nicht über den Reverse-Proxy läuft, sollten `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und keine Identitäts-Header eines vertrauenswürdigen Proxys verwenden. Control-UI-Bereitstellungen außerhalb von Loopback benötigen weiterhin eine explizite Angabe von `gateway.controlUi.allowedOrigins`.
</Warning>

### Konfigurationsreferenz

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array der vertrauenswürdigen Proxy-IP-Adressen (oder CIDRs). Anfragen von anderen IP-Adressen werden abgelehnt.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Muss `"trusted-proxy"` sein.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Name des Headers, der die Identität des authentifizierten Benutzers enthält.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Zusätzliche Header, die vorhanden sein müssen, damit die Anfrage als vertrauenswürdig gilt.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Positivliste der Benutzeridentitäten. Eine leere Liste lässt alle authentifizierten Benutzer zu.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Optionale Unterstützung für Loopback-Reverse-Proxys auf demselben Host.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.enabled" type="boolean" default="false">
  Neue Geräteidentitäten der Control UI und von WebChat nach der Authentifizierung über einen vertrauenswürdigen Proxy automatisch genehmigen.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.scopes" type="string[]" default='["operator.read", "operator.write", "operator.approvals"]'>
  Maximale Scopes, die einem automatisch genehmigten Browsergerät gewährt werden. Wird `operator.admin` ausdrücklich aufgeführt, kann jeder über den Proxy authentifizierte Benutzer eine automatische Geräteberechtigung mit vollständigen Administratorrechten anfordern. Anfragen ohne Scopes erhalten automatisch vollständige Administratorrechte. Außerdem werden der KRITISCHE Sicherheitsprüfungsbefund `gateway.trusted_proxy_device_auto_approve_admin` und eine Gateway-Warnung beim Start ausgelöst.
</ParamField>

<Warning>
Aktivieren Sie `allowLoopback` nur, wenn der lokale Reverse-Proxy die vorgesehene Vertrauensgrenze darstellt. Jeder lokale Prozess, der eine Verbindung zum Gateway herstellen kann, kann versuchen, Proxy-Identitäts-Header zu senden. Beschränken Sie daher den direkten Gateway-Zugriff auf den Host und verlangen Sie vom Proxy kontrollierte Header wie `x-forwarded-proto` oder einen signierten Bestätigungs-Header, sofern Ihr Proxy dies unterstützt.
</Warning>

## Automatische Gerätegenehmigung

Die Authentifizierung über einen vertrauenswürdigen Proxy kann optional die Proxy-Identität als Genehmigungsgrenze für neue Browsergeräte verwenden:

```json5
{
  gateway: {
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
        allowUsers: ["operator@example.com"],
        deviceAutoApprove: {
          enabled: true,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

Der Standardwert ist `enabled: false`. Wenn die Option aktiviert ist, gelten alle folgenden Regeln:

1. Der WebSocket muss über die Methode `trusted-proxy` mit einer nicht leeren Benutzeridentität authentifiziert worden sein, die bei konfigurierter Positivliste `allowUsers` erfüllt hat. Verbindungen über Token, Passwort, Tailscale sowie nicht authentifizierte Verbindungen verwenden diese Richtlinie niemals.
2. Nur ein neues Browsergerät der Control UI oder von WebChat kann automatisch genehmigt werden. Jede Anfrage für ein vorhandenes Gerät, einschließlich einer Scope-Erweiterung, bleibt zur manuellen Genehmigung mit `openclaw devices approve <requestId>` ausstehend.
3. Das Gerät wird mit der Rolle `operator` genehmigt. Wenn die Verbindungsanfrage Scopes enthält, entspricht die Berechtigung exakt der Schnittmenge der angeforderten Scopes und `deviceAutoApprove.scopes`. Wenn die Anfrage keine Scopes enthält, wird die konfigurierte Liste gewährt. Wird diese Liste ausgelassen, werden standardmäßig `operator.read`, `operator.write` und `operator.approvals` verwendet. Die resultierende Berechtigung wird anschließend zusätzlich durch den Proxy-Header [`x-openclaw-scopes`](#control-ui-pairing-behavior) der Verbindung begrenzt, sofern dieser vorhanden ist. Ein Proxy, der die Scopes eines Benutzers einschränkt, begrenzt dadurch auch die **persistente** Geräteberechtigung und nicht nur die Sitzung; ein vorhandener, aber leerer Header ergibt keine Scopes. Diese Begrenzung gilt auch, wenn der Client seine eigene Scope-Liste auslässt.
4. `operator.admin` ist nur zulässig, wenn es ausdrücklich in `deviceAutoApprove.scopes` aufgeführt ist. Ist es aufgeführt, kann jeder über den Proxy authentifizierte Benutzer für ein neues Browsergerät vollständige Administratorrechte anfordern und automatisch erhalten. Anfragen ohne Scopes erhalten automatisch vollständige Administratorrechte. `openclaw security audit` meldet den KRITISCHEN Befund `gateway.trusted_proxy_device_auto_approve_admin`, und das Gateway protokolliert beim Start einmalig eine Warnung. Bevorzugen Sie die manuelle Administratorgenehmigung mit `openclaw devices approve` oder `openclaw devices rotate`, bis identitätsspezifische Rollen verfügbar sind.

<Warning>
Durch Aktivieren dieser Option wird die Registrierung neuer Browsergeräte vollständig an die Identität des Reverse-Proxys delegiert. Mit einem kompromittierten Proxy-Konto kann ein persistentes Gerät mit allen konfigurierten Scopes registriert werden. Wird `operator.admin` aufgeführt, erhält dieses Gerät ohne manuelle Genehmigung vollständige Administratorrechte. Sorgen Sie dafür, dass das Gateway ausschließlich über den Proxy erreichbar ist, verlangen Sie eine starke Proxy-Authentifizierung, überschreiben Sie Identitäts-Header und verwenden Sie eine eng gefasste Liste für `allowUsers`.
</Warning>

## Kopplungsverhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die Prüfungen des vertrauenswürdigen Proxys besteht, können WebSocket-Sitzungen der Control UI ohne gekoppelte Geräteidentität eine Verbindung herstellen.

Auswirkungen auf Scopes:

- Gerätelose WebSocket-Sitzungen der Control UI stellen eine Verbindung her, erhalten jedoch standardmäßig keine Operator-Scopes. OpenClaw setzt die angeforderte Scope-Liste auf `[]` zurück, damit eine Sitzung, die nicht an ein genehmigtes gekoppeltes Gerät bzw. Token gebunden ist, nicht selbst Berechtigungen deklarieren kann.
- Wenn Methoden nach einer erfolgreichen WebSocket-Verbindung mit `missing scope` fehlschlagen, verwenden Sie HTTPS, damit der Browser eine Geräteidentität erzeugen und die Kopplung abschließen kann. Siehe [Unsicheres HTTP der Control UI](/de/web/control-ui#insecure-http).
- Ältere Konfigurationen, die noch den außer Betrieb genommenen Schlüssel
  `gateway.controlUi.dangerouslyDisableDeviceAuth=true` enthalten, verwenden die begrenzte
  [Upgrade-Migration der Control UI](/de/web/control-ui#device-pairing-first-connection).

Scope-Begrenzung durch den Reverse-Proxy: Wenn Ihr Proxy beim WebSocket-Upgrade der Control UI `x-openclaw-scopes` sendet, begrenzt OpenClaw die Sitzungs-Scopes auf die Schnittmenge der angeforderten und der deklarierten Scopes. Dieser Header gewährt keine Scopes, sondern schränkt lediglich ein, welche Scopes die Sitzung besitzen kann. Wenn `deviceAutoApprove.enabled` auf „true“ gesetzt ist, gilt dieselbe Begrenzung auch für die persistente Geräteberechtigung, die durch die [automatische Gerätegenehmigung](#automatic-device-approval) geschrieben wird. Ein automatisch genehmigtes Gerät besitzt somit niemals mehr Scopes, als der Proxy deklariert hat.

Auswirkungen:

- Die Kopplung ist nicht mehr die primäre Zugriffsbarriere für gerätelosen Zugriff auf die Control UI. Wenn `deviceAutoApprove.enabled` auf „true“ gesetzt ist, wird die Proxy-Identität außerdem zur Genehmigungsbarriere für die Registrierung neuer Browsergeräte.
- Die Authentifizierungsrichtlinie Ihres Reverse-Proxys und `allowUsers` bilden die effektive Zugriffskontrolle.
- Beschränken Sie eingehende Gateway-Verbindungen ausschließlich auf vertrauenswürdige Proxy-IP-Adressen (`gateway.trustedProxies` + Firewall).

Benutzerdefinierte WebSocket-Clients sind keine Control-UI-Sitzungen. Die außer Betrieb genommene Upgrade-Eingabe der Control UI gewährt beliebigen
`client.mode: "backend"`- oder CLI-ähnlichen Clients keinen temporären Zugriff. Benutzerdefinierte Automatisierungen sollten
die Geräteidentität bzw. Kopplung, den reservierten direkten lokalen Backend-Hilfspfad `client.id: "gateway-client"`
oder das [Admin-HTTP-RPC-Plugin](/de/plugins/admin-http-rpc) verwenden,
wenn eine HTTP-Anfrage-/Antwort-Schnittstelle besser geeignet ist.

## Header für Operator-Scopes

Die Trusted-Proxy-Authentifizierung ist ein HTTP-Modus, der eine **Identität übermittelt**, sodass Aufrufer bei HTTP-API-Anfragen optional Operator-Bereiche mit `x-openclaw-scopes` angeben können.

Hinweis: WebSocket-Bereiche werden durch den Gateway-Protokoll-Handshake und die Bindung der Geräteidentität bestimmt. Bei WebSocket-Upgrade-Anfragen der Control UI ist `x-openclaw-scopes` lediglich eine Obergrenze für die ausgehandelten Sitzungsbereiche, keine Gewährung. Siehe [Kopplungsverhalten der Control UI](#control-ui-pairing-behavior).

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw die angegebene Bereichsmenge.
- Wenn der Header vorhanden, aber leer ist, gibt die Anfrage **keine** Operator-Bereiche an.
- Wenn der Header fehlt, greifen normale identitätsübermittelnde HTTP-APIs auf die standardmäßige Operator-Bereichsmenge zurück (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Gateway-authentifizierte **Plugin-HTTP-Routen** sind standardmäßig enger gefasst: Wenn `x-openclaw-scopes` fehlt, greift ihr Laufzeitbereich ausschließlich auf `operator.write` zurück.
- HTTP-Anfragen aus Browser-Ursprüngen müssen auch nach erfolgreicher Trusted-Proxy-Authentifizierung weiterhin `gateway.controlUi.allowedOrigins` (oder den bewusst aktivierten Host-Header-Fallback-Modus) passieren.

Praxisregel: Senden Sie `x-openclaw-scopes` explizit, wenn eine Trusted-Proxy-Anfrage enger als die Standardwerte sein soll oder eine gateway-authentifizierte Plugin-Route mehr als Schreibberechtigung benötigt.

## TLS-Terminierung und HSTS

Verwenden Sie einen einzigen TLS-Terminierungspunkt und wenden Sie HSTS dort an.

<Tabs>
  <Tab title="Proxy-TLS-Terminierung (empfohlen)">
    Wenn Ihr Reverse Proxy HTTPS für `https://control.example.com` verarbeitet, legen Sie `Strict-Transport-Security` am Proxy für diese Domain fest.

    - Gut geeignet für öffentlich über das Internet erreichbare Bereitstellungen.
    - Bündelt Zertifikat und Richtlinie zur HTTP-Härtung an einer Stelle.
    - OpenClaw kann hinter dem Proxy über Loopback-HTTP erreichbar bleiben.

    Beispielwert für den Header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway-TLS-Terminierung">
    Wenn OpenClaw HTTPS selbst direkt bereitstellt (ohne TLS-terminierenden Proxy), legen Sie Folgendes fest:

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

    `strictTransportSecurity` akzeptiert einen Header-Wert als Zeichenfolge oder `false` zur expliziten Deaktivierung.

  </Tab>
</Tabs>

### Hinweise zur Einführung

- Beginnen Sie zunächst mit einer kurzen maximalen Gültigkeitsdauer (zum Beispiel `max-age=300`), während Sie den Datenverkehr validieren.
- Erhöhen Sie sie erst auf langfristige Werte (zum Beispiel `max-age=31536000`), wenn die Zuverlässigkeit ausreichend bestätigt ist.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain für HTTPS vorbereitet ist.
- Verwenden Sie Preload nur, wenn Sie die Preload-Anforderungen für Ihre gesamte Domain-Menge bewusst erfüllen.
- Eine ausschließlich über Loopback erreichbare lokale Entwicklungsumgebung profitiert nicht von HSTS.

## Beispiele für die Proxy-Einrichtung

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium übermittelt die Identität in `x-pomerium-claim-email` (oder anderen Anspruchs-Headern) und ein JWT in `x-pomerium-jwt-assertion`.

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
    Caddy mit dem Plugin `caddy-security` kann Benutzer authentifizieren und Identitäts-Header übermitteln.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP-Adresse des Caddy-/Sidecar-Proxys
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
    oauth2-proxy authentifiziert Benutzer und übermittelt die Identität in `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP-Adresse von nginx/oauth2-proxy
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
  <Accordion title="Traefik mit vorgeschalteter Authentifizierung">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP-Adresse des Traefik-Containers
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

Der Gateway-Start weist die Trusted-Proxy-Authentifizierung zurück, wenn zusätzlich ein gemeinsam verwendetes Token konfiguriert ist (`gateway.auth.token` oder `OPENCLAW_GATEWAY_TOKEN`). Beide Optionen schließen sich gegenseitig aus, da ein gemeinsam verwendetes Token Aufrufern auf demselben Host die Authentifizierung über einen völlig anderen Pfad als die von diesem Modus erzwungene, durch den Proxy verifizierte Identität ermöglichen würde.

Wenn der Start mit einem Fehler wie `gateway auth mode is trusted-proxy, but a shared token is also configured` fehlschlägt:

- Entfernen Sie das gemeinsam verwendete Token, wenn Sie den Trusted-Proxy-Modus verwenden, oder
- Ändern Sie `gateway.auth.mode` in `"token"`, wenn Sie eine tokenbasierte Authentifizierung verwenden möchten.

Trusted-Proxy-Identitäts-Header über Loopback schlagen weiterhin nach dem Fail-Closed-Prinzip fehl: Aufrufer auf demselben Host werden nicht stillschweigend als Proxy-Benutzer authentifiziert. Interne OpenClaw-Aufrufer, die den Proxy umgehen, können sich stattdessen mit `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` authentifizieren. Ein Token-Fallback wird im Trusted-Proxy-Modus weiterhin bewusst nicht unterstützt.

## Sicherheitscheckliste

Prüfen Sie vor der Aktivierung der Trusted-Proxy-Authentifizierung Folgendes:

- [ ] **Der Proxy ist der einzige Pfad**: Der Gateway-Port ist durch eine Firewall für alles außer Ihrem Proxy gesperrt.
- [ ] **trustedProxies ist minimal**: Nur die tatsächlichen IP-Adressen Ihres Proxys, keine vollständigen Subnetze.
- [ ] **Die Loopback-Proxy-Quelle ist bewusst gewählt**: Die Trusted-Proxy-Authentifizierung schlägt bei Anfragen aus Loopback-Quellen nach dem Fail-Closed-Prinzip fehl, sofern `gateway.auth.trustedProxy.allowLoopback` nicht explizit für einen Proxy auf demselben Host aktiviert ist.
- [ ] **Der Proxy entfernt Header**: Ihr Proxy überschreibt von Clients stammende `x-forwarded-*`-Header, statt sie anzuhängen.
- [ ] **TLS-Terminierung**: Ihr Proxy verarbeitet TLS; Benutzer stellen die Verbindung über HTTPS her.
- [ ] **allowedOrigins ist explizit festgelegt**: Eine nicht über Loopback erreichbare Control UI verwendet ein explizites `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers ist festgelegt** (empfohlen): Beschränken Sie den Zugriff auf bekannte Benutzer, statt alle authentifizierten Personen zuzulassen.
- [ ] **Keine gemischte Token-Konfiguration**: Legen Sie nicht sowohl `gateway.auth.token` als auch `gateway.auth.mode: "trusted-proxy"` fest.
- [ ] **Der lokale Passwort-Fallback ist privat**: Wenn Sie `gateway.auth.password` für interne direkte Aufrufer konfigurieren, schützen Sie den Gateway-Port per Firewall, damit entfernte Clients ohne Proxy ihn nicht direkt erreichen können.
- [ ] **Die automatische Gerätegenehmigung ist bewusst aktiviert**: Wenn `deviceAutoApprove.enabled` wahr ist, behandeln Sie die Sicherheit des Reverse-Proxy-Kontos als Grenze für die Geräteregistrierung und halten Sie die gewährte Bereichsliste ohne Administratorrechte und minimal.

## Sicherheitsprüfung

`openclaw security audit` kennzeichnet die Trusted-Proxy-Authentifizierung mit einem Befund des Schweregrads **kritisch**. Dies ist beabsichtigt; es erinnert daran, dass Sie die Sicherheit an Ihre Proxy-Einrichtung delegieren.

Die Prüfung kontrolliert Folgendes:

- Grundlegender Warnhinweis/kritischer Hinweis zu `gateway.trusted_proxy_auth`.
- Fehlende Konfiguration von `trustedProxies`.
- Fehlende Konfiguration von `userHeader`.
- Leeres `allowUsers` (erlaubt jeden authentifizierten Benutzer).
- Aktiviertes `allowLoopback` für Proxy-Quellen auf demselben Host.
- Aktivierte automatische Genehmigung von Browsergeräten (delegiert die Kopplung neuer Geräte an die Proxy-Identität).

Separate Befunde, die nicht speziell die Trusted-Proxy-Authentifizierung betreffen, gelten ebenfalls immer, wenn die Control UI zugänglich gemacht wird: ein Platzhalterwert oder ein fehlendes `gateway.controlUi.allowedOrigins` sowie der Host-Header-Ursprungs-Fallback.

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

    Lösung:

    - Bevorzugen Sie die Token-/Passwortauthentifizierung für interne Clients auf demselben Host, die nicht über den Proxy laufen, oder
    - leiten Sie den Datenverkehr über eine vertrauenswürdige Proxy-Adresse außerhalb von Loopback und belassen Sie diese IP-Adresse in `gateway.trustedProxies`, oder
    - legen Sie für einen bewusst verwendeten Reverse Proxy auf demselben Host `gateway.auth.trustedProxy.allowLoopback = true` fest, belassen Sie die Loopback-Adresse in `gateway.trustedProxies` und stellen Sie sicher, dass der Proxy Identitäts-Header entfernt oder überschreibt.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    Die Quell-IP-Adresse der Anfrage entsprach einer eigenen Nicht-Loopback-Netzwerkschnittstellenadresse des Gateway-Hosts (nicht der des Proxys). Dies schützt vor gefälschtem Datenverkehr vom selben Host in Tailnets oder Docker-Bridge-Netzwerken. `..._check_failed` bedeutet, dass bei der Ermittlung der Schnittstellen selbst ein Fehler aufgetreten ist, weshalb OpenClaw nach dem Fail-Closed-Prinzip vorgeht.

    Prüfen Sie Folgendes:

    - Sendet ein Prozess auf dem Gateway-Host selbst Identitäts-Header direkt und umgeht dabei den Proxy?
    - Läuft der Proxy im selben Netzwerk-Namespace wie der Gateway und verwendet er eine IP-Adresse, die ebenfalls als lokale Schnittstelle erscheint?

    Lösung: Leiten Sie den Proxy-Datenverkehr über eine Adresse, die nicht zugleich lokal an den Gateway-Host gebunden ist, oder verwenden Sie `allowLoopback` ausschließlich für eine echte Proxy-Einrichtung auf demselben Host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Der Benutzer-Header war leer oder fehlte. Prüfen Sie Folgendes:

    - Ist Ihr Proxy für die Übermittlung von Identitäts-Headern konfiguriert?
    - Ist der Header-Name korrekt? (Groß-/Kleinschreibung wird nicht berücksichtigt, die Schreibweise muss jedoch stimmen.)
    - Ist der Benutzer tatsächlich am Proxy authentifiziert?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Ein erforderlicher Header war nicht vorhanden. Prüfen Sie Folgendes:

    - Ihre Proxy-Konfiguration für diese spezifischen Header.
    - Ob die Header an einer Stelle in der Kette entfernt werden.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Der Benutzer ist authentifiziert, befindet sich aber nicht in `allowUsers`. Fügen Sie ihn entweder hinzu oder entfernen Sie die Positivliste.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` ist `"trusted-proxy"`, aber `gateway.trustedProxies` ist leer, oder `gateway.auth.trustedProxy` selbst fehlt. Jede Anfrage wird abgelehnt, bis beide festgelegt sind.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Die Trusted-Proxy-Authentifizierung war erfolgreich, aber der Browser-Header `Origin` hat die Ursprungsprüfungen der Control UI nicht bestanden.

    Prüfen Sie Folgendes:

    - `gateway.controlUi.allowedOrigins` enthält den exakten Browserursprung.
    - Sie verlassen sich nicht auf Platzhalterursprünge, es sei denn, Sie möchten bewusst ein Verhalten, das alle Ursprünge zulässt.
    - Wenn Sie bewusst den Host-Header-Fallbackmodus verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` gezielt festgelegt.

  </Accordion>
  <Accordion title="Verbindung erfolgreich, aber Methoden melden fehlenden Geltungsbereich">
    Die WebSocket-Verbindung wird hergestellt, aber `chat.history`, `sessions.list` oder
    `models.list` schlägt mit `missing scope: operator.read` fehl.

    Häufige Ursachen:

    - Control-UI-Sitzung ohne Gerät: Die Trusted-Proxy-Authentifizierung kann die WebSocket-Verbindung ohne Geräteidentität zulassen, aber OpenClaw entfernt bei Sitzungen ohne Gerät absichtlich die Geltungsbereiche.
    - Benutzerdefinierter Backend-Client: Die eingestellte Control-UI-Upgrade-Eingabe gewährt niemals beliebigen Backend- oder CLI-artigen WebSocket-Clients Zugriff.
    - Zu eng gefasstes `x-openclaw-scopes`: Wenn Ihr Proxy diesen Header bei der WebSocket-Upgrade-Anfrage der Control UI einfügt, werden die Sitzungsgeltungsbereiche auf diese Menge begrenzt. Ein leerer Headerwert ergibt keine Geltungsbereiche.

    Behebung:

    - Verwenden Sie für die Control UI HTTPS, damit der Browser eine Geräteidentität erzeugen und die Kopplung abschließen kann.
    - Verwenden Sie für benutzerdefinierte Automatisierungen eine Geräteidentität/Kopplung, den reservierten direkten lokalen Backend-Hilfspfad `gateway-client` oder [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).
    - Fügen Sie den eingestellten Schlüssel `gateway.controlUi.dangerouslyDisableDeviceAuth` nicht zur aktuellen Konfiguration hinzu. Ältere Installationen verwenden automatisch die einmalige Selbstkopplungsmigration.

  </Accordion>
  <Accordion title="WebSocket schlägt weiterhin fehl">
    Stellen Sie sicher, dass Ihr Proxy:

    - WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`).
    - Die Identitätsheader bei WebSocket-Upgrade-Anfragen weiterleitet (nicht nur bei HTTP).
    - Keinen separaten Authentifizierungspfad für WebSocket-Verbindungen verwendet.

  </Accordion>
</AccordionGroup>

## Migration von der Token-Authentifizierung

<Steps>
  <Step title="Proxy konfigurieren">
    Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weiterleitet.
  </Step>
  <Step title="Proxy unabhängig testen">
    Testen Sie die Proxy-Einrichtung unabhängig (curl mit Headern).
  </Step>
  <Step title="OpenClaw-Konfiguration aktualisieren">
    Aktualisieren Sie die OpenClaw-Konfiguration mit der Trusted-Proxy-Authentifizierung.
  </Step>
  <Step title="Gateway neu starten">
    Starten Sie das Gateway neu.
  </Step>
  <Step title="WebSocket testen">
    Testen Sie WebSocket-Verbindungen über die Control UI.
  </Step>
  <Step title="Prüfung">
    Führen Sie `openclaw security audit` aus und prüfen Sie die Ergebnisse.
  </Step>
</Steps>

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration) — Konfigurationsreferenz
- [Operator-Geltungsbereiche](/de/gateway/operator-scopes) — Rollen, Geltungsbereiche und Genehmigungsprüfungen
- [Remotezugriff](/de/gateway/remote) — weitere Remotezugriffsmuster
- [Sicherheit](/de/gateway/security) — vollständiger Sicherheitsleitfaden
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für den Zugriff ausschließlich über das Tailnet
