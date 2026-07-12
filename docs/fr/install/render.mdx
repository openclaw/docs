---
read_when:
    - Déployer OpenClaw sur Render
    - Vous souhaitez un déploiement cloud déclaratif avec Render Blueprints
summary: Déployer OpenClaw sur Render avec une infrastructure en tant que code
title: Afficher
x-i18n:
    generated_at: "2026-07-12T02:57:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Déployez OpenClaw sur [Render](https://render.com) à l’aide du Blueprint `render.yaml` du dépôt. Celui-ci déclare le service, le disque et les variables d’environnement dans un seul fichier.

## Prérequis

- Un [compte Render](https://render.com) (offre gratuite disponible)
- Une clé API de votre [fournisseur de modèles](/fr/providers) préféré

## Déploiement

[Déployer sur Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Cette opération crée un service Render à partir de `render.yaml`, génère l’image Docker et la déploie. L’URL de votre service suit le format `https://<service-name>.onrender.com`.

## Le Blueprint

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
        generateValue: true # génère automatiquement un jeton sécurisé
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Fonctionnalité         | Objectif                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| `runtime: docker`      | Génère l’image à partir du Dockerfile du dépôt                      |
| `healthCheckPath`      | Render surveille `/health` et redémarre les instances défaillantes |
| `generateValue: true`  | Génère automatiquement une valeur sécurisée par cryptographie      |
| `disk`                 | Stockage persistant qui subsiste après les redéploiements           |

## Choix d’une offre

| Offre     | Mise en veille              | Disque         | Usage recommandé                      |
| --------- | --------------------------- | -------------- | ------------------------------------- |
| Gratuite  | Après 15 min d’inactivité   | Non disponible | Tests, démonstrations                 |
| Starter   | Jamais                      | 1 Go ou plus   | Usage personnel, petites équipes      |
| Standard+ | Jamais                      | 1 Go ou plus   | Production, plusieurs canaux          |

Le Blueprint utilise `starter` par défaut. Pour utiliser l’offre gratuite, remplacez `plan: starter` par `plan: free` dans le fichier `render.yaml` de votre fork. Notez que sans disque persistant, l’état d’OpenClaw est réinitialisé à chaque déploiement.

## Après le déploiement

### Accéder à l’interface de contrôle

Le tableau de bord web est disponible à l’adresse `https://<your-service>.onrender.com/`. Connectez-vous avec le secret partagé : le `OPENCLAW_GATEWAY_TOKEN` généré automatiquement (vous le trouverez dans **Dashboard → your service → Environment**) ou votre mot de passe si vous avez opté pour l’authentification par mot de passe.

### Journaux

**Dashboard → your service → Logs** affiche les journaux de génération (création de l’image Docker), de déploiement (démarrage du service) et d’exécution (sortie de l’application).

### Accès au shell

**Dashboard → your service → Shell** ouvre une session shell. Le disque persistant est monté dans `/data`.

### Variables d’environnement

Modifiez les variables dans **Dashboard → your service → Environment**. Les modifications déclenchent automatiquement un nouveau déploiement.

### Déploiement automatique

Render redéploie automatiquement le service lorsqu’un nouveau commit est ajouté à la branche connectée du dépôt. Si vous avez effectué le déploiement directement depuis `openclaw/openclaw` plutôt que depuis votre propre fork, vous ne disposez pas d’un accès en écriture permettant de le déclencher. Pour effectuer une mise à jour, lancez manuellement une synchronisation du Blueprint depuis le Dashboard ou associez le service à votre propre fork.

## Domaine personnalisé

1. **Dashboard → your service → Settings → Custom Domains**
2. Ajoutez votre domaine
3. Configurez le DNS conformément aux instructions (CNAME vers `*.onrender.com`)
4. Render provisionne automatiquement un certificat TLS

## Mise à l’échelle

- **Verticale** : changez d’offre pour obtenir davantage de CPU et de RAM. Cela suffit généralement pour OpenClaw.
- **Horizontale** : augmentez le nombre d’instances (offre Standard ou supérieure). Cette configuration nécessite des sessions persistantes ou une gestion externe de l’état, car OpenClaw conserve son état d’exécution sur le disque local.

## Sauvegardes et migration

Depuis le shell du Dashboard Render, exportez à tout moment l’état, la configuration, les profils d’authentification et l’espace de travail :

```bash
openclaw backup create
```

Cette commande crée une archive de sauvegarde portable. Consultez la page [Sauvegarde](/fr/cli/backup).

## Résolution des problèmes

### Le service ne démarre pas

Consultez les journaux de déploiement dans le Dashboard Render. Problèmes courants :

- `OPENCLAW_GATEWAY_TOKEN` manquant — vérifiez qu’il est défini dans **Dashboard → Environment**
- Incompatibilité de port — assurez-vous que `OPENCLAW_GATEWAY_PORT=8080` afin que le Gateway se lie au port attendu par Render

### Démarrages à froid lents (offre gratuite)

Les services de l’offre gratuite sont mis en veille après 15 minutes d’inactivité. La première requête suivant la mise en veille prend quelques secondes, le temps que le conteneur démarre. Passez à l’offre Starter pour que le service reste toujours actif.

### Perte de données après un redéploiement

Cela se produit avec l’offre gratuite, qui ne fournit pas de disque persistant. Passez à une offre payante ou exportez régulièrement une sauvegarde depuis le shell Render avec `openclaw backup create`.

### Échec des vérifications d’intégrité

Si les générations réussissent, mais que les déploiements échouent, le service met peut-être trop de temps à démarrer ou `/health` n’est peut-être pas accessible. Vérifiez :

- Les journaux de génération à la recherche d’erreurs
- Que le conteneur s’exécute localement avec `docker build && docker run`

## Étapes suivantes

- Configurez les canaux de messagerie : [Canaux](/fr/channels)
- Configurez le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenez OpenClaw à jour : [Mise à jour](/fr/install/updating)
