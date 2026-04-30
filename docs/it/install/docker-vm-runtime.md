---
read_when:
    - Stai distribuendo OpenClaw su una VM cloud con Docker
    - Serve il flusso condiviso per la preparazione del binario, la persistenza e l'aggiornamento
summary: Passaggi di runtime della VM Docker condivisa per host OpenClaw Gateway di lunga durata
title: Runtime della VM Docker
x-i18n:
    generated_at: "2026-04-30T08:57:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Passaggi di runtime condivisi per installazioni Docker basate su VM, come GCP, Hetzner e provider VPS simili.

## Integra i binari richiesti nell'immagine

Installare binari all'interno di un container in esecuzione è una trappola.
Qualsiasi cosa installata a runtime verrà persa al riavvio.

Tutti i binari esterni richiesti dalle Skills devono essere installati al momento della build dell'immagine.

Gli esempi seguenti mostrano solo tre binari comuni:

- `gog` (da `gogcli`) per l'accesso a Gmail
- `goplaces` per Google Places
- `wacli` per WhatsApp

Questi sono esempi, non un elenco completo.
Puoi installare tutti i binari necessari usando lo stesso schema.

Se in seguito aggiungi nuove Skills che dipendono da binari aggiuntivi, devi:

1. Aggiornare il Dockerfile
2. Ricostruire l'immagine
3. Riavviare i container

**Dockerfile di esempio**

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
Gli URL sopra sono esempi. Per VM basate su ARM, scegli gli asset `arm64`. Per build riproducibili, usa URL di release versionate fissati.
</Note>

## Build e avvio

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Se la build fallisce con `Killed` o `exit code 137` durante `pnpm install --frozen-lockfile`, la VM ha esaurito la memoria.
Usa una classe di macchina più grande prima di riprovare.

Verifica i binari:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Output previsto:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifica il Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Output previsto:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Cosa persiste e dove

OpenClaw viene eseguito in Docker, ma Docker non è la fonte di verità.
Tutto lo stato persistente deve sopravvivere a riavvii, rebuild e reboot.

| Componente          | Posizione                                | Meccanismo di persistenza | Note                                                          |
| ------------------- | ---------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| Configurazione Gateway | `/home/node/.openclaw/`               | Mount volume host         | Include `openclaw.json`, `.env`                               |
| Profili auth modello | `/home/node/.openclaw/agents/`          | Mount volume host         | `agents/<agentId>/agent/auth-profiles.json` (OAuth, chiavi API) |
| Configurazioni Skills | `/home/node/.openclaw/skills/`         | Mount volume host         | Stato a livello di Skills                                     |
| Workspace agente    | `/home/node/.openclaw/workspace/`        | Mount volume host         | Codice e artefatti agente                                     |
| Sessione WhatsApp   | `/home/node/.openclaw/`                  | Mount volume host         | Conserva il login QR                                          |
| Keyring Gmail       | `/home/node/.openclaw/`                  | Volume host + password    | Richiede `GOG_KEYRING_PASSWORD`                               |
| Dipendenze runtime Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Volume Docker con nome | Dipendenze Plugin in bundle generate e mirror runtime         |
| Binari esterni      | `/usr/local/bin/`                        | Immagine Docker           | Devono essere integrati al momento della build                |
| Runtime Node        | Filesystem del container                 | Immagine Docker           | Ricostruito a ogni build dell'immagine                        |
| Pacchetti OS        | Filesystem del container                 | Immagine Docker           | Non installare a runtime                                      |
| Container Docker    | Effimero                                 | Riavviabile               | Sicuro da distruggere                                         |

## Aggiornamenti

Per aggiornare OpenClaw sulla VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Correlati

- [Docker](/it/install/docker)
- [Podman](/it/install/podman)
- [ClawDock](/it/install/clawdock)
