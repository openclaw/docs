---
read_when:
    - Sie stellen OpenClaw auf einer Cloud-VM mit Docker bereit
    - Sie benötigen den gemeinsamen Binär-Build, Persistenz und den Update-Ablauf
summary: Gemeinsame Docker-VM-Runtime-Schritte für dauerhaft betriebene OpenClaw Gateway-Hosts
title: Docker-VM-Laufzeit
x-i18n:
    generated_at: "2026-04-30T06:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Gemeinsame Laufzeitschritte für VM-basierte Docker-Installationen wie GCP, Hetzner und ähnliche VPS-Provider.

## Erforderliche Binärdateien in das Image einbauen

Binärdateien in einem laufenden Container zu installieren, ist ein Fallstrick.
Alles, was zur Laufzeit installiert wird, geht bei einem Neustart verloren.

Alle externen Binärdateien, die von Skills benötigt werden, müssen zur Image-Build-Zeit installiert werden.

Die folgenden Beispiele zeigen nur drei häufige Binärdateien:

- `gog` (aus `gogcli`) für Gmail-Zugriff
- `goplaces` für Google Places
- `wacli` für WhatsApp

Dies sind Beispiele, keine vollständige Liste.
Sie können nach demselben Muster beliebig viele Binärdateien installieren.

Wenn Sie später neue Skills hinzufügen, die von zusätzlichen Binärdateien abhängen, müssen Sie:

1. Die Dockerfile aktualisieren
2. Das Image neu erstellen
3. Die Container neu starten

**Beispiel-Dockerfile**

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
Die obigen URLs sind Beispiele. Wählen Sie für ARM-basierte VMs die `arm64`-Assets. Für reproduzierbare Builds pinnen Sie versionierte Release-URLs.
</Note>

## Erstellen und starten

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Wenn der Build während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, hat die VM nicht genug Arbeitsspeicher.
Verwenden Sie vor einem erneuten Versuch eine größere Maschinenklasse.

Binärdateien überprüfen:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Erwartete Ausgabe:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway überprüfen:

```bash
docker compose logs -f openclaw-gateway
```

Erwartete Ausgabe:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Was wo dauerhaft gespeichert wird

OpenClaw läuft in Docker, aber Docker ist nicht die maßgebliche Quelle.
Jeder langlebige Zustand muss Neustarts, Rebuilds und Reboots überstehen.

| Komponente          | Speicherort                              | Persistenzmechanismus       | Hinweise                                                      |
| ------------------- | ---------------------------------------- | --------------------------- | ------------------------------------------------------------- |
| Gateway-Konfiguration | `/home/node/.openclaw/`                | Host-Volume-Mount           | Enthält `openclaw.json`, `.env`                               |
| Modell-Auth-Profile | `/home/node/.openclaw/agents/`           | Host-Volume-Mount           | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API-Schlüssel) |
| Skill-Konfigurationen | `/home/node/.openclaw/skills/`         | Host-Volume-Mount           | Zustand auf Skill-Ebene                                       |
| Agent-Arbeitsbereich | `/home/node/.openclaw/workspace/`       | Host-Volume-Mount           | Code und Agent-Artefakte                                      |
| WhatsApp-Sitzung    | `/home/node/.openclaw/`                  | Host-Volume-Mount           | Bewahrt die QR-Anmeldung                                      |
| Gmail-Keyring       | `/home/node/.openclaw/`                  | Host-Volume + Passwort      | Erfordert `GOG_KEYRING_PASSWORD`                              |
| Plugin-Laufzeitabhängigkeiten | `/var/lib/openclaw/plugin-runtime-deps/` | Benanntes Docker-Volume | Generierte gebündelte Plugin-Abhängigkeiten und Laufzeit-Mirrors |
| Externe Binärdateien | `/usr/local/bin/`                       | Docker-Image                | Müssen zur Build-Zeit eingebaut werden                        |
| Node-Laufzeit       | Container-Dateisystem                    | Docker-Image                | Wird bei jedem Image-Build neu erstellt                       |
| Betriebssystempakete | Container-Dateisystem                   | Docker-Image                | Nicht zur Laufzeit installieren                               |
| Docker-Container    | Flüchtig                                 | Neustartbar                 | Kann sicher gelöscht werden                                   |

## Updates

So aktualisieren Sie OpenClaw auf der VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Verwandte Themen

- [Docker](/de/install/docker)
- [Podman](/de/install/podman)
- [ClawDock](/de/install/clawdock)
