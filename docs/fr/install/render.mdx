---
read_when:
    - Déploiement d’OpenClaw sur Render
    - Vous souhaitez un déploiement cloud déclaratif avec Render Blueprints
summary: Déployer OpenClaw sur Render avec l’infrastructure en tant que code
title: Render
x-i18n:
    generated_at: "2026-04-23T07:05:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
---

# Render

Déployez OpenClaw sur Render à l’aide de l’infrastructure en tant que code. Le Blueprint `render.yaml` inclus définit déclarativement toute votre pile — service, disque, variables d’environnement — afin que vous puissiez déployer en un clic et versionner votre infrastructure avec votre code.

## Prérequis

- Un [compte Render](https://render.com) (niveau gratuit disponible)
- Une clé API de votre [fournisseur de modèles](/fr/providers) préféré

## Déployer avec un Blueprint Render

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Cliquer sur ce lien permettra de :

1. Créer un nouveau service Render à partir du Blueprint `render.yaml` à la racine de ce dépôt.
2. Construire l’image Docker et déployer

Une fois déployée, l’URL de votre service suit le modèle `https://<service-name>.onrender.com`.

## Comprendre le Blueprint

Les Blueprints Render sont des fichiers YAML qui définissent votre infrastructure. Le `render.yaml` de ce
dépôt configure tout le nécessaire pour exécuter OpenClaw :

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # génère automatiquement un token sécurisé
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Fonctionnalités clés du Blueprint utilisées :

| Fonctionnalité        | Objectif                                                   |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Construit à partir du Dockerfile du dépôt                  |
| `healthCheckPath`     | Render surveille `/health` et redémarre les instances en mauvaise santé |
| `generateValue: true` | Génère automatiquement une valeur cryptographiquement sûre |
| `disk`                | Stockage persistant qui survit aux redéploiements          |

## Choisir un plan

| Plan      | Mise en veille       | Disque        | Idéal pour                    |
| --------- | -------------------- | ------------- | ----------------------------- |
| Free      | Après 15 min d’inactivité | Non disponible | Tests, démos                 |
| Starter   | Jamais               | 1 Go+         | Usage personnel, petites équipes |
| Standard+ | Jamais               | 1 Go+         | Production, plusieurs canaux |

Le Blueprint utilise `starter` par défaut. Pour utiliser le niveau gratuit, remplacez `plan: starter` par `plan: free` dans
le `render.yaml` de votre fork (mais notez : l’absence de disque persistant signifie que l’état d’OpenClaw
est réinitialisé à chaque déploiement).

## Après le déploiement

### Accéder à l’interface de contrôle

Le tableau de bord web est disponible à `https://<your-service>.onrender.com/`.

Connectez-vous à l’aide du secret partagé configuré. Ce modèle de déploiement génère automatiquement
`OPENCLAW_GATEWAY_TOKEN` (trouvez-le dans **Dashboard → your service →
Environment**) ; si vous le remplacez par une authentification par mot de passe, utilisez ce mot de passe
à la place.

## Fonctionnalités du Render Dashboard

### Journaux

Consultez les journaux en temps réel dans **Dashboard → your service → Logs**. Filtrez par :

- Journaux de build (création de l’image Docker)
- Journaux de déploiement (démarrage du service)
- Journaux d’exécution (sortie de l’application)

### Accès Shell

Pour le débogage, ouvrez une session shell via **Dashboard → your service → Shell**. Le disque persistant est monté sur `/data`.

### Variables d’environnement

Modifiez les variables dans **Dashboard → your service → Environment**. Les modifications déclenchent un redéploiement automatique.

### Déploiement automatique

Si vous utilisez le dépôt OpenClaw d’origine, Render ne redéploiera pas automatiquement votre OpenClaw. Pour le mettre à jour, exécutez une synchronisation manuelle du Blueprint depuis le tableau de bord.

## Domaine personnalisé

1. Allez dans **Dashboard → your service → Settings → Custom Domains**
2. Ajoutez votre domaine
3. Configurez le DNS comme indiqué (CNAME vers `*.onrender.com`)
4. Render provisionne automatiquement un certificat TLS

## Mise à l’échelle

Render prend en charge la mise à l’échelle horizontale et verticale :

- **Verticale** : changez de plan pour obtenir plus de CPU/RAM
- **Horizontale** : augmentez le nombre d’instances (plan Standard et plus)

Pour OpenClaw, la mise à l’échelle verticale est généralement suffisante. La mise à l’échelle horizontale nécessite des sessions persistantes ou une gestion d’état externe.

## Sauvegardes et migration

Exportez votre état, votre configuration, vos profils d’authentification et votre espace de travail à tout moment en utilisant
l’accès shell dans le Render Dashboard :

```bash
openclaw backup create
```

Cela crée une archive de sauvegarde portable avec l’état d’OpenClaw ainsi que tout
espace de travail configuré. Voir [Backup](/fr/cli/backup) pour les détails.

## Dépannage

### Le service ne démarre pas

Vérifiez les journaux de déploiement dans le Render Dashboard. Problèmes courants :

- `OPENCLAW_GATEWAY_TOKEN` manquant — vérifiez qu’il est défini dans **Dashboard → Environment**
- Incompatibilité de port — assurez-vous que `OPENCLAW_GATEWAY_PORT=8080` est défini afin que le gateway se lie au port attendu par Render

### Démarrages à froid lents (niveau gratuit)

Les services du niveau gratuit se mettent en veille après 15 minutes d’inactivité. La première requête après la mise en veille prend quelques secondes pendant le démarrage du conteneur. Passez au plan Starter pour un service toujours actif.

### Perte de données après redéploiement

Cela arrive sur le niveau gratuit (pas de disque persistant). Passez à une offre payante, ou
exportez régulièrement une sauvegarde complète via `openclaw backup create` dans le shell Render.

### Échecs du health check

Render attend une réponse 200 de `/health` dans les 30 secondes. Si les builds réussissent mais que les déploiements échouent, le service met peut-être trop de temps à démarrer. Vérifiez :

- Les journaux de build pour détecter des erreurs
- Si le conteneur s’exécute localement avec `docker build && docker run`

## Étapes suivantes

- Configurez les canaux de messagerie : [Channels](/fr/channels)
- Configurez le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Gardez OpenClaw à jour : [Updating](/fr/install/updating)
