---
read_when:
    - Você quer usar modelos da Anthropic no OpenClaw
summary: Use o Anthropic Claude por meio de chaves de API ou da Claude CLI no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:22:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

A Anthropic cria a família de modelos **Claude**. O OpenClaw oferece suporte a duas rotas de autenticação:

- **Chave de API** — acesso direto à API da Anthropic com cobrança baseada no uso (modelos `anthropic/*`)
- **Claude CLI** — reutilize um login existente da Claude CLI no mesmo host

<Warning>
A equipe da Anthropic nos informou que o uso da Claude CLI no estilo do OpenClaw é permitido novamente, então
o OpenClaw trata a reutilização da Claude CLI e o uso de `claude -p` como autorizados, a menos que
a Anthropic publique uma nova política.

Para hosts de gateway de longa duração, as chaves de API da Anthropic ainda são o caminho de produção mais claro e
previsível.

Documentação pública atual da Anthropic:

- [Referência da Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Visão geral do Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Usando o Claude Code com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Usando o Claude Code com seu plano Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Primeiros passos

<Tabs>
  <Tab title="Chave de API">
    **Ideal para:** acesso padrão à API e cobrança baseada no uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie uma chave de API no [Anthropic Console](https://console.anthropic.com/).
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
    **Ideal para:** reutilizar um login existente da Claude CLI sem uma chave de API separada.

    <Steps>
      <Step title="Confirme que a Claude CLI está instalada e conectada">
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

        O OpenClaw detecta e reutiliza as credenciais existentes da Claude CLI.
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detalhes de configuração e runtime do backend da Claude CLI estão em [Backends de CLI](/pt-BR/gateway/cli-backends).
    </Note>

    ### Exemplo de configuração

    Prefira a referência canônica do modelo da Anthropic mais uma substituição de runtime da CLI:

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

    Referências de modelo legadas `claude-cli/claude-opus-4-7` ainda funcionam por
    compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo como
    `anthropic/*` e colocar o backend de execução em `agentRuntime.id`.

    <Tip>
    Se você quer o caminho de cobrança mais claro, use uma chave de API da Anthropic. O OpenClaw também oferece suporte a opções no estilo assinatura da [OpenAI Codex](/pt-BR/providers/openai), [Qwen Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e [Z.AI / GLM](/pt-BR/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Padrões de pensamento (Claude 4.6)

Modelos Claude 4.6 usam por padrão o pensamento `adaptive` no OpenClaw quando nenhum nível de pensamento explícito é definido.

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
- [Pensamento adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Pensamento estendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Cache de prompt

O OpenClaw oferece suporte ao recurso de cache de prompt da Anthropic para autenticação por chave de API.

| Valor               | Duração do cache | Descrição                                      |
| ------------------- | ---------------- | ---------------------------------------------- |
| `"short"` (padrão)  | 5 minutos        | Aplicado automaticamente para autenticação por chave de API |
| `"long"`            | 1 hora           | Cache estendido                                |
| `"none"`            | Sem cache        | Desativa o cache de prompt                     |

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
    Use parâmetros no nível do modelo como sua base e, depois, substitua agentes específicos via `agents.list[].params`:

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
    2. `agents.list[].params` (correspondente a `id`, substitui por chave)

    Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desativa o cache para tráfego em rajadas/com baixa reutilização.

  </Accordion>

  <Accordion title="Observações sobre Claude no Bedrock">
    - Modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam passagem direta de `cacheRetention` quando configurados.
    - Modelos Bedrock que não são da Anthropic são forçados para `cacheRetention: "none"` em runtime.
    - Padrões inteligentes de chave de API também inicializam `cacheRetention: "short"` para referências Claude no Bedrock quando nenhum valor explícito é definido.

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
    - Injetado apenas para solicitações diretas a `api.anthropic.com`. Rotas de proxy deixam `service_tier` inalterado.
    - Parâmetros explícitos `serviceTier` ou `service_tier` substituem `/fast` quando ambos estão definidos.
    - Em contas sem capacidade de Priority Tier, `service_tier: "auto"` pode ser resolvido como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compreensão de mídia (imagem e PDF)">
    O Plugin Anthropic incluído registra compreensão de imagem e PDF. O OpenClaw
    resolve automaticamente os recursos de mídia a partir da autenticação Anthropic configurada — nenhuma
    configuração adicional é necessária.

    | Propriedade        | Valor                 |
    | ------------------ | --------------------- |
    | Modelo padrão      | `claude-opus-4-7`     |
    | Entrada compatível | Imagens, documentos PDF |

    Quando uma imagem ou um PDF é anexado a uma conversa, o OpenClaw automaticamente
    encaminha isso pelo provedor de compreensão de mídia da Anthropic.

  </Accordion>

  <Accordion title="Janela de contexto de 1M (beta)">
    A janela de contexto de 1M da Anthropic é controlada por beta. Habilite por modelo:

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

    `params.context1m: true` também se aplica ao backend da Claude CLI
    (`claude-cli/*`) para modelos Opus e Sonnet elegíveis, expandindo a janela
    de contexto de runtime dessas sessões de CLI para corresponder ao comportamento da API direta.

    <Warning>
    Requer acesso a contexto longo na sua credencial da Anthropic. Autenticação legada por token (`sk-ant-oat-*`) é rejeitada para solicitações de contexto de 1M — o OpenClaw registra um aviso e volta para a janela de contexto padrão.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M do Claude Opus 4.7">
    `anthropic/claude-opus-4.7` e sua variante `claude-cli` têm uma janela de contexto de 1M
    por padrão — não é necessário `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros 401 / token subitamente inválido">
    A autenticação por token da Anthropic expira e pode ser revogada. Para novas configurações, use uma chave de API da Anthropic.
  </Accordion>

  <Accordion title='Nenhuma chave de API encontrada para o provedor "anthropic"'>
    A autenticação da Anthropic é **por agente** — novos agentes não herdam as chaves do agente principal. Execute o onboarding novamente para esse agente (ou configure uma chave de API no host do Gateway) e, depois, verifique com `openclaw models status`.
  </Accordion>

  <Accordion title='Nenhuma credencial encontrada para o perfil "anthropic:default"'>
    Execute `openclaw models status` para ver qual perfil de autenticação está ativo. Execute o onboarding novamente ou configure uma chave de API para esse caminho de perfil.
  </Accordion>

  <Accordion title="Nenhum perfil de autenticação disponível (todos em cooldown)">
    Verifique `openclaw models status --json` para `auth.unusableProfiles`. Cooldowns de limite de taxa da Anthropic podem ter escopo por modelo, então um modelo Anthropic irmão ainda pode estar utilizável. Adicione outro perfil Anthropic ou aguarde o cooldown.
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
    Detalhes de configuração e runtime do backend da Claude CLI.
  </Card>
  <Card title="Cache de prompt" href="/pt-BR/reference/prompt-caching" icon="database">
    Como o cache de prompt funciona entre provedores.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
