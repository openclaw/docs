---
read_when:
    - Stai distribuendo OpenClaw su una VM cloud con Docker
    - Ti servono la compilazione del binario condiviso, la persistenza e il flusso di aggiornamento
summary: Passaggi del runtime della VM Docker condivisa per host Gateway OpenClaw a esecuzione prolungata
title: Runtime della VM Docker
x-i18n:
    generated_at: "2026-07-12T07:07:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Passaggi di runtime condivisi per installazioni Docker basate su VM, come GCP, Hetzner e provider VPS simili.

## Integrare i binari necessari nell'immagine

Installare binari all'interno di un container in esecuzione è una trappola: tutto ciò che viene installato durante il runtime viene perso al riavvio. Integra nell'immagine, durante la fase di build, ogni binario esterno necessario a una skill.

Gli esempi seguenti riguardano solo tre binari, in ordine alfabetico:

- `gog` (da `gogcli`) per accedere a Gmail
- `goplaces` per Google Places
- `wacli` per WhatsApp

Questi sono esempi, non un elenco completo. Installa tutti i binari necessari alle tue skill usando lo stesso schema. Quando in seguito aggiungi una skill che richiede un nuovo binario:

1. Aggiorna il Dockerfile.
2. Ricostruisci l'immagine.
3. Riavvia i container.

**Esempio di Dockerfile**

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
Gli URL riportati sopra sono esempi. Per le VM basate su ARM, scegli gli artefatti `arm64`. Per build riproducibili, specifica URL di release con versione.
</Note>

## Build e avvio

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Se la build non riesce con `Killed` o con il codice di uscita 137 durante `pnpm install --frozen-lockfile`, la VM ha esaurito la memoria. Usa una classe di macchina più grande prima di riprovare.

Verifica i binari:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Output previsto:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifica che il Gateway sia attivo:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Una risposta 200 da `/healthz` conferma che il processo del Gateway è in ascolto e operativo; il comando `HEALTHCHECK` integrato nell'immagine interroga lo stesso endpoint.

## Cosa viene mantenuto e dove

OpenClaw viene eseguito in Docker, ma Docker non è la fonte autorevole. Tutto lo stato persistente deve sopravvivere a riavvii, ricostruzioni e riaccensioni.

| Componente                    | Posizione                                              | Meccanismo di persistenza    | Note                                                                                                                             |
| ----------------------------- | ------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Configurazione del Gateway    | `/home/node/.openclaw/`                                | Montaggio di volume dell'host | Include `openclaw.json`                                                                                                          |
| Credenziali di canali/provider | `/home/node/.openclaw/credentials/`                   | Montaggio di volume dell'host | Materiale delle credenziali di canali e provider                                                                                  |
| Profili di autenticazione dei modelli | `/home/node/.openclaw/agents/`                 | Montaggio di volume dell'host | `agents/<agentId>/agent/auth-profiles.json` (OAuth, chiavi API)                                                                   |
| File di chiavi OAuth legacy   | `/home/node/.config/openclaw/`                         | Montaggio di volume dell'host | Compatibilità in sola lettura per i file collaterali OAuth precedenti alla migrazione; `openclaw doctor --fix` li migra in `auth-profiles.json` |
| Configurazioni delle skill    | `/home/node/.openclaw/skills/`                         | Montaggio di volume dell'host | Stato a livello di skill                                                                                                         |
| Area di lavoro dell'agente    | `/home/node/.openclaw/workspace/`                      | Montaggio di volume dell'host | Codice e artefatti dell'agente                                                                                                   |
| Sessione WhatsApp             | `/home/node/.openclaw/`                                | Montaggio di volume dell'host | Mantiene l'accesso tramite codice QR                                                                                              |
| Portachiavi Gmail             | `/home/node/.openclaw/`                                | Volume host + password       | Richiede `GOG_KEYRING_PASSWORD`                                                                                                  |
| Pacchetti dei Plugin          | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montaggio di volume dell'host | Directory radice dei pacchetti Plugin scaricabili                                                                                 |
| Binari esterni                | `/usr/local/bin/`                                      | Immagine Docker              | Devono essere integrati durante la fase di build                                                                                  |
| Runtime Node                  | File system del container                              | Immagine Docker              | Ricostruito a ogni build dell'immagine                                                                                            |
| Pacchetti del sistema operativo | File system del container                            | Immagine Docker              | Non installare durante il runtime                                                                                                 |
| Container Docker              | Effimero                                               | Riavviabile                  | Può essere eliminato in sicurezza                                                                                                |

## Aggiornamenti

Per aggiornare OpenClaw sulla VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Contenuti correlati

- [Docker](/it/install/docker)
- [Podman](/it/install/podman)
- [ClawDock](/it/install/clawdock)
