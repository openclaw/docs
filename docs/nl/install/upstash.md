---
read_when:
    - OpenClaw implementeren op Upstash Box
    - U wilt een beheerde Linux-omgeving voor OpenClaw met via SSH getunnelde toegang tot het dashboard
summary: Host OpenClaw op Upstash Box met keep-alive en toegang via een SSH-tunnel
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T08:56:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Voer een permanente OpenClaw Gateway uit op Upstash Box, een beheerde Linux-omgeving
met ondersteuning voor een keep-alive-levenscyclus.

Gebruik een SSH-tunnel voor toegang tot het dashboard. Stel de Gateway-poort niet rechtstreeks
bloot aan het openbare internet.

## Vereisten

- Upstash-account
- Keep-alive Upstash Box
- SSH-client op uw lokale computer

## Een Box maken

Maak een keep-alive Box in de Upstash Console. Noteer de Box-ID (bijvoorbeeld
`right-flamingo-14486`) en uw Box-API-sleutel.

Upstash onderhoudt de actuele handleiding voor OpenClaw Box op
[OpenClaw instellen](https://upstash.com/docs/box/guides/openclaw-setup).

## Verbinding maken via een SSH-tunnel

Stuur de OpenClaw-dashboardpoort door naar uw lokale computer. Gebruik uw Box-API-sleutel
als het SSH-wachtwoord wanneer daarom wordt gevraagd:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

De keep-alive-opties verminderen het wegvallen van inactieve tunnels tijdens de onboarding.

## OpenClaw installeren

In de Box:

```bash
sudo npm install -g openclaw
```

## Onboarding uitvoeren

```bash
openclaw onboard --install-daemon
```

Volg de aanwijzingen. Kopieer de dashboard-URL en het token wanneer de onboarding is voltooid.

## De Gateway starten

Configureer de Gateway voor het Box-netwerk en start deze op de achtergrond:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Open, terwijl de SSH-tunnel actief is, de dashboard-URL lokaal:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Automatisch opnieuw starten

Stel deze opdracht in als het initialisatiescript van de Box, zodat de Gateway opnieuw wordt gestart wanneer de Box
start:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Problemen oplossen

Als SSH tijdens de onboarding vastloopt, maakt u opnieuw verbinding met een schone SSH-configuratie en
keep-alive-opties:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Hiermee worden verouderde lokale instellingen in `~/.ssh/config` omzeild en blijft de tunnel actief
tijdens perioden van netwerkinactiviteit.

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Gateway-beveiliging](/nl/gateway/security)
- [OpenClaw bijwerken](/nl/install/updating)
