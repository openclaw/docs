---
read_when:
    - Você quer usar modelos da Anthropic no OpenClaw
summary: Use Anthropic Claude via chaves de API ou Claude CLI no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:01:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

A Anthropic cria a família de modelos **Claude**. O OpenClaw oferece suporte a duas rotas de autenticação:

- **Chave de API** — acesso direto à API da Anthropic com cobrança baseada em uso (modelos `anthropic/*`)
- **Claude CLI** — reutilize um login existente do Claude Code no mesmo host

<Warning>
O backend Claude CLI do OpenClaw executa a CLI Claude Code instalada em
modo de impressão não interativo. A documentação atual do Claude Code da Anthropic descreve
`claude -p` como uso do Agent SDK/programático. A partir de 15 de junho de 2026, a Anthropic
diz que o uso de `claude -p` em planos de assinatura não consome mais os limites normais do plano
Claude; ele consome primeiro um crédito mensal separado do Agent SDK e, depois, créditos
de uso nas tarifas padrão de API quando esses créditos estão habilitados.

O Claude Code interativo ainda consome os limites do plano Claude conectado. A autenticação por
chave de API permanece como cobrança direta de API com pagamento conforme o uso. Para hosts Gateway
de longa duração, automação compartilhada e gastos previsíveis em produção, use uma chave de API da Anthropic.

Documentação pública atual da Anthropic:

- [Referência da CLI Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Use o Claude Agent SDK com seu plano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Use o Claude Code com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Use o Claude Code com seu plano Team ou Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gerencie os custos do Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Introdução

<Tabs>
  <Tab title="Chave de API">
    **Melhor para:** acesso padrão à API e cobrança baseada em uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie uma chave de API no [Console da Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Execute a integração inicial">
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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Melhor para:** reutilizar um login existente do Claude CLI sem uma chave de API separada.

    <Steps>
      <Step title="Garanta que o Claude CLI esteja instalado e conectado">
        Verifique com:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Execute a integração inicial">
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
    Os detalhes de configuração e runtime do backend Claude CLI estão em [Backends de CLI](/pt-BR/gateway/cli-backends).
    </Note>

    <Warning>
    A reutilização do Claude CLI espera que o processo do OpenClaw execute no mesmo host que o
    login do Claude CLI. Instalações Docker podem persistir uma home do contêiner e fazer login no
    Claude Code nela; consulte
    [Backend Claude CLI no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).
    Outras instalações em contêiner, como [Podman](/pt-BR/install/podman), não montam o
    `~/.claude` do host na configuração ou no runtime; use uma chave de API da Anthropic ali ou escolha
    um provedor com OAuth gerenciado pelo OpenClaw, como
    [OpenAI Codex](/pt-BR/providers/openai).
    </Warning>

    ### Exemplo de configuração

    Prefira a referência canônica do modelo Anthropic mais uma substituição de runtime da CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Referências de modelo legadas `claude-cli/claude-opus-4-7` ainda funcionam por
    compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo como
    `anthropic/*` e colocar o backend de execução na política de runtime de provedor/modelo.

    ### Cobrança e `claude -p`

    O OpenClaw usa o caminho não interativo `claude -p` do Claude Code para execuções do Claude CLI.
    Atualmente, a Anthropic trata esse caminho como uso do Agent SDK/programático:

    - Até 15 de junho de 2026, o tratamento de planos de assinatura segue as regras ativas
      do Claude Code da Anthropic para a conta conectada.
    - A partir de 15 de junho de 2026, o uso de `claude -p` em planos de assinatura consome primeiro
      o crédito mensal do Agent SDK do usuário e, depois, créditos de uso nas tarifas padrão
      de API se os créditos de uso estiverem habilitados.
    - Logins por Console/chave de API usam cobrança de API com pagamento conforme o uso e não recebem
      o crédito de assinatura do Agent SDK.

    A Anthropic pode alterar a cobrança e o comportamento de limite de taxa do Claude Code sem uma
    versão do OpenClaw. Verifique `claude auth status`, `/status` e
    a documentação vinculada da Anthropic quando a previsibilidade da cobrança for importante.

    <Tip>
    Para automação compartilhada em produção, use uma chave de API da Anthropic em vez do
    Claude CLI. O OpenClaw também oferece suporte a opções no estilo assinatura de
    [OpenAI Codex](/pt-BR/providers/openai), [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax) e [Z.AI / GLM](/pt-BR/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Padrões de raciocínio (Claude Fable 5, 4.8 e 4.6)

`anthropic/claude-fable-5` sempre usa raciocínio adaptativo e o padrão é esforço `high`.
Como a Anthropic não permite desabilitar o raciocínio para esse modelo,
`/think off` e `/think minimal` usam esforço `low`. O OpenClaw também omite valores
personalizados de temperatura para solicitações do Fable 5.

O Claude Opus 4.8 mantém o raciocínio desativado por padrão no OpenClaw. Quando você habilita explicitamente o raciocínio adaptativo com `/think high|xhigh|max`, o OpenClaw envia os valores de esforço do Opus 4.8 da Anthropic; modelos Claude 4.6 usam `adaptive` por padrão.

Substitua por mensagem com `/think:<level>` ou nos parâmetros do modelo:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Documentação relacionada da Anthropic:
- [Raciocínio adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Raciocínio estendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Cache de prompts

O OpenClaw oferece suporte ao recurso de cache de prompts da Anthropic para autenticação por chave de API.

| Valor               | Duração do cache | Descrição                                      |
| ------------------- | ---------------- | ---------------------------------------------- |
| `"short"` (padrão)  | 5 minutos        | Aplicado automaticamente para autenticação por chave de API |
| `"long"`            | 1 hora           | Cache estendido                                |
| `"none"`            | Sem cache        | Desabilita o cache de prompts                  |

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
    Use parâmetros no nível do modelo como sua linha de base e, depois, substitua agentes específicos via `agents.list[].params`:

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

    Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desabilita o cache para tráfego em rajadas/com baixa reutilização.

  </Accordion>

  <Accordion title="Notas sobre Claude no Bedrock">
    - Modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam repasse de `cacheRetention` quando configurado.
    - Modelos Bedrock que não são da Anthropic são forçados para `cacheRetention: "none"` em runtime.
    - Padrões inteligentes de chave de API também semeiam `cacheRetention: "short"` para referências Claude no Bedrock quando nenhum valor explícito é definido.

  </Accordion>
</AccordionGroup>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo rápido">
    O alternador compartilhado `/fast` do OpenClaw oferece suporte ao tráfego direto da Anthropic (chave de API e OAuth para `api.anthropic.com`).

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
    - Injetado apenas para solicitações diretas a `api.anthropic.com`. Rotas de proxy deixam `service_tier` intocado.
    - Parâmetros explícitos `serviceTier` ou `service_tier` substituem `/fast` quando ambos são definidos.
    - Em contas sem capacidade Priority Tier, `service_tier: "auto"` pode resolver para `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compreensão de mídia (imagem e PDF)">
    O Plugin Anthropic incluído registra compreensão de imagens e PDFs. O OpenClaw
    resolve automaticamente recursos de mídia a partir da autenticação Anthropic configurada — nenhuma
    configuração adicional é necessária.

    | Propriedade       | Valor                 |
    | ----------------- | --------------------- |
    | Modelo padrão     | `claude-opus-4-8`     |
    | Entrada suportada | Imagens, documentos PDF |

    Quando uma imagem ou PDF é anexado a uma conversa, o OpenClaw a encaminha automaticamente
    pelo provedor de compreensão de mídia da Anthropic.

  </Accordion>

  <Accordion title="Janela de contexto de 1M">
    A janela de contexto de 1M da Anthropic está disponível em modelos Claude 4.x com capacidade GA,
    como Opus 4.8, Opus 4.7, Opus 4.6 e Sonnet 4.6. O OpenClaw dimensiona esses modelos em
    1M automaticamente:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Configurações mais antigas podem manter `params.context1m: true`, mas o OpenClaw não envia mais
    o cabeçalho beta desativado `context-1m-2025-08-07`. Entradas antigas de configuração `anthropicBeta`
    com esse valor são ignoradas durante a resolução de cabeçalhos da solicitação, e
    modelos Claude antigos sem suporte permanecem em sua janela de contexto normal.

    `params.context1m: true` também se aplica ao backend Claude CLI
    (`claude-cli/*`) para modelos Opus e Sonnet elegíveis com capacidade GA, preservando
    a janela de contexto do runtime para essas sessões de CLI de modo que corresponda ao comportamento
    da API direta.

    <Warning>
    Requer acesso de contexto longo na sua credencial Anthropic. A autenticação por token OAuth/assinatura mantém seus cabeçalhos beta exigidos pela Anthropic, mas o OpenClaw remove o cabeçalho beta de 1M desativado se ele permanecer em uma configuração mais antiga.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M do Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e sua variante `claude-cli` têm uma janela de contexto de 1M
    por padrão — não é necessário `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros 401 / token repentinamente inválido">
    A autenticação por token da Anthropic expira e pode ser revogada. Para novas configurações, use uma chave de API da Anthropic.
  </Accordion>

  <Accordion title='Nenhuma chave de API encontrada para o provedor "anthropic"'>
    A autenticação da Anthropic é **por agente** — novos agentes não herdam as chaves do agente principal. Execute o onboarding novamente para esse agente (ou configure uma chave de API no host do Gateway) e verifique com `openclaw models status`.
  </Accordion>

  <Accordion title='Nenhuma credencial encontrada para o perfil "anthropic:default"'>
    Execute `openclaw models status` para ver qual perfil de autenticação está ativo. Execute o onboarding novamente ou configure uma chave de API para esse caminho de perfil.
  </Accordion>

  <Accordion title="Nenhum perfil de autenticação disponível (todos em cooldown)">
    Verifique `auth.unusableProfiles` em `openclaw models status --json`. Os cooldowns de limite de taxa da Anthropic podem ser específicos do modelo, então um modelo Anthropic irmão ainda pode ser utilizável. Adicione outro perfil Anthropic ou aguarde o cooldown.
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
  <Card title="Backends da CLI" href="/pt-BR/gateway/cli-backends" icon="terminal">
    Configuração do backend da CLI Claude e detalhes de runtime.
  </Card>
  <Card title="Armazenamento em cache de prompts" href="/pt-BR/reference/prompt-caching" icon="database">
    Como o armazenamento em cache de prompts funciona entre provedores.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
