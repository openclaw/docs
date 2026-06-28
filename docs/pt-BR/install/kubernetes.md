---
read_when:
    - Você quer executar o OpenClaw em um cluster Kubernetes
    - Você quer testar o OpenClaw em um ambiente Kubernetes
summary: Implante o OpenClaw Gateway em um cluster Kubernetes com Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

Um ponto de partida mínimo para executar o OpenClaw no Kubernetes — não uma implantação pronta para produção. Ele cobre os recursos principais e deve ser adaptado ao seu ambiente.

## Por que não Helm?

O OpenClaw é um único contêiner com alguns arquivos de configuração. A personalização mais relevante está no conteúdo dos agentes (arquivos markdown, Skills, substituições de configuração), não na modelagem de infraestrutura. O Kustomize lida com sobreposições sem a sobrecarga de um chart Helm. Se sua implantação ficar mais complexa, um chart Helm pode ser aplicado sobre estes manifests.

## O que você precisa

- Um cluster Kubernetes em execução (AKS, EKS, GKE, k3s, kind, OpenShift etc.)
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

## Teste local com Kind

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

O script cria um Secret do Kubernetes com a chave de API e um token de Gateway gerado automaticamente, e então implanta. Se o Secret já existir, ele preserva o token de Gateway atual e quaisquer chaves de provedor que não estejam sendo alteradas.

**Opção B** — criar o segredo separadamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Use `--show-token` com qualquer comando se quiser que o token seja impresso em stdout para teste local.

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

Edite o `AGENTS.md` em `scripts/k8s/manifests/configmap.yaml` e reimplante:

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

Ou aplique um patch diretamente no Secret:

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
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### Expor além do port-forward

Os manifests padrão vinculam o Gateway ao loopback dentro do pod. Isso funciona com `kubectl port-forward`, mas não funciona com um `Service` do Kubernetes ou um caminho de Ingress que precise alcançar o IP do pod.

Se você quiser expor o Gateway por meio de um Ingress ou balanceador de carga:

- Altere o bind do Gateway em `scripts/k8s/manifests/configmap.yaml` de `loopback` para um bind não loopback que corresponda ao seu modelo de implantação
- Mantenha a autenticação do Gateway habilitada e use um ponto de entrada adequado com TLS encerrado
- Configure a Control UI para acesso remoto usando o modelo de segurança web compatível (por exemplo, HTTPS/Tailscale Serve e origens explicitamente permitidas quando necessário)

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

- O Gateway se vincula ao loopback dentro do pod por padrão, portanto a configuração incluída é para `kubectl port-forward`
- Nenhum recurso com escopo de cluster — tudo fica em um único namespace
- Segurança: recursos `readOnlyRootFilesystem`, `drop: ALL`, usuário não root (UID 1000)
- A configuração padrão mantém a Control UI no caminho mais seguro de acesso local: bind de loopback mais `kubectl port-forward` para `http://127.0.0.1:18789`
- Se você for além do acesso por localhost, use o modelo remoto compatível: HTTPS/Tailscale mais o bind de Gateway apropriado e as configurações de origem da Control UI
- Os segredos são gerados em um diretório temporário e aplicados diretamente ao cluster — nenhum material secreto é gravado no checkout do repositório

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
