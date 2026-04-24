---
read_when:
    - Você quer executar o OpenClaw em um cluster Kubernetes
    - Você quer testar o OpenClaw em um ambiente Kubernetes
summary: Implantar o Gateway OpenClaw em um cluster Kubernetes com Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T05:58:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw no Kubernetes

Um ponto de partida mínimo para executar o OpenClaw no Kubernetes — não é uma implantação pronta para produção. Ele cobre os recursos principais e foi feito para ser adaptado ao seu ambiente.

## Por que não Helm?

O OpenClaw é um único container com alguns arquivos de configuração. A personalização interessante está no conteúdo do agente (arquivos markdown, Skills, substituições de configuração), não no template de infraestrutura. O Kustomize lida com overlays sem o overhead de um chart Helm. Se sua implantação ficar mais complexa, um chart Helm pode ser colocado por cima desses manifests.

## O que você precisa

- Um cluster Kubernetes em execução (AKS, EKS, GKE, k3s, kind, OpenShift etc.)
- `kubectl` conectado ao seu cluster
- Uma chave de API para pelo menos um provedor de modelo

## Início rápido

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Recupere o segredo compartilhado configurado para a UI de controle. Este script de deploy
cria autenticação por token por padrão:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuração local, `./scripts/k8s/deploy.sh --show-token` imprime o token após o deploy.

## Teste local com Kind

Se você não tiver um cluster, crie um localmente com [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Depois, faça o deploy normalmente com `./scripts/k8s/deploy.sh`.

## Passo a passo

### 1) Fazer o deploy

**Opção A** — chave de API no ambiente (uma etapa):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

O script cria um Secret do Kubernetes com a chave de API e um token de gateway gerado automaticamente, depois faz o deploy. Se o Secret já existir, ele preserva o token de gateway atual e quaisquer chaves de provedor que não estejam sendo alteradas.

**Opção B** — criar o secret separadamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Use `--show-token` com qualquer um dos comandos se quiser que o token seja impresso no stdout para testes locais.

### 2) Acessar o gateway

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

Edite o `AGENTS.md` em `scripts/k8s/manifests/configmap.yaml` e faça o deploy novamente:

```bash
./scripts/k8s/deploy.sh
```

### Configuração do Gateway

Edite `openclaw.json` em `scripts/k8s/manifests/configmap.yaml`. Consulte [Gateway configuration](/pt-BR/gateway/configuration) para a referência completa.

### Adicionar provedores

Execute novamente com chaves adicionais exportadas:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

As chaves de provedores existentes permanecem no Secret, a menos que você as sobrescreva.

Ou altere o Secret diretamente:

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

Os manifests padrão fazem bind do gateway em loopback dentro do pod. Isso funciona com `kubectl port-forward`, mas não funciona com um caminho de `Service` ou Ingress do Kubernetes que precise alcançar o IP do pod.

Se você quiser expor o gateway por um Ingress ou load balancer:

- Altere o bind do gateway em `scripts/k8s/manifests/configmap.yaml` de `loopback` para um bind não loopback que corresponda ao seu modelo de implantação
- Mantenha a autenticação do gateway ativada e use um ponto de entrada adequado com término TLS
- Configure a UI de controle para acesso remoto usando o modelo de segurança web compatível (por exemplo HTTPS/Tailscale Serve e origens permitidas explícitas quando necessário)

## Reimplantar

```bash
./scripts/k8s/deploy.sh
```

Isso aplica todos os manifests e reinicia o pod para captar quaisquer alterações de configuração ou secret.

## Desmontar

```bash
./scripts/k8s/deploy.sh --delete
```

Isso exclui o namespace e todos os recursos dentro dele, incluindo o PVC.

## Observações de arquitetura

- O gateway faz bind em loopback dentro do pod por padrão, então a configuração incluída serve para `kubectl port-forward`
- Nenhum recurso com escopo de cluster — tudo fica em um único namespace
- Segurança: `readOnlyRootFilesystem`, capabilities `drop: ALL`, usuário não root (UID 1000)
- A configuração padrão mantém a UI de controle no caminho mais seguro de acesso local: bind em loopback mais `kubectl port-forward` para `http://127.0.0.1:18789`
- Se você sair do acesso localhost, use o modelo remoto compatível: HTTPS/Tailscale mais o bind apropriado do gateway e as configurações de origem da UI de controle
- Secrets são gerados em um diretório temporário e aplicados diretamente ao cluster — nenhum material secreto é gravado no checkout do repositório

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
- [Docker VM runtime](/pt-BR/install/docker-vm-runtime)
- [Visão geral de instalação](/pt-BR/install)
