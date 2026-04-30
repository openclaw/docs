---
read_when:
    - Vous déployez OpenClaw sur une machine virtuelle cloud avec Docker
    - Vous avez besoin du flux partagé de préparation du binaire, de persistance et de mise à jour
summary: Étapes d’exécution de la VM Docker partagée pour les hôtes OpenClaw Gateway de longue durée
title: Environnement d’exécution de VM Docker
x-i18n:
    generated_at: "2026-04-30T07:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Étapes d’exécution partagées pour les installations Docker sur VM, comme GCP, Hetzner et les fournisseurs VPS similaires.

## Intégrer les binaires requis dans l’image

Installer des binaires dans un conteneur en cours d’exécution est un piège.
Tout ce qui est installé à l’exécution sera perdu au redémarrage.

Tous les binaires externes requis par les Skills doivent être installés au moment de la construction de l’image.

Les exemples ci-dessous ne montrent que trois binaires courants :

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
Les URL ci-dessus sont des exemples. Pour les VM basées sur ARM, choisissez les ressources `arm64`. Pour des builds reproductibles, épinglez des URL de versions publiées.
</Note>

## Construire et lancer

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la construction échoue avec `Killed` ou `exit code 137` pendant `pnpm install --frozen-lockfile`, la VM manque de mémoire.
Utilisez une classe de machine plus grande avant de réessayer.

Vérifiez les binaires :

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

Vérifiez le Gateway :

```bash
docker compose logs -f openclaw-gateway
```

Sortie attendue :

```
[gateway] listening on ws://0.0.0.0:18789
```

## Ce qui persiste et où

OpenClaw s’exécute dans Docker, mais Docker n’est pas la source de vérité.
Tout état durable doit survivre aux redémarrages, reconstructions et redémarrages système.

| Composant           | Emplacement                              | Mécanisme de persistance | Notes                                                         |
| ------------------- | ---------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| Configuration du Gateway | `/home/node/.openclaw/`                  | Montage de volume hôte   | Inclut `openclaw.json`, `.env`                                |
| Profils d’authentification des modèles | `/home/node/.openclaw/agents/`           | Montage de volume hôte   | `agents/<agentId>/agent/auth-profiles.json` (OAuth, clés API) |
| Configurations de Skill | `/home/node/.openclaw/skills/`           | Montage de volume hôte   | État au niveau du Skill                                       |
| Espace de travail de l’agent | `/home/node/.openclaw/workspace/`        | Montage de volume hôte   | Code et artefacts d’agent                                     |
| Session WhatsApp    | `/home/node/.openclaw/`                  | Montage de volume hôte   | Préserve la connexion par QR                                  |
| Trousseau Gmail     | `/home/node/.openclaw/`                  | Volume hôte + mot de passe | Nécessite `GOG_KEYRING_PASSWORD`                              |
| Dépendances d’exécution de Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Volume nommé Docker      | Dépendances de Plugin groupés générées et miroirs d’exécution |
| Binaires externes   | `/usr/local/bin/`                        | Image Docker             | Doivent être intégrés au moment de la construction            |
| Environnement d’exécution Node | Système de fichiers du conteneur         | Image Docker             | Reconstruit à chaque construction d’image                     |
| Paquets du système d’exploitation | Système de fichiers du conteneur         | Image Docker             | Ne pas installer à l’exécution                                |
| Conteneur Docker    | Éphémère                                 | Redémarrable             | Peut être détruit sans risque                                 |

## Mises à jour

Pour mettre à jour OpenClaw sur la VM :

```bash
git pull
docker compose build
docker compose up -d
```

## Liens connexes

- [Docker](/fr/install/docker)
- [Podman](/fr/install/podman)
- [ClawDock](/fr/install/clawdock)
