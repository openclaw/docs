---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un cluster Kubernetes
    - Vous souhaitez tester OpenClaw dans un environnement Kubernetes
summary: Déployer OpenClaw Gateway sur un cluster Kubernetes avec Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Un point de départ minimal pour exécuter OpenClaw sur Kubernetes — pas un déploiement prêt pour la production. Il couvre les ressources de base et doit être adapté à votre environnement.

## Pourquoi pas Helm ?

OpenClaw est un conteneur unique avec quelques fichiers de configuration. La personnalisation intéressante se trouve dans le contenu des agents (fichiers Markdown, Skills, substitutions de configuration), pas dans les modèles d’infrastructure. Kustomize gère les overlays sans la surcharge d’un chart Helm. Si votre déploiement devient plus complexe, un chart Helm peut être ajouté au-dessus de ces manifestes.

## Ce dont vous avez besoin

- Un cluster Kubernetes en cours d’exécution (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` connecté à votre cluster
- Une clé d’API pour au moins un fournisseur de modèles

## Démarrage rapide

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Récupérez le secret partagé configuré pour la Control UI. Ce script de déploiement
crée l’authentification par jeton par défaut :

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Pour le débogage local, `./scripts/k8s/deploy.sh --show-token` affiche le jeton après le déploiement.

## Tests locaux avec Kind

Si vous n’avez pas de cluster, créez-en un localement avec [Kind](https://kind.sigs.k8s.io/) :

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Déployez ensuite comme d’habitude avec `./scripts/k8s/deploy.sh`.

## Étape par étape

### 1) Déployer

**Option A** — clé d’API dans l’environnement (une seule étape) :

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Le script crée un Secret Kubernetes avec la clé d’API et un jeton Gateway généré automatiquement, puis déploie. Si le Secret existe déjà, il conserve le jeton Gateway actuel et toutes les clés de fournisseur qui ne sont pas modifiées.

**Option B** — créer le secret séparément :

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Utilisez `--show-token` avec l’une ou l’autre commande si vous voulez afficher le jeton sur stdout pour les tests locaux.

### 2) Accéder au Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Ce qui est déployé

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Personnalisation

### Instructions d’agent

Modifiez le fichier `AGENTS.md` dans `scripts/k8s/manifests/configmap.yaml` et redéployez :

```bash
./scripts/k8s/deploy.sh
```

### Configuration du Gateway

Modifiez `openclaw.json` dans `scripts/k8s/manifests/configmap.yaml`. Consultez [Configuration du Gateway](/fr/gateway/configuration) pour la référence complète.

### Ajouter des fournisseurs

Réexécutez avec des clés supplémentaires exportées :

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Les clés de fournisseur existantes restent dans le Secret sauf si vous les remplacez.

Ou appliquez un patch directement au Secret :

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Espace de noms personnalisé

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Image personnalisée

Modifiez le champ `image` dans `scripts/k8s/manifests/deployment.yaml` :

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Exposer au-delà de port-forward

Les manifestes par défaut lient le Gateway au loopback à l’intérieur du pod. Cela fonctionne avec `kubectl port-forward`, mais pas avec un `Service` Kubernetes ou un chemin Ingress qui doit atteindre l’IP du pod.

Si vous voulez exposer le Gateway via un Ingress ou un équilibreur de charge :

- Remplacez le bind du Gateway dans `scripts/k8s/manifests/configmap.yaml`, de `loopback` vers un bind non-loopback qui correspond à votre modèle de déploiement
- Gardez l’authentification Gateway activée et utilisez un point d’entrée approprié avec terminaison TLS
- Configurez la Control UI pour l’accès distant au moyen du modèle de sécurité web pris en charge (par exemple HTTPS/Tailscale Serve et des origines explicitement autorisées si nécessaire)

## Redéployer

```bash
./scripts/k8s/deploy.sh
```

Cela applique tous les manifestes et redémarre le pod pour prendre en compte toute modification de configuration ou de secret.

## Suppression

```bash
./scripts/k8s/deploy.sh --delete
```

Cela supprime l’espace de noms et toutes les ressources qu’il contient, y compris le PVC.

## Notes d’architecture

- Le Gateway se lie au loopback à l’intérieur du pod par défaut, donc la configuration incluse est destinée à `kubectl port-forward`
- Aucune ressource à portée cluster — tout se trouve dans un seul espace de noms
- Sécurité : capacités `readOnlyRootFilesystem`, `drop: ALL`, utilisateur non-root (UID 1000)
- La configuration par défaut maintient la Control UI sur le chemin d’accès local plus sûr : bind loopback plus `kubectl port-forward` vers `http://127.0.0.1:18789`
- Si vous allez au-delà de l’accès localhost, utilisez le modèle distant pris en charge : HTTPS/Tailscale plus le bind Gateway approprié et les paramètres d’origine de la Control UI
- Les secrets sont générés dans un répertoire temporaire et appliqués directement au cluster — aucun élément secret n’est écrit dans le checkout du dépôt

## Structure des fichiers

```
scripts/k8s/
├── deploy.sh                   # Creates namespace + secret, deploys via kustomize
├── create-kind.sh              # Local Kind cluster (auto-detects docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec with security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP on 18789
```

## Connexe

- [Docker](/fr/install/docker)
- [Runtime Docker VM](/fr/install/docker-vm-runtime)
- [Vue d’ensemble de l’installation](/fr/install)
