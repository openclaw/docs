---
read_when:
    - Você quer usar modelos Anthropic no OpenClaw
summary: Use Claude da Anthropic por meio de chaves de API no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-06T03:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc6c4938674aedf20ff944bc04e742c9a7e77a5ff10ae4f95b5718504c57c2d
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

A Anthropic desenvolve a família de modelos **Claude** e fornece acesso por meio de uma API.
No OpenClaw, novas configurações da Anthropic devem usar uma chave de API. Perfis legados
existentes de token Anthropic ainda são respeitados em runtime se já estiverem
configurados.

<Warning>
Para Anthropic no OpenClaw, a divisão de cobrança é:

- **Chave de API Anthropic**: cobrança normal da API Anthropic.
- **Autenticação de assinatura Claude dentro do OpenClaw**: a Anthropic informou aos usuários do OpenClaw em
  **4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que isso conta como
  uso de harness de terceiros e exige **Extra Usage** (pay-as-you-go,
  cobrado separadamente da assinatura).

Nossas reproduções locais correspondem a essa divisão:

- `claude -p` direto ainda pode funcionar
- `claude -p --append-system-prompt ...` pode acionar a proteção de Extra Usage quando
  o prompt identifica o OpenClaw
- o mesmo prompt de sistema semelhante ao do OpenClaw **não** reproduz o bloqueio no
  caminho Anthropic SDK + `ANTHROPIC_API_KEY`

Portanto, a regra prática é: **chave de API Anthropic, ou assinatura Claude com
Extra Usage**. Se você quiser o caminho de produção mais claro, use uma chave de API Anthropic.

A documentação pública atual da Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Se você quiser o caminho de cobrança mais claro, use uma chave de API Anthropic.
O OpenClaw também oferece suporte a outras opções no estilo assinatura, incluindo [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding Plan](/pt-BR/providers/qwen),
[MiniMax Coding Plan](/pt-BR/providers/minimax) e [Z.AI / GLM Coding
Plan](/pt-BR/providers/glm).
</Warning>

## Opção A: chave de API Anthropic

**Ideal para:** acesso padrão à API e cobrança baseada em uso.
Crie sua chave de API no Anthropic Console.

### Configuração da CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Snippet de configuração Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Padrões de thinking (Claude 4.6)

- Os modelos Anthropic Claude 4.6 usam `adaptive` thinking por padrão no OpenClaw quando nenhum nível explícito de thinking é definido.
- Você pode sobrescrever por mensagem (`/think:<level>`) ou em parâmetros do modelo:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentação Anthropic relacionada:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modo rápido (API Anthropic)

A opção compartilhada `/fast` do OpenClaw também oferece suporte a tráfego Anthropic público direto, incluindo solicitações autenticadas por chave de API e OAuth enviadas para `api.anthropic.com`.

- `/fast on` mapeia para `service_tier: "auto"`
- `/fast off` mapeia para `service_tier: "standard_only"`
- Configuração padrão:

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

- O OpenClaw só injeta níveis de serviço Anthropic para solicitações diretas a `api.anthropic.com`. Se você rotear `anthropic/*` por um proxy ou gateway, `/fast` deixará `service_tier` inalterado.
- Parâmetros explícitos do modelo Anthropic `serviceTier` ou `service_tier` sobrescrevem o padrão de `/fast` quando ambos estão definidos.
- A Anthropic informa o nível efetivo na resposta em `usage.service_tier`. Em contas sem capacidade de Priority Tier, `service_tier: "auto"` ainda pode resultar em `standard`.

## Cache de prompt (API Anthropic)

O OpenClaw oferece suporte ao recurso de cache de prompt da Anthropic. Isso é **somente API**; autenticação legada por token Anthropic não respeita configurações de cache.

### Configuração

Use o parâmetro `cacheRetention` na configuração do seu modelo:

| Value   | Cache Duration | Description              |
| ------- | -------------- | ------------------------ |
| `none`  | No caching     | Desativar cache de prompt   |
| `short` | 5 minutes      | Padrão para autenticação por chave de API |
| `long`  | 1 hour         | Cache estendido           |

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

Ao usar autenticação por chave de API Anthropic, o OpenClaw aplica automaticamente `cacheRetention: "short"` (cache de 5 minutos) para todos os modelos Anthropic. Você pode sobrescrever isso definindo explicitamente `cacheRetention` na sua configuração.

### Sobrescritas de `cacheRetention` por agente

Use parâmetros no nível do modelo como base e depois sobrescreva agentes específicos por meio de `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // linha de base para a maioria dos agentes
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // sobrescrita apenas para este agente
    ],
  },
}
```

Ordem de merge da configuração para parâmetros relacionados a cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (correspondência por `id`, sobrescreve por chave)

Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desativa o cache para evitar custos de gravação em tráfego com picos e baixo reúso.

### Observações sobre Claude no Bedrock

- Modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam pass-through de `cacheRetention` quando configurado.
- Modelos Bedrock não Anthropic são forçados a `cacheRetention: "none"` em runtime.
- Os padrões inteligentes de chave de API Anthropic também inicializam `cacheRetention: "short"` para referências de modelo Claude-on-Bedrock quando nenhum valor explícito está definido.

## Janela de contexto de 1M (beta Anthropic)

A janela de contexto de 1M da Anthropic é protegida por beta. No OpenClaw, ative-a por modelo
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
Anthropic.

Isso só é ativado quando `params.context1m` é explicitamente definido como `true` para
esse modelo.

Requisito: a Anthropic precisa permitir uso de contexto longo nessa credencial
(normalmente cobrança por chave de API ou o caminho Claude-login / autenticação legada por token do OpenClaw
com Extra Usage ativado). Caso contrário, a Anthropic retorna:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Observação: a Anthropic atualmente rejeita solicitações beta `context-1m-*` ao usar
autenticação legada por token Anthropic (`sk-ant-oat-*`). Se você configurar
`context1m: true` com esse modo legado de autenticação, o OpenClaw registrará um aviso e
fará fallback para a janela de contexto padrão, ignorando o cabeçalho beta de context1m
enquanto mantém os betas OAuth necessários.

## Removido: backend Claude CLI

O backend agrupado `claude-cli` da Anthropic foi removido.

- O aviso da Anthropic de 4 de abril de 2026 diz que o tráfego Claude-login acionado pelo OpenClaw é
  uso de harness de terceiros e exige **Extra Usage**.
- Nossas reproduções locais também mostram que
  `claude -p --append-system-prompt ...` direto pode atingir a mesma proteção quando o
  prompt anexado identifica o OpenClaw.
- O mesmo prompt semelhante ao do OpenClaw não atinge essa proteção no
  caminho Anthropic SDK + `ANTHROPIC_API_KEY`.
- Use chaves de API Anthropic para tráfego Anthropic no OpenClaw.

## Observações

- A documentação pública do Claude Code da Anthropic ainda documenta uso direto de CLI, como
  `claude -p`, mas o aviso separado da Anthropic aos usuários do OpenClaw diz que o
  caminho Claude-login do **OpenClaw** é uso de harness de terceiros e exige
  **Extra Usage** (pay-as-you-go cobrado separadamente da assinatura).
  Nossas reproduções locais também mostram que
  `claude -p --append-system-prompt ...` direto pode atingir a mesma proteção quando o
  prompt anexado identifica o OpenClaw, enquanto a mesma forma de prompt não
  reproduz no caminho Anthropic SDK + `ANTHROPIC_API_KEY`. Para produção, nós
  recomendamos chaves de API Anthropic.
- O setup-token Anthropic está disponível novamente no OpenClaw como um caminho legado/manual. O aviso de cobrança específico da Anthropic para OpenClaw ainda se aplica, então use-o com a expectativa de que a Anthropic exija **Extra Usage** para esse caminho.
- Detalhes de autenticação + regras de reutilização estão em [/concepts/oauth](/pt-BR/concepts/oauth).

## Solução de problemas

**Erros 401 / token subitamente inválido**

- A autenticação legada por token Anthropic pode expirar ou ser revogada.
- Para novas configurações, migre para uma chave de API Anthropic.

**Nenhuma chave de API encontrada para o provedor "anthropic"**

- A autenticação é **por agente**. Novos agentes não herdam as chaves do agente principal.
- Execute o onboarding novamente para esse agente ou configure uma chave de API no host do gateway
  e depois verifique com `openclaw models status`.

**Nenhuma credencial encontrada para o perfil `anthropic:default`**

- Execute `openclaw models status` para ver qual perfil de autenticação está ativo.
- Execute o onboarding novamente ou configure uma chave de API para esse caminho de perfil.

**Nenhum perfil de autenticação disponível (todos em cooldown/indisponíveis)**

- Verifique `openclaw models status --json` para `auth.unusableProfiles`.
- Cooldowns de limite de taxa da Anthropic podem ser específicos por modelo, então um modelo Anthropic
  irmão ainda pode ser utilizável mesmo quando o atual está em cooldown.
- Adicione outro perfil Anthropic ou aguarde o cooldown.

Mais: [/gateway/troubleshooting](/pt-BR/gateway/troubleshooting) e [/help/faq](/pt-BR/help/faq).
