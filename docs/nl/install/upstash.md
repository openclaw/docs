---
read_when:
    - OpenClaw implementeren op Upstash Box
    - U wilt een beheerde Linux-omgeving voor OpenClaw met dashboardtoegang via een SSH-tunnel
summary: OpenClaw hosten op Upstash Box met keep-alive en SSH-tunneltoegang
title: Upstash Box
x-i18n:
    generated_at: "2026-06-27T17:44:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Voer een permanente OpenClaw Gateway uit op Upstash Box, een beheerde Linux-omgeving
met ondersteuning voor keep-alive-levenscycli.

Gebruik een SSH-tunnel voor dashboardtoegang. Stel de Gateway-poort niet rechtstreeks
bloot aan het openbare internet.

## Vereisten

- Upstash-account
- Keep-alive Upstash Box
- SSH-client op je lokale machine

## Een Box maken

Maak een keep-alive Box in de Upstash Console. Noteer de Box-ID, zoals
`right-flamingo-14486`, en je Box-API-sleutel.

Upstash onderhoudt de actuele OpenClaw Box-walkthrough op
[OpenClaw-installatie](https://upstash.com/docs/box/guides/openclaw-setup).

## Verbinden met een SSH-tunnel

Stuur de OpenClaw-dashboardpoort door naar je lokale machine. Gebruik je Box-API-sleutel
als het SSH-wachtwoord wanneer daarom wordt gevraagd:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

De keepalive-opties verminderen het wegvallen van inactieve tunnels tijdens onboarding.

## OpenClaw installeren

Binnen de Box:

```bash
sudo npm install -g openclaw
```

## Onboarding uitvoeren

```bash
openclaw onboard --install-daemon
```

Volg de prompts. Kopieer de dashboard-URL en token wanneer onboarding is voltooid.

## De Gateway starten

Configureer de Gateway voor het Box-netwerk en start deze op de achtergrond:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Open de dashboard-URL lokaal terwijl de SSH-tunnel actief is:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Automatisch herstarten

Stel deze opdracht in als het Box-init-script, zodat de Gateway opnieuw start wanneer de Box
start:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Problemen oplossen

Als SSH vastloopt tijdens onboarding, maak dan opnieuw verbinding met een schone SSH-configuratie en
keepalives:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Dit omzeilt verouderde lokale `~/.ssh/config`-instellingen en houdt de tunnel actief
tijdens inactieve netwerkperioden.

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Gateway-beveiliging](/nl/gateway/security)
- [OpenClaw bijwerken](/nl/install/updating)
