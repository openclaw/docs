---
read_when:
    - Stai distribuendo OpenClaw su una VM cloud con Docker
    - Hai bisogno del flusso condiviso di bake dei binari, persistenza e aggiornamento
summary: Passaggi runtime Docker VM condivisi per host Gateway OpenClaw a lunga durata
title: Runtime Docker VM
x-i18n:
    generated_at: "2026-04-05T13:55:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Runtime Docker VM

Passaggi runtime condivisi per installazioni Docker basate su VM come GCP, Hetzner e provider VPS simili.

## Inserisci i binari richiesti nell'immagine

Installare binari dentro un container in esecuzione è una trappola.
Qualsiasi cosa installata a runtime andrà persa al riavvio.

Tutti i binari esterni richiesti dalle Skills devono essere installati in fase di build dell'immagine.

Gli esempi qui sotto mostrano solo tre binari comuni:

- `gog` per l'accesso a Gmail
- `goplaces` per Google Places
- `wacli` per WhatsApp

Questi sono esempi, non un elenco completo.
Puoi installare tutti i binari necessari usando lo stesso schema.

Se in seguito aggiungi nuove Skills che dipendono da binari aggiuntivi, devi:

1. Aggiornare il Dockerfile
2. Ricompilare l'immagine
3. Riavviare i container

**Esempio di Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

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
Gli URL di download sopra sono per x86_64 (amd64). Per VM basate su ARM (ad esempio Hetzner ARM, GCP Tau T2A), sostituisci gli URL di download con le varianti ARM64 appropriate dalla pagina delle release di ciascuno strumento.
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

Output atteso:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifica il Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Output atteso:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Cosa persiste e dove

OpenClaw viene eseguito in Docker, ma Docker non è la fonte di verità.
Tutto lo stato a lunga durata deve sopravvivere a riavvii, rebuild e reboot.

| Componente         | Posizione                        | Meccanismo di persistenza | Note                                                          |
| ------------------ | -------------------------------- | ------------------------- | ------------------------------------------------------------- |
| Configurazione gateway | `/home/node/.openclaw/`       | Mount di volume host      | Include `openclaw.json`, `.env`                               |
| Profili auth dei modelli | `/home/node/.openclaw/agents/` | Mount di volume host   | `agents/<agentId>/agent/auth-profiles.json` (OAuth, chiavi API) |
| Configurazioni delle Skills | `/home/node/.openclaw/skills/` | Mount di volume host | Stato a livello di Skills                                     |
| Workspace dell'agente | `/home/node/.openclaw/workspace/` | Mount di volume host  | Codice e artefatti dell'agente                                |
| Sessione WhatsApp  | `/home/node/.openclaw/`          | Mount di volume host      | Preserva il login QR                                          |
| Keyring Gmail      | `/home/node/.openclaw/`          | Volume host + password    | Richiede `GOG_KEYRING_PASSWORD`                               |
| Binari esterni     | `/usr/local/bin/`                | Immagine Docker           | Devono essere inseriti in fase di build                       |
| Runtime Node       | Filesystem del container         | Immagine Docker           | Ricostruito a ogni build dell'immagine                        |
| Pacchetti OS       | Filesystem del container         | Immagine Docker           | Non installare a runtime                                      |
| Container Docker   | Effimero                         | Riavviabile               | Sicuro da distruggere                                         |

## Aggiornamenti

Per aggiornare OpenClaw sulla VM:

```bash
git pull
docker compose build
docker compose up -d
```
