---
read_when:
    - Je wilt een goedkope Linux-host die altijd actief is voor de Gateway
    - Je wilt externe toegang tot de Control UI zonder je eigen VPS te beheren
summary: Voer OpenClaw Gateway uit op exe.dev (VM + HTTPS-proxy) voor externe toegang
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T08:59:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Doel:** OpenClaw Gateway draaiend op een [exe.dev](https://exe.dev)-VM, bereikbaar via `https://<vm-name>.exe.xyz`.

Deze handleiding gaat uit van de standaardimage **exeuntu** van exe.dev. Pas de pakketten voor andere distributies dienovereenkomstig aan.

## Wat u nodig hebt

- exe.dev-account
- `ssh exe.dev`-toegang tot exe.dev-VM's (optioneel, voor handmatige configuratie)

## Snelstart voor beginners

1. Open [https://exe.new/openclaw](https://exe.new/openclaw)
2. Vul indien nodig uw authenticatiesleutel/-token in
3. Klik naast uw VM op "Agent" en wacht tot Shelley de inrichting heeft voltooid
4. Open `https://<vm-name>.exe.xyz/` en authenticeer u met het geconfigureerde gedeelde geheim (standaard tokenauthenticatie; wachtwoordauthenticatie werkt ook als u `gateway.auth.mode` wijzigt)
5. Keur wachtende aanvragen voor apparaatkoppeling goed met `openclaw devices approve <requestId>`

## Geautomatiseerde installatie met Shelley

Shelley, de agent van exe.dev, kan OpenClaw installeren via een prompt:

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Handmatige installatie

<Steps>
  <Step title="De VM maken">
    Vanaf uw apparaat:

    ```bash
    ssh exe.dev new
    ```

    Maak vervolgens verbinding:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Houd deze VM **stateful**. OpenClaw bewaart `openclaw.json`, `auth-profiles.json` per agent, sessies en kanaal-/providerstatus onder `~/.openclaw/`, en de werkruimte onder `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Vereisten installeren (op de VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="OpenClaw installeren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="nginx configureren als proxy naar poort 8000">
    Bewerk `/etc/nginx/sites-enabled/default`:

    ```nginx
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

    Overschrijf doorstuurheaders in plaats van door de client aangeleverde ketens te behouden. OpenClaw vertrouwt doorgestuurde IP-metagegevens alleen van expliciet geconfigureerde proxy's, en `X-Forwarded-For`-ketens waaraan waarden worden toegevoegd, worden beschouwd als een beveiligingsrisico.

  </Step>

  <Step title="Toegang krijgen tot OpenClaw en apparaten goedkeuren">
    Open `https://<vm-name>.exe.xyz/` (zie de uitvoer van de Control UI tijdens de onboarding). Als om authenticatie wordt gevraagd, plakt u het geconfigureerde gedeelde geheim van de VM.

    Deze handleiding gebruikt standaard tokenauthenticatie. Haal daarom `gateway.auth.token` op met `openclaw config get gateway.auth.token` of genereer een nieuw token met `openclaw doctor --n`. Als u de Gateway hebt overgeschakeld op wachtwoordauthenticatie, gebruikt u in plaats daarvan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Keur apparaten goed met `openclaw devices list` en `openclaw devices approve <requestId>`. Gebruik bij twijfel Shelley vanuit uw browser.

  </Step>
</Steps>

## Externe kanaalconfiguratie

Geef voor externe hosts de voorkeur aan één aanroep van `config patch` boven veel SSH-aanroepen van `config set`. Bewaar echte tokens in de VM-omgeving of in `~/.openclaw/.env` en plaats alleen SecretRefs in `openclaw.json`. Zie [Geheimenbeheer](/nl/gateway/secrets) voor het volledige SecretRef-contract.

Zorg er op de VM voor dat de serviceomgeving de benodigde geheimen bevat:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Maak op uw lokale machine een patchbestand en stuur dit via een pipe naar de VM:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
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

Gebruik `--replace-path` wanneer een geneste toelatingslijst exact de patchwaarde moet krijgen, bijvoorbeeld bij het vervangen van een toelatingslijst voor een Discord-kanaal:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Zie [Discord](/nl/channels/discord) en [Slack](/nl/channels/slack) voor de volledige naslag voor kanaalconfiguratie.

## Externe toegang

exe.dev verzorgt de authenticatie voor externe toegang. Standaard wordt HTTP-verkeer van poort 8000 doorgestuurd naar `https://<vm-name>.exe.xyz` met e-mailauthenticatie.

## Bijwerken

```bash
openclaw update
```

Zie [Bijwerken](/nl/install/updating) voor het wisselen van kanalen en handmatig herstel.

## Gerelateerd

- [Externe Gateway](/nl/gateway/remote)
- [Installatieoverzicht](/nl/install)
