---
read_when:
    - Vous déployez OpenClaw sur une machine virtuelle cloud avec Docker
    - Vous avez besoin du flux partagé de création du binaire, de persistance et de mise à jour
summary: Étapes d’exécution dans une VM Docker partagée pour les hôtes Gateway OpenClaw de longue durée
title: Environnement d’exécution de machine virtuelle Docker
x-i18n:
    generated_at: "2026-07-12T15:25:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Étapes d’exécution partagées pour les installations Docker sur machine virtuelle, notamment chez GCP, Hetzner et des fournisseurs de VPS similaires.

## Intégrer les binaires requis à l’image

Installer des binaires dans un conteneur en cours d’exécution est un piège : tout ce qui est installé
à l’exécution est perdu au redémarrage. Intégrez à l’image, lors de sa construction, chaque binaire
externe dont un skill a besoin.

Les exemples ci-dessous couvrent uniquement trois binaires, par ordre alphabétique :

- `gog` (provenant de `gogcli`) pour accéder à Gmail
- `goplaces` pour Google Places
- `wacli` pour WhatsApp

Il s’agit d’exemples, et non d’une liste exhaustive. Installez autant de binaires que nécessaire pour vos
skills en suivant le même modèle. Lorsque vous ajoutez ultérieurement un skill nécessitant un nouveau
binaire :

1. Mettez à jour le Dockerfile.
2. Reconstruisez l’image.
3. Redémarrez les conteneurs.

**Exemple de Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Exemple de binaire 1 : CLI Gmail (gogcli — installé sous le nom `gog`)
# Copiez l’URL actuelle de l’artefact Linux depuis https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Exemple de binaire 2 : CLI Google Places
# Copiez l’URL actuelle de l’artefact Linux depuis https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Exemple de binaire 3 : CLI WhatsApp
# Copiez l’URL actuelle de l’artefact Linux depuis https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Ajoutez d’autres binaires ci-dessous en suivant le même modèle

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
Les URL ci-dessus sont des exemples. Pour les machines virtuelles basées sur ARM, choisissez les artefacts `arm64`. Pour des constructions reproductibles, épinglez des URL de versions publiées précises.
</Note>

## Construire et lancer

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la construction échoue avec `Killed` ou le code de sortie 137 pendant `pnpm install --frozen-lockfile`, la machine virtuelle manque de mémoire. Utilisez une classe de machine plus puissante avant de réessayer.

Vérifiez les binaires :

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Sortie attendue :

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Vérifiez que le Gateway est opérationnel :

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Le renvoi d’une réponse 200 par `/healthz` confirme que le processus Gateway est à l’écoute et opérationnel ; le `HEALTHCHECK` intégré à l’image interroge le même point de terminaison.

## Emplacement des données persistantes

OpenClaw s’exécute dans Docker, mais Docker n’est pas la source de vérité. Tous les états durables doivent survivre aux redémarrages, aux reconstructions et aux réamorçages.

| Composant                       | Emplacement                                            | Mécanisme de persistance        | Remarques                                                                                                                          |
| ------------------------------- | ------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Configuration du Gateway        | `/home/node/.openclaw/`                                | Montage d’un volume hôte        | Inclut `openclaw.json`                                                                                                             |
| Identifiants de canal/fournisseur | `/home/node/.openclaw/credentials/`                  | Montage d’un volume hôte        | Informations d’identification des canaux et fournisseurs                                                                           |
| Profils d’authentification des modèles | `/home/node/.openclaw/agents/`                 | Montage d’un volume hôte        | `agents/<agentId>/agent/auth-profiles.json` (OAuth, clés d’API)                                                                    |
| Ancien fichier de clés OAuth    | `/home/node/.config/openclaw/`                         | Montage d’un volume hôte        | Compatibilité en lecture seule pour les fichiers annexes OAuth antérieurs à la migration ; `openclaw doctor --fix` les migre vers `auth-profiles.json` |
| Configurations des skills       | `/home/node/.openclaw/skills/`                         | Montage d’un volume hôte        | État propre à chaque skill                                                                                                         |
| Espace de travail de l’agent    | `/home/node/.openclaw/workspace/`                      | Montage d’un volume hôte        | Code et artefacts de l’agent                                                                                                       |
| Session WhatsApp                | `/home/node/.openclaw/`                                | Montage d’un volume hôte        | Préserve la connexion par code QR                                                                                                  |
| Trousseau Gmail                 | `/home/node/.openclaw/`                                | Volume hôte + mot de passe      | Nécessite `GOG_KEYRING_PASSWORD`                                                                                                   |
| Paquets de plugins              | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montage d’un volume hôte        | Racines des paquets de plugins téléchargeables                                                                                     |
| Binaires externes               | `/usr/local/bin/`                                      | Image Docker                    | Doivent être intégrés lors de la construction                                                                                      |
| Environnement d’exécution Node  | Système de fichiers du conteneur                       | Image Docker                    | Reconstruit à chaque construction de l’image                                                                                       |
| Paquets du système d’exploitation | Système de fichiers du conteneur                     | Image Docker                    | Ne les installez pas à l’exécution                                                                                                 |
| Conteneur Docker                | Éphémère                                               | Redémarrable                    | Peut être détruit sans risque                                                                                                      |

## Mises à jour

Pour mettre à jour OpenClaw sur la machine virtuelle :

```bash
git pull
docker compose build
docker compose up -d
```

## Voir aussi

- [Docker](/fr/install/docker)
- [Podman](/fr/install/podman)
- [ClawDock](/fr/install/clawdock)
