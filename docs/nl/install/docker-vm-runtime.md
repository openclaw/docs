---
read_when:
    - Je rolt OpenClaw uit op een cloud-VM met Docker
    - Je hebt het gedeelde binaire bakproces, persistentie en de updateflow nodig
summary: Gedeelde Docker-VM-runtimestappen voor langdurig draaiende OpenClaw Gateway-hostsystemen
title: Docker-VM-uitvoeringsomgeving
x-i18n:
    generated_at: "2026-05-02T11:19:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
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
3. De containers opnieuw starten

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
De bovenstaande URL's zijn voorbeelden. Kies voor ARM-gebaseerde VM's de `arm64`-assets. Pin versiegebonden release-URL's voor reproduceerbare builds.
</Note>

## Bouwen en starten

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Als de build tijdens `pnpm install --frozen-lockfile` mislukt met `Killed` of `exit code 137`, heeft de VM onvoldoende geheugen.
Gebruik een grotere machineklasse voordat je het opnieuw probeert.

Controleer de binaries:

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

Controleer de Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Verwachte uitvoer:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Wat waar blijft bestaan

OpenClaw draait in Docker, maar Docker is niet de bron van waarheid.
Alle langlevende state moet herstarts, rebuilds en reboots overleven.

| Component           | Locatie                                                | Persistentiemechanisme | Opmerkingen                                                   |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| Gateway-config      | `/home/node/.openclaw/`                                | Hostvolumemount        | Bevat `openclaw.json`, `.env`                                 |
| Model-auth-profielen | `/home/node/.openclaw/agents/`                         | Hostvolumemount        | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API-sleutels) |
| Skill-configuraties | `/home/node/.openclaw/skills/`                         | Hostvolumemount        | State op Skill-niveau                                         |
| Agent-werkruimte    | `/home/node/.openclaw/workspace/`                      | Hostvolumemount        | Code en agent-artifacts                                       |
| WhatsApp-sessie     | `/home/node/.openclaw/`                                | Hostvolumemount        | Behoudt QR-login                                              |
| Gmail-keyring       | `/home/node/.openclaw/`                                | Hostvolume + wachtwoord | Vereist `GOG_KEYRING_PASSWORD`                                |
| Plugin-pakketten    | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Hostvolumemount        | Downloadbare roots van Plugin-pakketten                       |
| Externe binaries    | `/usr/local/bin/`                                      | Docker-image           | Moeten tijdens buildtijd worden ingebakken                    |
| Node-runtime        | Containerbestandssysteem                              | Docker-image           | Opnieuw gebouwd bij elke image-build                          |
| OS-pakketten        | Containerbestandssysteem                              | Docker-image           | Niet installeren tijdens runtime                              |
| Docker-container    | Vluchtig                                               | Herstartbaar           | Veilig om te verwijderen                                      |

## Updates

Om OpenClaw op de VM bij te werken:

```bash
git pull
docker compose build
docker compose up -d
```

## Gerelateerd

- [Docker](/nl/install/docker)
- [Podman](/nl/install/podman)
- [ClawDock](/nl/install/clawdock)
