---
read_when:
    - Você quer usar modelos da Anthropic no OpenClaw
summary: Use o Anthropic Claude por meio de chaves de API ou da Claude CLI no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T10:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic cria a família de modelos **Claude**. O OpenClaw oferece suporte a duas rotas de autenticação:

- **Chave de API** — acesso direto à API da Anthropic com cobrança baseada em uso (modelos `anthropic/*`)
- **Claude CLI** — reutilize um login existente do Claude CLI no mesmo host

<Warning>
A equipe da Anthropic nos informou que o uso do Claude CLI no estilo do OpenClaw voltou a ser permitido, então
o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como sancionados, a menos que
a Anthropic publique uma nova política.

Para hosts de Gateway de longa duração, as chaves de API da Anthropic ainda são o caminho de produção mais claro e
previsível.

Documentação pública atual da Anthropic:

- [Referência do Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Visão geral do Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Como usar o Claude Code com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Como usar o Claude Code com seu plano Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Introdução

<Tabs>
  <Tab title="Chave de API">
    **Ideal para:** acesso padrão à API e cobrança baseada em uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie uma chave de API no [Console da Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Exemplo de configuração

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideal para:** reutilizar um login existente do Claude CLI sem uma chave de API separada.

    <Steps>
      <Step title="Garanta que o Claude CLI esteja instalado e com login feito">
        Verifique com:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        O OpenClaw detecta e reutiliza as credenciais existentes do Claude CLI.
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Os detalhes de configuração e runtime do backend do Claude CLI estão em [Backends de CLI](/pt-BR/gateway/cli-backends).
    </Note>

    ### Exemplo de configuração

    Prefira a referência canônica de modelo da Anthropic mais uma substituição de runtime de CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Referências de modelo legadas `claude-cli/claude-opus-4-7` ainda funcionam para
    compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo como
    `anthropic/*` e colocar o backend de execução em `agentRuntime.id`.

    <Tip>
    Se você quiser o caminho de cobrança mais claro, use uma chave de API da Anthropic. O OpenClaw também oferece suporte a opções em estilo de assinatura da [OpenAI Codex](/pt-BR/providers/openai), [Qwen Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e [Z.AI / GLM](/pt-BR/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Padrões de raciocínio (Claude 4.6)

Os modelos Claude 4.6 usam `adaptive` thinking por padrão no OpenClaw quando nenhum nível explícito de thinking é definido.

Substitua por mensagem com `/think:<level>` ou nos parâmetros do modelo:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Documentação relacionada da Anthropic:
- [Thinking adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Thinking estendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Cache de prompts

O OpenClaw oferece suporte ao recurso de cache de prompts da Anthropic para autenticação por chave de API.

| Valor               | Duração do cache | Descrição                                      |
| ------------------- | ---------------- | ---------------------------------------------- |
| `"short"` (padrão)  | 5 minutos        | Aplicado automaticamente para auth por chave de API |
| `"long"`            | 1 hora           | Cache estendido                                |
| `"none"`            | Sem cache        | Desativa o cache de prompts                    |

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

<AccordionGroup>
  <Accordion title="Substituições de cache por agente">
    Use parâmetros no nível do modelo como sua base e, em seguida, substitua agentes específicos via `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Ordem de mesclagem da configuração:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` correspondente, substitui por chave)

    Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desativa o cache para tráfego em rajadas/com baixa reutilização.

  </Accordion>

  <Accordion title="Notas sobre Bedrock Claude">
    - Modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam repasse de `cacheRetention` quando configurado.
    - Modelos Bedrock que não são da Anthropic são forçados para `cacheRetention: "none"` em runtime.
    - Padrões inteligentes para chave de API também inicializam `cacheRetention: "short"` para referências Claude-on-Bedrock quando nenhum valor explícito é definido.

  </Accordion>
</AccordionGroup>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo rápido">
    O alternador compartilhado `/fast` do OpenClaw oferece suporte a tráfego direto da Anthropic (chave de API e OAuth para `api.anthropic.com`).

    | Comando | Mapeia para |
    |---------|-------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

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

    <Note>
    - Injetado somente em solicitações diretas para `api.anthropic.com`. Rotas de proxy deixam `service_tier` inalterado.
    - Parâmetros explícitos `serviceTier` ou `service_tier` substituem `/fast` quando ambos estão definidos.
    - Em contas sem capacidade de Priority Tier, `service_tier: "auto"` pode resolver para `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compreensão de mídia (imagem e PDF)">
    O Plugin Anthropic incluído registra compreensão de imagem e PDF. O OpenClaw
    resolve automaticamente as capacidades de mídia a partir da autenticação Anthropic configurada — nenhuma
    configuração adicional é necessária.

    | Propriedade      | Valor                |
    | ---------------- | -------------------- |
    | Modelo padrão    | `claude-opus-4-6`    |
    | Entrada compatível | Imagens, documentos PDF |

    Quando uma imagem ou PDF é anexado a uma conversa, o OpenClaw automaticamente
    o encaminha pelo provedor de compreensão de mídia da Anthropic.

  </Accordion>

  <Accordion title="Janela de contexto de 1M (beta)">
    A janela de contexto de 1M da Anthropic é protegida por beta. Ative por modelo:

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

    O OpenClaw mapeia isso para `anthropic-beta: context-1m-2025-08-07` nas solicitações.

    `params.context1m: true` também se aplica ao backend do Claude CLI
    (`claude-cli/*`) para modelos Opus e Sonnet elegíveis, expandindo a janela de
    contexto de runtime dessas sessões de CLI para corresponder ao comportamento da API direta.

    <Warning>
    Requer acesso de contexto longo na sua credencial Anthropic. Auth por token legado (`sk-ant-oat-*`) é rejeitada para solicitações de contexto de 1M — o OpenClaw registra um aviso e recorre à janela de contexto padrão.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M do Claude Opus 4.7">
    `anthropic/claude-opus-4.7` e sua variante `claude-cli` têm uma janela de contexto de 1M
    por padrão — não é necessário `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros 401 / token repentinamente inválido">
    Auth por token da Anthropic expira e pode ser revogada. Para novas configurações, use uma chave de API da Anthropic.
  </Accordion>

  <Accordion title='Nenhuma chave de API encontrada para o provedor "anthropic"'>
    A auth da Anthropic é **por agente** — novos agentes não herdam as chaves do agente principal. Execute o onboarding novamente para esse agente (ou configure uma chave de API no host do Gateway) e verifique com `openclaw models status`.
  </Accordion>

  <Accordion title='Nenhuma credencial encontrada para o perfil "anthropic:default"'>
    Execute `openclaw models status` para ver qual perfil de auth está ativo. Execute o onboarding novamente ou configure uma chave de API para esse caminho de perfil.
  </Accordion>

  <Accordion title="Nenhum perfil de auth disponível (todos em cooldown)">
    Verifique `openclaw models status --json` para `auth.unusableProfiles`. Cooldowns de limite de taxa da Anthropic podem ser específicos por modelo, então um modelo Anthropic irmão ainda pode ser utilizável. Adicione outro perfil Anthropic ou aguarde o cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Backends de CLI" href="/pt-BR/gateway/cli-backends" icon="terminal">
    Configuração do backend do Claude CLI e detalhes de runtime.
  </Card>
  <Card title="Cache de prompts" href="/pt-BR/reference/prompt-caching" icon="database">
    Como o cache de prompts funciona entre provedores.
  </Card>
  <Card title="OAuth e auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de auth e regras de reutilização de credenciais.
  </Card>
</CardGroup>
