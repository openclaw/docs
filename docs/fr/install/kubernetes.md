---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un cluster Kubernetes
    - Vous souhaitez tester OpenClaw dans un environnement Kubernetes
summary: Déployer OpenClaw Gateway sur un cluster Kubernetes avec Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T07:28:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Point de départ minimal pour exécuter OpenClaw sur Kubernetes — ce n’est pas un déploiement prêt pour la production. Il couvre les ressources de base et est destiné à être adapté à votre environnement.

## Pourquoi pas Helm ?

OpenClaw est un conteneur unique avec quelques fichiers de configuration. La personnalisation intéressante se trouve dans le contenu des agents (fichiers Markdown, Skills, substitutions de configuration), pas dans les modèles d’infrastructure. Kustomize gère les surcouches sans la surcharge d’un chart Helm. Si votre déploiement devient plus complexe, un chart Helm peut être ajouté par-dessus ces manifestes.

## Ce qu’il vous faut

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

Récupérez le secret partagé configuré pour l’UI de contrôle. Ce script de déploiement
crée une authentification par jeton par défaut :

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

Déployez ensuite normalement avec `./scripts/k8s/deploy.sh`.

## Étape par étape

### 1) Déployer

**Option A** — clé d’API dans l’environnement (une seule étape) :

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Le script crée un Secret Kubernetes avec la clé d’API et un jeton de Gateway généré automatiquement, puis déploie. Si le Secret existe déjà, il conserve le jeton de Gateway actuel et toutes les clés de fournisseurs qui ne sont pas modifiées.

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

### Instructions de l’agent

Modifiez le fichier `AGENTS.md` dans `scripts/k8s/manifests/configmap.yaml` et redéployez :

```bash
./scripts/k8s/deploy.sh
```

### Configuration du Gateway

Modifiez `openclaw.json` dans `scripts/k8s/manifests/configmap.yaml`. Consultez [Configuration du Gateway](/fr/gateway/configuration) pour la référence complète.

### Ajouter des fournisseurs

Relancez avec des clés supplémentaires exportées :

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Les clés de fournisseurs existantes restent dans le Secret sauf si vous les remplacez.

Ou appliquez directement un correctif au Secret :

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
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Exposer au-delà de port-forward

Les manifestes par défaut lient le Gateway à loopback à l’intérieur du pod. Cela fonctionne avec `kubectl port-forward`, mais pas avec un `Service` Kubernetes ni avec un chemin Ingress qui doit atteindre l’adresse IP du pod.

Si vous voulez exposer le Gateway via un Ingress ou un équilibreur de charge :

- Remplacez la liaison du Gateway dans `scripts/k8s/manifests/configmap.yaml`, de `loopback` vers une liaison non-loopback correspondant à votre modèle de déploiement
- Gardez l’authentification du Gateway activée et utilisez un point d’entrée approprié avec terminaison TLS
- Configurez l’UI de contrôle pour l’accès distant avec le modèle de sécurité web pris en charge (par exemple HTTPS/Tailscale Serve et des origines autorisées explicites si nécessaire)

## Redéployer

```bash
./scripts/k8s/deploy.sh
```

Cela applique tous les manifestes et redémarre le pod pour prendre en compte les changements de configuration ou de secrets.

## Suppression

```bash
./scripts/k8s/deploy.sh --delete
```

Cela supprime l’espace de noms et toutes les ressources qu’il contient, y compris le PVC.

## Notes d’architecture

- Le Gateway se lie à loopback à l’intérieur du pod par défaut ; la configuration incluse est donc destinée à `kubectl port-forward`
- Aucune ressource à portée cluster — tout se trouve dans un seul espace de noms
- Sécurité : `readOnlyRootFilesystem`, capacités `drop: ALL`, utilisateur non-root (UID 1000)
- La configuration par défaut garde l’UI de contrôle sur le chemin d’accès local le plus sûr : liaison loopback plus `kubectl port-forward` vers `http://127.0.0.1:18789`
- Si vous dépassez l’accès localhost, utilisez le modèle distant pris en charge : HTTPS/Tailscale plus la liaison de Gateway appropriée et les paramètres d’origine de l’UI de contrôle
- Les secrets sont générés dans un répertoire temporaire et appliqués directement au cluster — aucune donnée secrète n’est écrite dans le checkout du dépôt

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

## Articles connexes

- [Docker](/fr/install/docker)
- [Runtime de VM Docker](/fr/install/docker-vm-runtime)
- [Présentation de l’installation](/fr/install)
