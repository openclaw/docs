---
read_when:
    - Vous déployez OpenClaw sur une VM dans le cloud avec Docker
    - Vous avez besoin de la génération du binaire partagé, de la persistance et du flux de mise à jour
summary: Étapes d’exécution de VM Docker partagées pour les hôtes OpenClaw Gateway de longue durée
title: Environnement d’exécution de VM Docker
x-i18n:
    generated_at: "2026-05-02T07:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Étapes d’exécution partagées pour les installations Docker basées sur des VM, telles que GCP, Hetzner et des fournisseurs VPS similaires.

## Intégrer les binaires requis dans l’image

Installer des binaires dans un conteneur en cours d’exécution est un piège.
Tout ce qui est installé à l’exécution sera perdu au redémarrage.

Tous les binaires externes requis par les Skills doivent être installés au moment de la construction de l’image.

Les exemples ci-dessous montrent seulement trois binaires courants :

- `gog` (depuis `gogcli`) pour l’accès à Gmail
- `goplaces` pour Google Places
- `wacli` pour WhatsApp

Ce sont des exemples, pas une liste complète.
Vous pouvez installer autant de binaires que nécessaire en utilisant le même modèle.

Si vous ajoutez plus tard de nouveaux Skills qui dépendent de binaires supplémentaires, vous devez :

1. Mettre à jour le Dockerfile
2. Reconstruire l’image
3. Redémarrer les conteneurs

**Exemple de Dockerfile**

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
Les URL ci-dessus sont des exemples. Pour les VM basées sur ARM, choisissez les ressources `arm64`. Pour des constructions reproductibles, épinglez les URL de versions de publication versionnées.
</Note>

## Construire et lancer

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la construction échoue avec `Killed` ou `exit code 137` pendant `pnpm install --frozen-lockfile`, la VM manque de mémoire.
Utilisez une classe de machine plus grande avant de réessayer.

Vérifier les binaires :

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Sortie attendue :

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Vérifier le Gateway :

```bash
docker compose logs -f openclaw-gateway
```

Sortie attendue :

```
[gateway] listening on ws://0.0.0.0:18789
```

## Ce qui persiste et où

OpenClaw s’exécute dans Docker, mais Docker n’est pas la source de vérité.
Tout état durable doit survivre aux redémarrages, aux reconstructions et aux redémarrages système.

| Composant           | Emplacement                                            | Mécanisme de persistance | Notes                                                         |
| ------------------- | ------------------------------------------------------ | ------------------------ | ------------------------------------------------------------- |
| Configuration du Gateway | `/home/node/.openclaw/`                                | Montage de volume hôte   | Inclut `openclaw.json`, `.env`                                |
| Profils d’authentification des modèles | `/home/node/.openclaw/agents/`                         | Montage de volume hôte   | `agents/<agentId>/agent/auth-profiles.json` (OAuth, clés d’API) |
| Configurations des Skills | `/home/node/.openclaw/skills/`                         | Montage de volume hôte   | État au niveau des Skills                                     |
| Espace de travail de l’agent | `/home/node/.openclaw/workspace/`                      | Montage de volume hôte   | Code et artefacts de l’agent                                  |
| Session WhatsApp    | `/home/node/.openclaw/`                                | Montage de volume hôte   | Préserve la connexion par QR                                  |
| Trousseau Gmail     | `/home/node/.openclaw/`                                | Volume hôte + mot de passe | Requiert `GOG_KEYRING_PASSWORD`                               |
| Paquets de Plugin   | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montage de volume hôte   | Racines des paquets de Plugin téléchargeables                 |
| Binaires externes   | `/usr/local/bin/`                                      | Image Docker             | Doivent être intégrés au moment de la construction            |
| Runtime Node        | Système de fichiers du conteneur                       | Image Docker             | Reconstruit à chaque construction d’image                     |
| Paquets du SE       | Système de fichiers du conteneur                       | Image Docker             | Ne pas installer à l’exécution                                |
| Conteneur Docker    | Éphémère                                              | Redémarrable             | Peut être détruit sans risque                                 |

## Mises à jour

Pour mettre à jour OpenClaw sur la VM :

```bash
git pull
docker compose build
docker compose up -d
```

## Connexe

- [Docker](/fr/install/docker)
- [Podman](/fr/install/podman)
- [ClawDock](/fr/install/clawdock)
