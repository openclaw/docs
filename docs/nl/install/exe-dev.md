---
read_when:
    - Je wilt een goedkope Linux-host die altijd aan staat voor de Gateway
    - Je wilt externe toegang tot de Control UI zonder je eigen VPS te draaien
summary: OpenClaw Gateway uitvoeren op exe.dev (VM + HTTPS-proxy) voor externe toegang
title: exe.dev
x-i18n:
    generated_at: "2026-04-29T22:53:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Doel: OpenClaw Gateway draait op een exe.dev-VM en is bereikbaar vanaf je laptop via: `https://<vm-name>.exe.xyz`

Deze pagina gaat uit van de standaard **exeuntu**-image van exe.dev. Als je een andere distro hebt gekozen, koppel de pakketten dan dienovereenkomstig.

## Snelle route voor beginners

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Vul je auth-sleutel/token in waar nodig
3. Klik op "Agent" naast je VM en wacht tot Shelley klaar is met provisioneren
4. Open `https://<vm-name>.exe.xyz/` en authenticeer met het geconfigureerde gedeelde geheim (deze handleiding gebruikt standaard tokenauthenticatie, maar wachtwoordauthenticatie werkt ook als je `gateway.auth.mode` wijzigt)
5. Keur eventuele wachtende apparaatkoppelingsverzoeken goed met `openclaw devices approve <requestId>`

## Wat je nodig hebt

- exe.dev-account
- `ssh exe.dev`-toegang tot virtuele machines van [exe.dev](https://exe.dev) (optioneel)

## Geautomatiseerde installatie met Shelley

Shelley, de agent van [exe.dev](https://exe.dev), kan OpenClaw direct installeren met onze
prompt. De gebruikte prompt staat hieronder:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Handmatige installatie

## 1) Maak de VM aan

Vanaf je apparaat:

```bash
ssh exe.dev new
```

Maak daarna verbinding:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Houd deze VM **stateful**. OpenClaw slaat `openclaw.json`, per-agent `auth-profiles.json`, sessies en kanaal-/providerstatus op onder `~/.openclaw/`, plus de werkruimte onder `~/.openclaw/workspace/`.
</Tip>

## 2) Installeer vereisten (op de VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Installeer OpenClaw

Voer het OpenClaw-installatiescript uit:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Stel nginx in om OpenClaw naar poort 8000 te proxyen

Bewerk `/etc/nginx/sites-enabled/default` met

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Overschrijf forwardingheaders in plaats van door clients aangeleverde ketens te behouden.
OpenClaw vertrouwt doorgestuurde IP-metadata alleen van expliciet geconfigureerde proxy's,
en append-achtige `X-Forwarded-For`-ketens worden behandeld als een hardeningsrisico.

## 5) Open OpenClaw en verleen rechten

Open `https://<vm-name>.exe.xyz/` (zie de Control UI-uitvoer van onboarding). Als er om authenticatie wordt gevraagd, plak dan het
geconfigureerde gedeelde geheim van de VM. Deze handleiding gebruikt tokenauthenticatie, dus haal `gateway.auth.token`
op met `openclaw config get gateway.auth.token` (of genereer er een met `openclaw doctor --generate-gateway-token`).
Als je de Gateway hebt gewijzigd naar wachtwoordauthenticatie, gebruik dan in plaats daarvan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Keur apparaten goed met `openclaw devices list` en `openclaw devices approve <requestId>`. Gebruik bij twijfel Shelley vanuit je browser!

## Externe kanaalinstelling

Gebruik voor externe hosts liever één `config patch`-aanroep dan veel SSH-aanroepen naar `config set`. Bewaar echte tokens in de VM-omgeving of `~/.openclaw/.env`, en zet alleen SecretRefs in `openclaw.json`.

Zorg er op de VM voor dat de serviceomgeving de geheimen bevat die deze nodig heeft:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Maak vanaf je lokale machine een patchbestand en pipe dit naar de VM:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Gebruik `--replace-path` wanneer een geneste allowlist exact de patchwaarde moet worden, bijvoorbeeld bij het vervangen van een Discord-kanaalallowlist:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Externe toegang

Externe toegang wordt afgehandeld door de authenticatie van [exe.dev](https://exe.dev). Standaard
wordt HTTP-verkeer vanaf poort 8000 doorgestuurd naar `https://<vm-name>.exe.xyz`
met e-mailauthenticatie.

## Bijwerken

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Handleiding: [Bijwerken](/nl/install/updating)

## Gerelateerd

- [Externe gateway](/nl/gateway/remote)
- [Installatieoverzicht](/nl/install)
