---
read_when:
    - Sie möchten über Tailscale auf den Gateway zugreifen
    - Sie möchten die Browser-Control-UI und die Konfigurationsbearbeitung
summary: 'Gateway-Weboberflächen: Control UI, Bindungsmodi und Sicherheit'
title: Web
x-i18n:
    generated_at: "2026-07-12T02:18:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Der Gateway stellt eine kleine **Browser-Control-UI** (Vite + Lit) über denselben Port wie der Gateway-WebSocket bereit:

- Standard: `http://<host>:18789/`
- mit `gateway.tls.enabled: true`: `https://<host>:18789/`
- optionales Präfix: Legen Sie `gateway.controlUi.basePath` fest (z. B. `/openclaw`)

Die Funktionen werden unter [Control UI](/de/web/control-ui) beschrieben. Diese Seite behandelt Bindungsmodi, Sicherheit und weitere webseitige Schnittstellen.

## Konfiguration (standardmäßig aktiviert)

Die Control UI ist **standardmäßig aktiviert**, wenn die Assets vorhanden sind (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Webhooks

Wenn `hooks.enabled=true` festgelegt ist, stellt der Gateway außerdem einen Webhook-Endpunkt auf demselben HTTP-Server bereit. Informationen zu Authentifizierung und Nutzdaten finden Sie unter `hooks` in der [Referenz zur Gateway-Konfiguration](/de/gateway/configuration-reference#hooks).

## Administrator-HTTP-RPC

`POST /api/v1/admin/rpc` stellt ausgewählte Methoden der Gateway-Steuerungsebene über HTTP bereit. Die Funktion ist standardmäßig deaktiviert und wird nur registriert, wenn das Plugin `admin-http-rpc` aktiviert ist. Informationen zum Authentifizierungsmodell, zu den zulässigen Methoden und zum Vergleich mit der WebSocket-API finden Sie unter [Administrator-HTTP-RPC](/de/plugins/admin-http-rpc).

## Zugriff über Tailscale

<Tabs>
  <Tab title="Integriertes Serve (empfohlen)">
    Belassen Sie den Gateway auf local loopback und lassen Sie ihn durch Tailscale Serve als Proxy weiterleiten:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Starten Sie den Gateway:

    ```bash
    openclaw gateway
    ```

    Öffnen Sie `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Tailnet-Bindung + Token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Starten Sie den Gateway (dieses Beispiel ohne local loopback verwendet die Authentifizierung mit einem Shared-Secret-Token):

    ```bash
    openclaw gateway
    ```

    Öffnen Sie `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Öffentliches Internet (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` erfordert `gateway.auth.mode: "password"`; sowohl Serve als auch Funnel erfordern `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Sicherheitshinweise

- Die Gateway-Authentifizierung ist standardmäßig erforderlich: Token, Passwort, vertrauenswürdiger Proxy oder, sofern aktiviert, Identitätsheader von Tailscale Serve.
- Bindungen außerhalb von local loopback **erfordern** weiterhin eine Gateway-Authentifizierung: Token-/Passwortauthentifizierung oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Der Onboarding-Assistent erstellt standardmäßig eine Shared-Secret-Authentifizierung und generiert üblicherweise ein Gateway-Token, selbst bei local loopback.
- Im Shared-Secret-Modus sendet die UI während des WebSocket-Handshakes `connect.params.auth.token` oder `connect.params.auth.password`.
- Mit `gateway.tls.enabled: true` stellen lokale Dashboard-/Status-Hilfsfunktionen URLs mit `https://` und WebSocket-URLs mit `wss://` dar.
- In identitätsbasierten Modi (Tailscale Serve, `trusted-proxy`) wird die WebSocket-Authentifizierungsprüfung anhand der Anfrageheader statt anhand eines gemeinsamen Geheimnisses erfüllt.
- Legen Sie für öffentliche Control-UI-Bereitstellungen außerhalb von local loopback `gateway.controlUi.allowedOrigins` explizit fest (vollständige Ursprünge). Private Ladevorgänge mit demselben Ursprung werden für local loopback, RFC1918-/Link-Local-, `.local`-, `.ts.net`- und Tailscale-CGNAT-Hosts auch ohne diese Einstellung akzeptiert.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` aktiviert den Ursprungs-Fallback über den Host-Header; dies stellt eine gefährliche Herabstufung der Sicherheit dar.
- Bei Serve erfüllen Tailscale-Identitätsheader die Authentifizierungsanforderungen der Control UI und des WebSockets, wenn `gateway.auth.allowTailscale: true` festgelegt ist (kein Token oder Passwort erforderlich). HTTP-API-Endpunkte verwenden keine Tailscale-Identitätsheader; sie folgen stets dem normalen HTTP-Authentifizierungsmodus des Gateways. Legen Sie `gateway.auth.allowTailscale: false` fest, um auch über Serve explizite Anmeldedaten zu verlangen. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host selbst vertrauenswürdig ist. Siehe [Tailscale](/de/gateway/tailscale) und [Sicherheit](/de/gateway/security).

## Erstellen der UI

Der Gateway stellt statische Dateien aus `dist/control-ui` bereit:

```bash
pnpm ui:build
```
