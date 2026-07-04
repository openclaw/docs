---
read_when:
    - Você quer usar modelos da Anthropic no OpenClaw
summary: Use Anthropic Claude via chaves de API ou Claude CLI no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:11:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

A Anthropic cria a família de modelos **Claude**. O OpenClaw é compatível com duas rotas de autenticação:

- **Chave de API** — acesso direto à API da Anthropic com cobrança baseada em uso (modelos `anthropic/*`)
- **Claude CLI** — reutilize um login existente do Claude Code no mesmo host

<Warning>
O backend Claude CLI do OpenClaw executa a Claude Code CLI instalada em
modo de impressão não interativo. A documentação atual do Claude Code da Anthropic descreve
`claude -p` como uso do Agent SDK/programático. A atualização de suporte da Anthropic de 15 de junho de 2026
pausou a alteração de cobrança do Agent SDK anunciada. Por enquanto, a Anthropic afirma que
o uso do Claude Agent SDK, de `claude -p` e de aplicativos de terceiros ainda consome os
limites de uso da assinatura. O crédito mensal do Agent SDK anunciado anteriormente
não está disponível enquanto a Anthropic revisa esse plano.

O Claude Code interativo ainda consome os limites do plano Claude conectado. A autenticação por
chave de API continua sendo cobrança direta de API conforme o uso. Para hosts de gateway de longa duração,
automação compartilhada e gastos previsíveis em produção, use uma chave de API da Anthropic.

Consulte os artigos de suporte atuais da Anthropic antes de depender do comportamento de
cobrança por assinatura:

- [Referência da Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Use o Claude Agent SDK com seu plano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Use o Claude Code com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Use o Claude Code com seu plano Team ou Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gerencie os custos do Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Primeiros passos

<Tabs>
  <Tab title="Chave de API">
    **Melhor para:** acesso padrão à API e cobrança baseada em uso.

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Melhor para:** reutilizar um login existente da Claude CLI sem uma chave de API separada.

    <Steps>
      <Step title="Garanta que a Claude CLI esteja instalada e conectada">
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
    Os detalhes de configuração e runtime do backend Claude CLI estão em [Backends de CLI](/pt-BR/gateway/cli-backends).
    </Note>

    <Warning>
    A reutilização da Claude CLI espera que o processo do OpenClaw seja executado no mesmo host que o
    login da Claude CLI. Instalações Docker podem persistir o home de um contêiner e fazer login no
    Claude Code ali; veja
    [backend Claude CLI no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).
    Outras instalações em contêiner, como [Podman](/pt-BR/install/podman), não montam o
    `~/.claude` do host na configuração ou no runtime; use uma chave de API da Anthropic ali, ou escolha
    um provedor com OAuth gerenciado pelo OpenClaw, como
    [OpenAI Codex](/pt-BR/providers/openai).
    </Warning>

    ### Exemplo de configuração

    Prefira a ref de modelo canônica da Anthropic mais uma substituição de runtime da CLI:

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

    Refs de modelo legadas `claude-cli/claude-opus-4-7` ainda funcionam para
    compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo como
    `anthropic/*` e colocar o backend de execução na política de runtime de provedor/modelo.

    ### Cobrança e `claude -p`

    O OpenClaw usa o caminho não interativo `claude -p` do Claude Code para execuções via Claude CLI.
    A Anthropic atualmente trata esse caminho como uso do Agent SDK/programático:

    - A atualização de suporte da Anthropic de 15 de junho de 2026 pausou o plano de crédito separado
      do Agent SDK anunciado anteriormente.
    - Por enquanto, o uso do Claude Agent SDK em planos de assinatura, de `claude -p` e de aplicativos
      de terceiros ainda consome os limites de uso da assinatura conectada.
    - O crédito mensal do Agent SDK anunciado anteriormente não está disponível enquanto
      a Anthropic revisa esse plano.
    - Logins de Console/chave de API usam cobrança de API conforme o uso e não recebem
      o crédito do Agent SDK da assinatura.

    Veja o [artigo sobre o plano do Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    da Anthropic para o aviso de pausa, e os artigos sobre planos do Claude Code para o comportamento de assinatura
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    e
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    A Anthropic pode alterar a cobrança e o comportamento de limites de taxa do Claude Code sem uma
    versão do OpenClaw. Verifique `claude auth status`, `/status` e
    a documentação vinculada da Anthropic quando a previsibilidade de cobrança for importante.

    <Tip>
    Para automação de produção compartilhada, use uma chave de API da Anthropic em vez de
    Claude CLI. O OpenClaw também é compatível com opções em estilo de assinatura da
    [OpenAI Codex](/pt-BR/providers/openai), [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax) e [Z.AI / GLM](/pt-BR/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Padrões de raciocínio (Claude Fable 5, 4.8 e 4.6)

`anthropic/claude-fable-5` sempre usa raciocínio adaptativo e o padrão é esforço `high`.
Como a Anthropic não permite desativar o raciocínio para este modelo,
`/think off` e `/think minimal` usam esforço `low`. O OpenClaw também omite valores de
temperatura personalizados para solicitações do Fable 5.

O Claude Opus 4.8 mantém o raciocínio desativado por padrão no OpenClaw. Quando você ativa explicitamente o raciocínio adaptativo com `/think high|xhigh|max`, o OpenClaw envia os valores de esforço do Opus 4.8 da Anthropic; modelos Claude 4.6 usam `adaptive` por padrão.

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

## Fallback de recusa de segurança (Claude Fable 5)

<Warning>
Usar o Claude Fable 5 também significa usar o Claude Opus 4.8. O Fable 5 é distribuído com
classificadores de segurança que podem recusar uma solicitação, e a recuperação sancionada pela Anthropic
é fazer `claude-opus-4-8` atender esse turno. O OpenClaw adere a isso
automaticamente para solicitações diretas com chave de API, portanto alguns turnos do Fable são respondidos
e cobrados como Claude Opus 4.8. Se sua política ou orçamento não puder aceitar
turnos atendidos pelo Opus, não selecione `anthropic/claude-fable-5`.
</Warning>

### Por que isso existe

Os classificadores do Fable 5 retornam `stop_reason: "refusal"` em solicitações em domínios
restritos, e também geram falsos positivos em trabalhos benignos adjacentes (ferramentas de
segurança, ciências biológicas ou até pedir ao modelo para reproduzir seu raciocínio
bruto). Sem um fallback, o turno termina com erro mesmo que outro modelo Claude
pudesse atendê-lo sem problemas — a própria mensagem de recusa da Anthropic informa aos integradores de API
que configurem um modelo de fallback.

### Como funciona

1. Para cada solicitação direta com chave de API para `anthropic/claude-fable-5`, o OpenClaw
   envia a adesão ao fallback do lado do servidor da Anthropic: o cabeçalho beta
   `server-side-fallback-2026-06-01` mais
   `fallbacks: [{"model": "claude-opus-4-8"}]`. O Claude Opus 4.8 é o único
   destino de fallback que a Anthropic permite para o Fable 5.
2. Apenas uma recusa do classificador de segurança aciona o fallback. Limites de taxa,
   sobrecargas e erros de servidor se comportam exatamente como antes e passam pelo
   [failover de modelo](/pt-BR/concepts/model-failover) normal do OpenClaw.
3. O resgate acontece dentro da mesma chamada. Uma recusa antes de qualquer saída é
   invisível, exceto pela latência; a resposta inteira vem do Opus 4.8. Em uma
   recusa no meio do stream, o texto parcial é mantido como o prefixo a partir do qual o modelo
   de fallback continua, enquanto o raciocínio e as chamadas de ferramentas do modelo recusado
   são descartados conforme as regras de replay da Anthropic (eles não devem ser ecoados de volta nem
   executados).
4. Se o Claude Opus 4.8 também recusar, o turno expõe a recusa como um
   erro, exatamente como antes deste recurso.

O fallback acontece no nível da API da Anthropic, portanto `claude-opus-4-8` não
precisa estar na sua lista de modelos configurada ou na cadeia de fallback — uma chave de API
capaz de usar o Fable sempre pode atender Opus.

### Observabilidade e cobrança

- Um turno atendido por fallback registra um diagnóstico `provider_fallback` na
  mensagem do assistente nomeando `fromModel` e `toModel`, e o
  `responseModel` da mensagem relata `claude-opus-4-8`.
- A Anthropic cobra por tentativa: uma recusa antes da saída é gratuita, e o resgate
  é cobrado às taxas do Claude Opus 4.8 (atualmente metade das taxas do Fable 5). A estimativa
  de custo por turno do OpenClaw precifica turnos atendidos por fallback às taxas do Opus para corresponder.
- Uma recusa no meio do stream também cobra o parcial do Fable já transmitido
  no lado da Anthropic; essa parte é relatada no uso por tentativa da API,
  mas não é incorporada à estimativa por turno do OpenClaw.

### Escopo

Aplica-se a `anthropic/claude-fable-5` com autenticação por chave de API contra
`api.anthropic.com`. OAuth (reutilização de assinatura da Claude CLI), URLs base de proxy,
solicitações Bedrock, Vertex e Foundry não mudam e ainda expõem
recusas como erros ali.

Verificado ao vivo: um prompt benigno pedindo ao Fable 5 para reproduzir sua cadeia de
pensamento bruta é recusado com `category: "reasoning_extraction"` quando enviado sem
fallbacks, e o mesmo prompt pelo OpenClaw retorna uma resposta normal atendida pelo Opus
com o diagnóstico `provider_fallback` anexado.

Veja o [guia de recusas e fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
da Anthropic para o comportamento subjacente.

## Cache de prompts

O OpenClaw é compatível com o recurso de cache de prompts da Anthropic para autenticação por chave de API.

| Valor               | Duração do cache | Descrição                                      |
| ------------------- | ---------------- | ---------------------------------------------- |
| `"short"` (padrão)  | 5 minutos        | Aplicado automaticamente para autenticação por chave de API |
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
    Use parâmetros no nível do modelo como sua linha de base e depois substitua agentes específicos via `agents.list[].params`:

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
    2. `agents.list[].params` (`id` correspondente, sobrescreve por chave)

    Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desativa o cache para tráfego em rajadas/com baixa reutilização.

  </Accordion>

  <Accordion title="Notas do Claude no Bedrock">
    - Modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam repasse de `cacheRetention` quando configurado.
    - Modelos Bedrock que não são da Anthropic são forçados para `cacheRetention: "none"` em tempo de execução.
    - Padrões inteligentes de chave de API também preenchem `cacheRetention: "short"` para refs Claude no Bedrock quando nenhum valor explícito está definido.

  </Accordion>
</AccordionGroup>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo rápido">
    O alternador `/fast` compartilhado do OpenClaw oferece suporte a tráfego Anthropic direto (chave de API e OAuth para `api.anthropic.com`).

    | Comando | Mapeia para |
    |---------|---------|
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
    - Parâmetros explícitos `serviceTier` ou `service_tier` sobrescrevem `/fast` quando ambos estão definidos.
    - Em contas sem capacidade do Priority Tier, `service_tier: "auto"` pode resolver para `standard`.

    </Note>

  </Accordion>

  <Accordion title="Entendimento de mídia (imagem e PDF)">
    O Plugin Anthropic incluído registra entendimento de imagem e PDF. O OpenClaw
    resolve automaticamente recursos de mídia a partir da autenticação Anthropic configurada — nenhuma
    configuração adicional é necessária.

    | Propriedade        | Valor                 |
    | --------------- | --------------------- |
    | Modelo padrão   | `claude-opus-4-8`     |
    | Entrada compatível | Imagens, documentos PDF |

    Quando uma imagem ou PDF é anexado a uma conversa, o OpenClaw automaticamente
    o encaminha pelo provedor de entendimento de mídia da Anthropic.

  </Accordion>

  <Accordion title="Janela de contexto de 1M">
    A janela de contexto de 1M da Anthropic está disponível em modelos Claude 4.x com disponibilidade geral
    como Opus 4.8, Opus 4.7, Opus 4.6 e Sonnet 4.6. O OpenClaw dimensiona esses modelos para
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
    o cabeçalho beta retirado `context-1m-2025-08-07`. Entradas de configuração `anthropicBeta` mais antigas
    com esse valor são ignoradas durante a resolução de cabeçalhos de solicitação, e
    modelos Claude antigos sem suporte permanecem na janela de contexto normal.

    `params.context1m: true` também se aplica ao backend Claude CLI
    (`claude-cli/*`) para modelos Opus e Sonnet elegíveis com disponibilidade geral, preservando
    a janela de contexto em tempo de execução dessas sessões de CLI para corresponder ao comportamento de API direta.

    <Warning>
    Requer acesso a contexto longo na sua credencial Anthropic. A autenticação por OAuth/token de assinatura mantém seus cabeçalhos beta Anthropic obrigatórios, mas o OpenClaw remove o cabeçalho beta 1M retirado se ele permanecer em configurações antigas.
    </Warning>

  </Accordion>

  <Accordion title="Contexto 1M do Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e sua variante `claude-cli` têm uma janela de contexto
    de 1M por padrão — sem necessidade de `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros 401 / token repentinamente inválido">
    A autenticação por token da Anthropic expira e pode ser revogada. Para novas configurações, use uma chave de API Anthropic.
  </Accordion>

  <Accordion title='Nenhuma chave de API encontrada para o provedor "anthropic"'>
    A autenticação Anthropic é **por agente** — novos agentes não herdam as chaves do agente principal. Execute o onboarding novamente para esse agente (ou configure uma chave de API no host do Gateway), depois verifique com `openclaw models status`.
  </Accordion>

  <Accordion title='Nenhuma credencial encontrada para o perfil "anthropic:default"'>
    Execute `openclaw models status` para ver qual perfil de autenticação está ativo. Execute o onboarding novamente ou configure uma chave de API para esse caminho de perfil.
  </Accordion>

  <Accordion title="Nenhum perfil de autenticação disponível (todos em cooldown)">
    Verifique `openclaw models status --json` para `auth.unusableProfiles`. Cooldowns por limite de taxa da Anthropic podem ser escopados por modelo, então um modelo Anthropic irmão ainda pode ser utilizável. Adicione outro perfil Anthropic ou aguarde o cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Backends de CLI" href="/pt-BR/gateway/cli-backends" icon="terminal">
    Configuração do backend Claude CLI e detalhes de tempo de execução.
  </Card>
  <Card title="Cache de prompt" href="/pt-BR/reference/prompt-caching" icon="database">
    Como o cache de prompt funciona entre provedores.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
