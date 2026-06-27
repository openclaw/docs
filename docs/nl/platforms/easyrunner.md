---
read_when:
    - OpenClaw implementeren op EasyRunner
    - |-
      OpenClaw-vertaling-invoer
      De Gateway achter EasyRunners Caddy-proxy uitvoeren
    - Persistente volumes en authenticatie kiezen voor een gehoste Gateway
summary: Voer de OpenClaw Gateway uit op EasyRunner met Podman en Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:46:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner kan de OpenClaw Gateway hosten als een kleine gecontaineriseerde app achter de
Caddy-proxy. Deze handleiding gaat uit van een EasyRunner-host die Podman-compatibele
Compose-apps draait en HTTPS via Caddy aanbiedt.

## Voordat je begint

- Een EasyRunner-server met een domein dat ernaartoe is gerouteerd.
- Een gebouwde of gepubliceerde OpenClaw-containerimage.
- Een persistent configuratievolume voor `/home/node/.openclaw`.
- Een persistent werkruimtevolume voor `/workspace`.
- Een sterk Gateway-token of wachtwoord.

Houd apparaatauthenticatie waar mogelijk ingeschakeld. Als je reverse-proxy-implementatie
apparaatidentiteit niet correct kan doorgeven, repareer dan eerst de instellingen voor vertrouwde proxy's; gebruik
gevaarlijke authenticatie-omzeilingen alleen voor een volledig privaat, door de beheerder gecontroleerd netwerk.

## Compose-app

Maak een EasyRunner-app met een Compose-bestand in deze vorm:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Vervang `openclaw.example.com` door de hostnaam van je Gateway. Sla
`OPENCLAW_GATEWAY_TOKEN` op in de geheimen-/omgevingsbeheerder van EasyRunner in plaats van
het vast te leggen in de appdefinitie.

## OpenClaw configureren

Houd de Gateway binnen het persistente configuratievolume alleen bereikbaar via
de proxy en vereis authenticatie:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Als Caddy TLS voor de Gateway beëindigt, configureer dan vertrouwde-proxy-instellingen voor
het exacte proxypad in plaats van authenticatiecontroles globaal uit te schakelen. Zie
[Vertrouwde-proxy-authenticatie](/nl/gateway/trusted-proxy-auth).

## Verifiëren

Vanaf je werkstation:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Controleer vanaf de EasyRunner-host de app-logs op een luisterende Gateway en geen
opstartfouten met SecretRef, Plugin of kanaalauthenticatie.

## Updates en back-ups

- Haal of bouw de nieuwe OpenClaw-image en implementeer daarna de EasyRunner-app opnieuw.
- Maak een back-up van het volume `openclaw-config` vóór updates.
- Maak een back-up van `openclaw-workspace` als agents daar duurzame projectgegevens schrijven.
- Voer `openclaw doctor` uit na grote updates om configuratiemigraties en
  servicewaarschuwingen te vinden.

## Problemen oplossen

- `gateway probe` kan geen verbinding maken: bevestig dat de Caddy-hostnaam naar de app wijst
  en dat de container luistert op `0.0.0.0:1455`.
- Authenticatie mislukt: roteer het token in EasyRunner-geheimen en de lokale clientopdracht
  samen.
- Bestanden zijn na herstel eigendom van root: herstel de gekoppelde volumes zodat de
  containergebruiker kan schrijven naar `/home/node/.openclaw` en `/workspace`.
- Browser- of kanaalplugins mislukken: controleer of de vereiste externe
  binaries, netwerkuitgaand verkeer en gekoppelde referenties beschikbaar zijn binnen de
  container.
