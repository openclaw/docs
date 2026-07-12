---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un cluster Kubernetes
    - Vous souhaitez tester OpenClaw dans un environnement Kubernetes
summary: Déployer le Gateway OpenClaw sur un cluster Kubernetes avec Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T15:26:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Un point de départ minimal pour exécuter OpenClaw sur Kubernetes, et non un déploiement prêt pour la production. Il couvre les ressources essentielles et doit être adapté à votre environnement.

## Pourquoi ne pas utiliser Helm

OpenClaw consiste en un seul conteneur accompagné de quelques fichiers de configuration. Les personnalisations intéressantes concernent le contenu des agents (fichiers Markdown, Skills, substitutions de configuration), et non la création de modèles d’infrastructure. Kustomize gère les superpositions sans la surcharge d’un chart Helm. Ajoutez un chart Helm par-dessus ces manifestes si votre déploiement devient plus complexe.

## Prérequis

- Un cluster Kubernetes opérationnel (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` connecté à votre cluster
- Une clé d’API pour au moins un fournisseur de modèles

## Démarrage rapide

```bash
# Remplacez par votre fournisseur : ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` crée par défaut une authentification par jeton. Récupérez le jeton généré du Gateway pour l’interface de contrôle :

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Pour le débogage local, `./scripts/k8s/deploy.sh --show-token` affiche le jeton après le déploiement.

## Test local avec Kind

Si vous ne disposez pas d’un cluster, créez-en un localement avec [Kind](https://kind.sigs.k8s.io/) :

```bash
./scripts/k8s/create-kind.sh           # détecte automatiquement docker ou podman
./scripts/k8s/create-kind.sh --delete  # supprime le cluster
```

Déployez ensuite comme d’habitude avec `./scripts/k8s/deploy.sh`.

## Procédure détaillée

### 1) Déployer

**Option A : clé d’API dans l’environnement (une étape)**

```bash
# Remplacez par votre fournisseur : ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Le script crée un Secret Kubernetes contenant la clé d’API et un jeton de Gateway généré automatiquement, puis effectue le déploiement. Si le Secret existe déjà, il conserve le jeton de Gateway actuel ainsi que toutes les clés de fournisseurs qui ne sont pas modifiées.

**Option B : créer le secret séparément**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Ajoutez `--show-token` à l’une ou l’autre commande pour afficher le jeton dans la sortie standard lors des tests locaux.

### 2) Accéder au Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Ressources déployées

```text
Espace de noms : openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod unique, conteneur d’initialisation + Gateway
├── Service/openclaw           # ClusterIP sur le port 18789
├── PersistentVolumeClaim      # 10Gi pour l’état et la configuration de l’agent
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Jeton du Gateway + clés d’API
```

## Personnalisation

### Instructions de l’agent

Modifiez le fichier `AGENTS.md` dans `scripts/k8s/manifests/configmap.yaml`, puis redéployez :

```bash
./scripts/k8s/deploy.sh
```

### Configuration du Gateway

Modifiez `openclaw.json` dans `scripts/k8s/manifests/configmap.yaml`. Consultez la [configuration du Gateway](/fr/gateway/configuration) pour obtenir la référence complète.

### Ajouter des fournisseurs

Relancez le déploiement après avoir exporté les clés supplémentaires :

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Les clés de fournisseurs existantes restent dans le Secret, sauf si vous les remplacez.

Vous pouvez également modifier directement le Secret :

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
image: ghcr.io/openclaw/openclaw:slim # principale ; miroir Docker Hub officiel : openclaw/openclaw
```

### Exposer le service au-delà de la redirection de port

Par défaut, les manifestes associent le Gateway à l’interface de bouclage à l’intérieur du pod. Cette configuration fonctionne avec `kubectl port-forward`, mais pas avec un `Service` Kubernetes ni avec un chemin Ingress devant accéder directement à l’adresse IP du pod.

Pour exposer le Gateway par l’intermédiaire d’un Ingress ou d’un équilibreur de charge :

- Dans `scripts/k8s/manifests/configmap.yaml`, remplacez l’association du Gateway `loopback` par une association hors bouclage correspondant à votre modèle de déploiement.
- Maintenez l’authentification du Gateway activée et utilisez un point d’entrée approprié avec terminaison TLS.
- Configurez l’interface de contrôle pour l’accès à distance en utilisant le modèle de sécurité web pris en charge (par exemple HTTPS/Tailscale Serve et des origines autorisées explicites lorsque nécessaire).

## Redéployer

```bash
./scripts/k8s/deploy.sh
```

Cette commande applique tous les manifestes et redémarre le pod afin de prendre en compte toutes les modifications apportées à la configuration ou aux secrets.

## Suppression

```bash
./scripts/k8s/deploy.sh --delete
```

Cette commande supprime l’espace de noms et toutes les ressources qu’il contient, y compris le PVC.

## Notes d’architecture

- Par défaut, le Gateway est associé à l’interface de bouclage à l’intérieur du pod ; la configuration fournie est donc destinée à `kubectl port-forward`.
- Aucune ressource à l’échelle du cluster ; tout se trouve dans un seul espace de noms.
- Renforcement de la sécurité : `readOnlyRootFilesystem`, capacités `drop: ALL`, utilisateur non-root (UID 1000).
- La configuration par défaut maintient l’interface de contrôle sur le chemin d’accès local plus sûr : association à l’interface de bouclage et `kubectl port-forward` vers `http://127.0.0.1:18789`.
- Si vous étendez l’accès au-delà de localhost, utilisez le modèle distant pris en charge : HTTPS/Tailscale, ainsi que les paramètres appropriés d’association du Gateway et d’origine de l’interface de contrôle.
- Les secrets sont générés dans un répertoire temporaire et appliqués directement au cluster ; aucune donnée secrète n’est écrite dans la copie de travail du dépôt.

## Structure des fichiers

```text
scripts/k8s/
├── deploy.sh                   # Crée l’espace de noms et le secret, puis déploie via kustomize
├── create-kind.sh              # Cluster Kind local (détecte automatiquement docker/podman)
└── manifests/
    ├── kustomization.yaml      # Base Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Spécification du pod avec renforcement de la sécurité
    ├── pvc.yaml                # Stockage persistant de 10Gi
    └── service.yaml            # ClusterIP sur 18789
```

## Ressources connexes

- [Docker](/fr/install/docker)
- [Environnement d’exécution de VM Docker](/fr/install/docker-vm-runtime)
- [Vue d’ensemble de l’installation](/fr/install)
