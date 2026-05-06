---
read_when:
    - Você quer executar o OpenClaw em um cluster Kubernetes
    - Você quer testar o OpenClaw em um ambiente Kubernetes
summary: Implante o OpenClaw Gateway em um cluster Kubernetes com Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T06:00:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
---

Um ponto de partida mínimo para executar o OpenClaw no Kubernetes — não é uma implantação pronta para produção. Ele cobre os recursos principais e deve ser adaptado ao seu ambiente.

## Por que não Helm?

O OpenClaw é um único contêiner com alguns arquivos de configuração. A personalização interessante está no conteúdo do agente (arquivos markdown, skills, substituições de configuração), não em templates de infraestrutura. O Kustomize gerencia sobreposições sem a sobrecarga de um chart Helm. Se a sua implantação ficar mais complexa, um chart Helm pode ser colocado sobre estes manifests.

## O que você precisa

- Um cluster Kubernetes em execução (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` conectado ao seu cluster
- Uma chave de API para pelo menos um provedor de modelos

## Início rápido

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Recupere o segredo compartilhado configurado para a Control UI. Este script de implantação
cria autenticação por token por padrão:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuração local, `./scripts/k8s/deploy.sh --show-token` imprime o token após a implantação.

## Testes locais com Kind

Se você não tiver um cluster, crie um localmente com [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Depois implante normalmente com `./scripts/k8s/deploy.sh`.

## Passo a passo

### 1) Implantar

**Opção A** — chave de API no ambiente (uma etapa):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

O script cria um Kubernetes Secret com a chave de API e um token de Gateway gerado automaticamente, depois implanta. Se o Secret já existir, ele preserva o token de Gateway atual e quaisquer chaves de provedor que não estejam sendo alteradas.

**Opção B** — criar o segredo separadamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Use `--show-token` com qualquer comando se quiser que o token seja impresso em stdout para testes locais.

### 2) Acessar o Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## O que é implantado

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Personalização

### Instruções do agente

Edite o `AGENTS.md` em `scripts/k8s/manifests/configmap.yaml` e implante novamente:

```bash
./scripts/k8s/deploy.sh
```

### Configuração do Gateway

Edite `openclaw.json` em `scripts/k8s/manifests/configmap.yaml`. Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para a referência completa.

### Adicionar provedores

Execute novamente com chaves adicionais exportadas:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

As chaves de provedor existentes permanecem no Secret, a menos que você as sobrescreva.

Ou aplique um patch diretamente ao Secret:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace personalizado

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Imagem personalizada

Edite o campo `image` em `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Expor além de port-forward

Os manifests padrão vinculam o Gateway ao loopback dentro do pod. Isso funciona com `kubectl port-forward`, mas não funciona com um `Service` do Kubernetes ou caminho de Ingress que precise alcançar o IP do pod.

Se você quiser expor o Gateway por meio de um Ingress ou balanceador de carga:

- Altere o bind do Gateway em `scripts/k8s/manifests/configmap.yaml` de `loopback` para um bind que não seja loopback e corresponda ao seu modelo de implantação
- Mantenha a autenticação do Gateway ativada e use um ponto de entrada apropriado com terminação TLS
- Configure a Control UI para acesso remoto usando o modelo de segurança web compatível (por exemplo, HTTPS/Tailscale Serve e origens permitidas explícitas quando necessário)

## Reimplantar

```bash
./scripts/k8s/deploy.sh
```

Isso aplica todos os manifests e reinicia o pod para captar quaisquer alterações de configuração ou segredo.

## Remoção

```bash
./scripts/k8s/deploy.sh --delete
```

Isso exclui o namespace e todos os recursos nele, incluindo o PVC.

## Observações de arquitetura

- O Gateway se vincula ao loopback dentro do pod por padrão, então a configuração incluída é para `kubectl port-forward`
- Nenhum recurso com escopo de cluster — tudo fica em um único namespace
- Segurança: `readOnlyRootFilesystem`, capacidades `drop: ALL`, usuário não root (UID 1000)
- A configuração padrão mantém a Control UI no caminho de acesso local mais seguro: bind de loopback mais `kubectl port-forward` para `http://127.0.0.1:18789`
- Se você for além do acesso por localhost, use o modelo remoto compatível: HTTPS/Tailscale mais o bind de Gateway apropriado e as configurações de origem da Control UI
- Segredos são gerados em um diretório temporário e aplicados diretamente ao cluster — nenhum material secreto é escrito no checkout do repo

## Estrutura de arquivos

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

## Relacionado

- [Docker](/pt-BR/install/docker)
- [Runtime de VM Docker](/pt-BR/install/docker-vm-runtime)
- [Visão geral da instalação](/pt-BR/install)
