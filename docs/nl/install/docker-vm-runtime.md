---
read_when:
    - Je implementeert OpenClaw op een cloud-VM met Docker
    - Je hebt het gedeelde binaire bakproces, persistentie en de updateflow nodig
summary: Gedeelde runtimestappen voor Docker-VM's voor langlevende OpenClaw Gateway-hosts
title: Docker-VM-runtime
x-i18n:
    generated_at: "2026-04-29T22:53:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Gedeelde runtimestappen voor VM-gebaseerde Docker-installaties zoals GCP, Hetzner en vergelijkbare VPS-providers.

## Vereiste binaries in de image bakken

Binaries installeren in een draaiende container is een valkuil.
Alles wat tijdens runtime wordt geïnstalleerd, gaat verloren bij een herstart.

Alle externe binaries die Skills vereisen, moeten tijdens het bouwen van de image worden geïnstalleerd.

De voorbeelden hieronder tonen slechts drie veelvoorkomende binaries:

- `gog` (van `gogcli`) voor Gmail-toegang
- `goplaces` voor Google Places
- `wacli` voor WhatsApp

Dit zijn voorbeelden, geen volledige lijst.
Je kunt zoveel binaries installeren als nodig is met hetzelfde patroon.

Als je later nieuwe Skills toevoegt die afhankelijk zijn van extra binaries, moet je:

1. De Dockerfile bijwerken
2. De image opnieuw bouwen
3. De containers herstarten

**Voorbeeld-Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
De bovenstaande URL's zijn voorbeelden. Kies voor ARM-gebaseerde VM's de `arm64`-assets. Pin release-URL's met versienummers voor reproduceerbare builds.
</Note>

## Bouwen en starten

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Als de build tijdens `pnpm install --frozen-lockfile` mislukt met `Killed` of `exit code 137`, heeft de VM onvoldoende geheugen.
Gebruik een grotere machineklasse voordat je het opnieuw probeert.

Controleer binaries:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Verwachte uitvoer:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Controleer Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Verwachte uitvoer:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Wat waar behouden blijft

OpenClaw draait in Docker, maar Docker is niet de bron van waarheid.
Alle langlevende state moet herstarts, rebuilds en reboots overleven.

| Component           | Locatie                                  | Persistentie-mechanisme | Opmerkingen                                                   |
| ------------------- | ---------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| Gateway-config      | `/home/node/.openclaw/`                  | Host-volumemount        | Bevat `openclaw.json`, `.env`                                 |
| Modelauth-profielen | `/home/node/.openclaw/agents/`           | Host-volumemount        | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| Skills-configuraties | `/home/node/.openclaw/skills/`          | Host-volumemount        | State op Skills-niveau                                        |
| Agent-werkruimte    | `/home/node/.openclaw/workspace/`        | Host-volumemount        | Code en agent-artefacten                                      |
| WhatsApp-sessie     | `/home/node/.openclaw/`                  | Host-volumemount        | Behoudt QR-login                                              |
| Gmail-sleutelbos    | `/home/node/.openclaw/`                  | Host-volume + wachtwoord | Vereist `GOG_KEYRING_PASSWORD`                               |
| Plugin-runtime-afhankelijkheden | `/var/lib/openclaw/plugin-runtime-deps/` | Docker-volume met naam | Gegenereerde gebundelde Plugin-afhankelijkheden en runtimemirrors |
| Externe binaries    | `/usr/local/bin/`                        | Docker-image            | Moeten tijdens het bouwen worden ingebakken                   |
| Node-runtime        | Containerbestandssysteem                 | Docker-image            | Wordt bij elke image-build opnieuw gebouwd                    |
| OS-pakketten        | Containerbestandssysteem                 | Docker-image            | Niet tijdens runtime installeren                              |
| Docker-container    | Tijdelijk                                | Herstartbaar            | Veilig om te verwijderen                                      |

## Updates

OpenClaw bijwerken op de VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Gerelateerd

- [Docker](/nl/install/docker)
- [Podman](/nl/install/podman)
- [ClawDock](/nl/install/clawdock)
