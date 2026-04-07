---
read_when:
    - Você quer usar modelos Anthropic no OpenClaw
summary: Use o Anthropic Claude por chaves de API ou Claude CLI no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-07T05:30:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 423928fd36c66729985208d4d3f53aff1f94f63b908df85072988bdc41d5cf46
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

A Anthropic desenvolve a família de modelos **Claude** e fornece acesso por API e
Claude CLI. No OpenClaw, há suporte tanto para chaves de API da Anthropic quanto para
reutilização do Claude CLI. Perfis legados existentes de token Anthropic ainda são respeitados em
runtime se já estiverem configurados.

<Warning>
A equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então
o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como permitidos para
esta integração, a menos que a Anthropic publique uma nova política.

Para hosts de gateway de longa duração, as chaves de API da Anthropic ainda são o caminho de produção
mais claro e previsível. Se você já usa o Claude CLI no host,
o OpenClaw pode reutilizar esse login diretamente.

A documentação pública atual da Anthropic:

- [Referência da Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Visão geral do Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Usando o Claude Code com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Usando o Claude Code com seu plano Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Se você quiser o caminho de faturamento mais claro, use uma chave de API da Anthropic.
O OpenClaw também oferece suporte a outras opções no estilo assinatura, incluindo [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding Plan](/pt-BR/providers/qwen),
[MiniMax Coding Plan](/pt-BR/providers/minimax) e [Z.AI / GLM Coding
Plan](/pt-BR/providers/glm).
</Warning>

## Opção A: chave de API da Anthropic

**Ideal para:** acesso padrão à API e faturamento por uso.
Crie sua chave de API no Anthropic Console.

### Configuração pela CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Snippet de configuração da Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Padrões de thinking (Claude 4.6)

- Os modelos Anthropic Claude 4.6 usam `adaptive` thinking por padrão no OpenClaw quando nenhum nível explícito de thinking é definido.
- Você pode substituir por mensagem (`/think:<level>`) ou em params do modelo:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentação relacionada da Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modo rápido (API Anthropic)

O toggle compartilhado `/fast` do OpenClaw também oferece suporte a tráfego público direto da Anthropic, incluindo solicitações autenticadas por chave de API e OAuth enviadas para `api.anthropic.com`.

- `/fast on` mapeia para `service_tier: "auto"`
- `/fast off` mapeia para `service_tier: "standard_only"`
- Padrão de configuração:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Limites importantes:

- O OpenClaw só injeta service tiers da Anthropic para solicitações diretas a `api.anthropic.com`. Se você rotear `anthropic/*` por um proxy ou gateway, `/fast` deixa `service_tier` inalterado.
- Params explícitos de modelo Anthropic `serviceTier` ou `service_tier` substituem o padrão de `/fast` quando ambos estão definidos.
- A Anthropic informa o tier efetivo na resposta em `usage.service_tier`. Em contas sem capacidade de Priority Tier, `service_tier: "auto"` ainda pode resultar em `standard`.

## Cache de prompt (API Anthropic)

O OpenClaw oferece suporte ao recurso de cache de prompt da Anthropic. Isso é **somente API**; a autenticação legada por token Anthropic não respeita configurações de cache.

### Configuração

Use o parâmetro `cacheRetention` na configuração do seu modelo:

| Value   | Cache Duration | Description              |
| ------- | -------------- | ------------------------ |
| `none`  | No caching     | Disable prompt caching   |
| `short` | 5 minutes      | Default for API Key auth |
| `long`  | 1 hour         | Extended cache           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Padrões

Ao usar autenticação por chave de API da Anthropic, o OpenClaw aplica automaticamente `cacheRetention: "short"` (cache de 5 minutos) para todos os modelos Anthropic. Você pode substituir isso definindo explicitamente `cacheRetention` na sua configuração.

### Substituições de cacheRetention por agente

Use params em nível de modelo como linha de base e depois substitua agentes específicos por `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

Ordem de mesclagem da configuração para params relacionados a cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (correspondente ao `id`, substitui por chave)

Isso permite que um agente mantenha um cache de longa duração, enquanto outro agente no mesmo modelo desativa o cache para evitar custos de gravação em tráfego em rajada/com baixo reuso.

### Observações sobre Claude no Bedrock

- Modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam pass-through de `cacheRetention` quando configurado.
- Modelos Bedrock que não são Anthropic são forçados a `cacheRetention: "none"` em runtime.
- Os padrões inteligentes de chave de API Anthropic também inicializam `cacheRetention: "short"` para referências de modelo Claude-on-Bedrock quando nenhum valor explícito é definido.

## Janela de contexto de 1M (beta Anthropic)

A janela de contexto de 1M da Anthropic é controlada por beta. No OpenClaw, ative por modelo
com `params.context1m: true` para modelos Opus/Sonnet compatíveis.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

O OpenClaw mapeia isso para `anthropic-beta: context-1m-2025-08-07` em solicitações
da Anthropic.

Isso só é ativado quando `params.context1m` está explicitamente definido como `true` para
aquele modelo.

Requisito: a Anthropic precisa permitir uso de contexto longo nessa credencial.

Observação: atualmente a Anthropic rejeita solicitações beta `context-1m-*` ao usar
autenticação legada por token Anthropic (`sk-ant-oat-*`). Se você configurar
`context1m: true` com esse modo de autenticação legado, o OpenClaw registra um aviso e
volta para a janela de contexto padrão ignorando o cabeçalho beta de context1m,
enquanto mantém os betas OAuth obrigatórios.

## Backend Claude CLI

O backend empacotado `claude-cli` da Anthropic é compatível com o OpenClaw.

- A equipe da Anthropic nos informou que esse uso voltou a ser permitido.
- Portanto, o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como
  permitidos para esta integração, a menos que a Anthropic publique uma nova política.
- As chaves de API da Anthropic continuam sendo o caminho de produção mais claro para hosts de
  gateway sempre ativos e controle explícito de faturamento no lado do servidor.
- Os detalhes de configuração e runtime estão em [/gateway/cli-backends](/pt-BR/gateway/cli-backends).

## Observações

- A documentação pública do Claude Code da Anthropic ainda documenta o uso direto da CLI, como
  `claude -p`, e a equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser
  permitido. Estamos tratando essa orientação como definitiva, a menos que a Anthropic
  publique uma nova mudança de política.
- O setup-token da Anthropic continua disponível no OpenClaw como um caminho compatível de autenticação por token, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.
- Os detalhes de auth + regras de reutilização estão em [/concepts/oauth](/pt-BR/concepts/oauth).

## Solução de problemas

**Erros 401 / token repentinamente inválido**

- A autenticação por token Anthropic pode expirar ou ser revogada.
- Para novas configurações, migre para uma chave de API da Anthropic.

**Nenhuma chave de API encontrada para o provedor "anthropic"**

- A auth é **por agente**. Novos agentes não herdam as chaves do agente principal.
- Execute novamente o onboarding para esse agente, ou configure uma chave de API no host
  do gateway, e então verifique com `openclaw models status`.

**Nenhuma credencial encontrada para o perfil `anthropic:default`**

- Execute `openclaw models status` para ver qual perfil de auth está ativo.
- Execute o onboarding novamente ou configure uma chave de API para esse caminho de perfil.

**Nenhum perfil de auth disponível (todos em cooldown/indisponíveis)**

- Verifique `openclaw models status --json` para `auth.unusableProfiles`.
- Cooldowns de limite de taxa da Anthropic podem ter escopo por modelo, então um modelo Anthropic
  irmão ainda pode ser utilizável mesmo quando o atual está em cooldown.
- Adicione outro perfil Anthropic ou aguarde o cooldown.

Mais: [/gateway/troubleshooting](/pt-BR/gateway/troubleshooting) e [/help/faq](/pt-BR/help/faq).
