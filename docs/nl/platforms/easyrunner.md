---
read_when:
    - OpenClaw implementeren op EasyRunner
    - De Gateway uitvoeren achter de Caddy-proxy van EasyRunner
    - Permanente volumes en authenticatie kiezen voor een gehoste Gateway
summary: Voer de OpenClaw Gateway uit op EasyRunner met Podman en Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T08:59:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner host de OpenClaw Gateway als een kleine gecontaineriseerde app achter zijn
Caddy-proxy. Deze handleiding gaat uit van een EasyRunner-host waarop met Podman compatibele
Compose-apps worden uitgevoerd en waarop HTTPS via Caddy wordt beëindigd.

## Voordat je begint

- Een EasyRunner-server met een domein dat ernaartoe is gerouteerd.
- De officiële OpenClaw-image (`ghcr.io/openclaw/openclaw`) of je eigen build.
- Een persistent configuratievolume voor `/home/node/.openclaw`.
- Een persistent werkruimtevolume voor `/home/node/.openclaw/workspace`.
- Een sterk Gateway-token of -wachtwoord.

Laat apparaatauthenticatie waar mogelijk ingeschakeld. Als je reverse proxy de
apparaatidentiteit niet correct kan doorgeven, corrigeer dan eerst de instellingen voor
vertrouwde proxy's (zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth));
gebruik gevaarlijke omzeilingen van authenticatie alleen op een volledig privé,
door de beheerder gecontroleerd netwerk.

## Compose-app

Maak een EasyRunner-app met een Compose-bestand met de volgende structuur:

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Vervang `openclaw.example.com` door de hostnaam van je Gateway. Sla
`OPENCLAW_GATEWAY_TOKEN` op in het geheimen-/omgevingsbeheer van EasyRunner in plaats van
het in de appdefinitie vast te leggen. De image bindt standaard aan local loopback,
dus de expliciete `--bind lan --port 1455` in `command` is vereist zodat Caddy de
container kan bereiken.

## OpenClaw configureren

Zorg er binnen het persistente configuratievolume voor dat de Gateway alleen via
de proxy bereikbaar is en vereis authenticatie:

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

Als Caddy TLS voor de Gateway beëindigt, configureer dan de instellingen voor
vertrouwde proxy's voor het exacte proxypad in plaats van authenticatiecontroles
wereldwijd uit te schakelen. Zie
[Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth).

## Verifiëren

Vanaf je werkstation:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Vanaf de EasyRunner-host vereisen `GET /healthz` (levendheid) en `GET /readyz`
(gereedheid) geen authenticatie en ondersteunen ze de ingebouwde
containergezondheidscontrole van de image. Controleer ook de app-logboeken op een
luisterende Gateway en op de afwezigheid van opstartfouten met SecretRef, plugins
of kanaalauthenticatie.

## Updates en back-ups

- Haal de nieuwe OpenClaw-image op of bouw deze en implementeer de EasyRunner-app vervolgens opnieuw.
- Maak vóór updates een back-up van het volume `openclaw-config`. Dit bevat
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` en de status van
  geïnstalleerde pluginpakketten.
- Maak een back-up van `openclaw-workspace` als agents daar duurzame projectgegevens opslaan.
- Voer na grote updates `openclaw doctor` uit om configuratiemigraties en
  servicewaarschuwingen te detecteren.

## Problemen oplossen

- `gateway probe` kan geen verbinding maken: controleer of de Caddy-hostnaam naar de app
  verwijst en of de container luistert op `0.0.0.0:1455`.
- Authenticatie mislukt: roteer het token tegelijkertijd in de geheimen van EasyRunner
  en in de lokale clientopdracht.
- Bestanden zijn na herstel eigendom van root: de image wordt uitgevoerd als `node` (uid 1000);
  herstel de gekoppelde volumes zodat die gebruiker kan schrijven naar
  `/home/node/.openclaw` en `/home/node/.openclaw/workspace`.
- Browser- of kanaalplugins werken niet: controleer of de vereiste externe
  binaire bestanden, uitgaand netwerkverkeer en gekoppelde aanmeldgegevens in de
  container beschikbaar zijn.
