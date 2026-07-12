---
read_when:
    - Você quer executar o OpenClaw em um cluster Kubernetes
    - Você quer testar o OpenClaw em um ambiente Kubernetes
summary: Implante o Gateway do OpenClaw em um cluster Kubernetes com o Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T15:18:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Um ponto de partida mínimo para executar o OpenClaw no Kubernetes, não uma implantação pronta para produção. Ele abrange os recursos essenciais e deve ser adaptado ao seu ambiente.

## Por que não usar Helm

O OpenClaw é um único contêiner com alguns arquivos de configuração. A personalização relevante está no conteúdo do agente (arquivos Markdown, Skills, substituições de configuração), não nos modelos de infraestrutura. O Kustomize gerencia sobreposições sem a sobrecarga de um chart Helm. Adicione um chart Helm sobre estes manifestos se sua implantação se tornar mais complexa.

## O que você precisa

- Um cluster Kubernetes em execução (AKS, EKS, GKE, k3s, kind, OpenShift etc.)
- `kubectl` conectado ao seu cluster
- Uma chave de API para pelo menos um provedor de modelos

## Início rápido

```bash
# Substitua pelo seu provedor: ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Por padrão, `deploy.sh` cria autenticação por token. Recupere o token gerado do Gateway para a interface de controle:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuração local, `./scripts/k8s/deploy.sh --show-token` exibe o token após a implantação.

## Testes locais com Kind

Se você não tiver um cluster, crie um localmente com o [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # detecta docker ou podman automaticamente
./scripts/k8s/create-kind.sh --delete  # remove o cluster
```

Em seguida, implante normalmente com `./scripts/k8s/deploy.sh`.

## Passo a passo

### 1) Implantar

**Opção A: chave de API no ambiente (uma etapa)**

```bash
# Substitua pelo seu provedor: ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

O script cria um Secret do Kubernetes com a chave de API e um token do Gateway gerado automaticamente e, em seguida, realiza a implantação. Se o Secret já existir, ele preservará o token atual do Gateway e todas as chaves de provedores que não estiverem sendo alteradas.

**Opção B: criar o Secret separadamente**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Adicione `--show-token` a qualquer um dos comandos para exibir o token em stdout para testes locais.

### 2) Acessar o Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## O que é implantado

```text
Namespace: openclaw (configurável por meio de OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod único, contêiner de inicialização + Gateway
├── Service/openclaw           # ClusterIP na porta 18789
├── PersistentVolumeClaim      # 10Gi para estado e configuração do agente
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token do Gateway + chaves de API
```

## Personalização

### Instruções do agente

Edite o `AGENTS.md` em `scripts/k8s/manifests/configmap.yaml` e implante novamente:

```bash
./scripts/k8s/deploy.sh
```

### Configuração do Gateway

Edite `openclaw.json` em `scripts/k8s/manifests/configmap.yaml`. Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) para obter a referência completa.

### Adicionar provedores

Execute novamente com chaves adicionais exportadas:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

As chaves de provedores existentes permanecerão no Secret, a menos que você as substitua.

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
image: ghcr.io/openclaw/openclaw:slim # principal; espelho oficial no Docker Hub: openclaw/openclaw
```

### Expor além do encaminhamento de porta

Os manifestos padrão vinculam o Gateway à interface de loopback dentro do pod. Isso funciona com `kubectl port-forward`, mas não com um `Service` do Kubernetes nem com um caminho de Ingress que precise acessar diretamente o IP do pod.

Para expor o Gateway por meio de um Ingress ou balanceador de carga:

- Altere o vínculo do Gateway em `scripts/k8s/manifests/configmap.yaml` de `loopback` para um vínculo que não seja de loopback e corresponda ao seu modelo de implantação.
- Mantenha a autenticação do Gateway habilitada e use um ponto de entrada adequado com terminação TLS.
- Configure a interface de controle para acesso remoto usando o modelo de segurança web compatível (por exemplo, HTTPS/Tailscale Serve e origens permitidas explícitas quando necessário).

## Reimplantar

```bash
./scripts/k8s/deploy.sh
```

Isso aplica todos os manifestos e reinicia o pod para carregar quaisquer alterações de configuração ou de segredos.

## Remoção

```bash
./scripts/k8s/deploy.sh --delete
```

Isso exclui o namespace e todos os recursos nele contidos, incluindo o PVC.

## Notas de arquitetura

- Por padrão, o Gateway é vinculado à interface de loopback dentro do pod, portanto, a configuração incluída destina-se ao uso com `kubectl port-forward`.
- Não há recursos com escopo de cluster; tudo fica em um único namespace.
- Reforço de segurança: `readOnlyRootFilesystem`, recursos `drop: ALL`, usuário não root (UID 1000).
- A configuração padrão mantém a interface de controle no caminho mais seguro de acesso local: vínculo de loopback mais `kubectl port-forward` para `http://127.0.0.1:18789`.
- Se você deixar de usar apenas o acesso por localhost, use o modelo remoto compatível: HTTPS/Tailscale mais o vínculo apropriado do Gateway e as configurações de origem da interface de controle.
- Os segredos são gerados em um diretório temporário e aplicados diretamente ao cluster; nenhum material secreto é gravado no checkout do repositório.

## Estrutura de arquivos

```text
scripts/k8s/
├── deploy.sh                   # Cria o namespace e o Secret; implanta por meio do Kustomize
├── create-kind.sh              # Cluster Kind local (detecta docker/podman automaticamente)
└── manifests/
    ├── kustomization.yaml      # Base do Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Especificação do pod com reforço de segurança
    ├── pvc.yaml                # 10Gi de armazenamento persistente
    └── service.yaml            # ClusterIP na porta 18789
```

## Relacionados

- [Docker](/pt-BR/install/docker)
- [Runtime de VM do Docker](/pt-BR/install/docker-vm-runtime)
- [Visão geral da instalação](/pt-BR/install)
