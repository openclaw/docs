---
read_when:
    - Você quer usar modelos da Anthropic no OpenClaw
    - Você quer navegar pelas sessões do Claude CLI ou Claude Desktop em computadores pareados
summary: Use o Anthropic Claude por meio de chaves de API ou da CLI do Claude no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T15:29:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

A Anthropic desenvolve a família de modelos **Claude**. O OpenClaw oferece suporte a duas formas de autenticação:

- **Chave de API** - acesso direto à API da Anthropic com cobrança baseada no uso (modelos `anthropic/*`)
- **Claude CLI** - reutilização de um login existente do Claude Code no mesmo host

## Acompanhamento de uso e custos

O OpenClaw detecta a credencial disponível da Anthropic e seleciona a interface de uso correspondente:

- Credenciais de assinatura/configuração do Claude mostram janelas de cota e um orçamento opcional para uso adicional.
- `ANTHROPIC_ADMIN_KEY` ou `ANTHROPIC_ADMIN_API_KEY` mostra 30 dias de custos da organização e uso da Messages API informados pelo provedor em **Usage** na Control UI, incluindo gastos diários, totais de tokens/cache, modelos mais usados e categorias de custos.
- Uma credencial `sk-ant-admin...` armazenada no perfil do provedor Anthropic é detectada automaticamente como uma chave da Admin API.

O histórico de custos da Admin API vem da [API de uso e custos](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) da Anthropic. Ele representa a cobrança real do provedor, separada do custo estimado pelo OpenClaw com base nas sessões.

<Warning>
O backend Claude CLI do OpenClaw executa a CLI instalada do Claude Code no
modo de impressão não interativo (`claude -p`). A documentação atual do Claude Code
da Anthropic descreve esse modo como uso programático/do Agent SDK. A atualização
de suporte da Anthropic de 15 de junho de 2026 suspendeu a mudança de cobrança
separada do Agent SDK que havia sido anunciada: o Claude Agent SDK, `claude -p`
e o uso por aplicativos de terceiros ainda consomem os limites de uso de uma
assinatura com sessão iniciada, e o crédito mensal do Agent SDK anunciado
anteriormente não está disponível enquanto a Anthropic revisa esse plano.

O Claude Code interativo ainda consome os limites do plano Claude com sessão
iniciada. A autenticação por chave de API usa cobrança direta conforme o uso e
não depende desse plano. Para hosts do Gateway de longa duração, automação
compartilhada e gastos de produção previsíveis, use uma chave de API da Anthropic.

Os artigos de suporte atuais da Anthropic podem alterar esse comportamento sem
uma versão nova do OpenClaw:

- [Referência da CLI do Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Usar o Claude Agent SDK com seu plano Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Usar o Claude Code com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Usar o Claude Code com seu plano Team ou Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gerenciar os custos do Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Primeiros passos

<Tabs>
  <Tab title="Chave de API">
    **Ideal para:** acesso padrão à API e cobrança baseada no uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie uma chave de API no [Console da Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Execute a configuração inicial">
        ```bash
        openclaw onboard
        # escolha: chave de API da Anthropic
        ```

        Ou forneça a chave diretamente:

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
    **Ideal para:** reutilizar um login existente do Claude CLI sem uma chave de API separada.

    <Steps>
      <Step title="Confirme que o Claude CLI está instalado e autenticado">
        Verifique com:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Execute a configuração inicial">
        ```bash
        openclaw onboard
        # escolha: Claude CLI
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
    Os detalhes de configuração e execução do backend Claude CLI estão em [Backends de CLI](/pt-BR/gateway/cli-backends).
    </Note>

    <Warning>
    A reutilização do Claude CLI exige que o processo do OpenClaw seja executado
    no mesmo host em que foi feito o login do Claude CLI. Instalações com Docker
    podem manter o diretório pessoal do contêiner e fazer login no Claude Code
    nele; consulte
    [Backend Claude CLI no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).
    Outras instalações em contêiner, como [Podman](/pt-BR/install/podman), não montam
    o `~/.claude` do host na configuração nem na execução; use uma chave de API
    da Anthropic nesses casos ou escolha um provedor com OAuth gerenciado pelo
    OpenClaw, como o [OpenAI Codex](/pt-BR/providers/openai).
    </Warning>

    ### Exemplo de configuração

    Prefira a referência canônica de modelo da Anthropic com uma substituição do runtime da CLI:

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

    Referências de modelo legadas como `claude-cli/claude-opus-4-7` ainda
    funcionam por compatibilidade, mas novas configurações devem manter a seleção
    de provedor/modelo como `anthropic/*` e colocar o backend de execução na
    política de runtime do provedor/modelo.

    ### Cobrança e `claude -p`

    O OpenClaw usa o caminho não interativo `claude -p` do Claude Code para
    execuções do Claude CLI. Atualmente, a Anthropic trata esse caminho como uso
    programático/do Agent SDK:

    - A atualização de suporte da Anthropic de 15 de junho de 2026 suspendeu o
      plano de crédito separado do Agent SDK anunciado anteriormente.
    - O uso do Claude Agent SDK em planos de assinatura, de `claude -p` e por
      aplicativos de terceiros ainda consome os limites de uso da assinatura
      com sessão iniciada.
    - O crédito mensal do Agent SDK anunciado anteriormente não está disponível
      enquanto a Anthropic revisa esse plano.
    - Logins pelo Console/chave de API usam cobrança de API conforme o uso e não
      recebem o crédito do Agent SDK da assinatura.

    Consulte o [artigo sobre o plano do Agent
    SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    da Anthropic para ver o aviso de suspensão e os artigos sobre planos do
    Claude Code para entender o comportamento das assinaturas
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    e
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    A Anthropic pode alterar o comportamento de cobrança e limitação de taxa do
    Claude Code sem uma versão nova do OpenClaw. Consulte `claude auth status`,
    `/status` e a documentação vinculada da Anthropic quando a previsibilidade
    da cobrança for importante.

    <Tip>
    Para automação de produção compartilhada, use uma chave de API da Anthropic
    em vez do Claude CLI. O OpenClaw também oferece suporte a opções no estilo
    de assinatura do [OpenAI Codex](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax) e
    [Z.AI / GLM](/pt-BR/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sessões do Claude entre computadores

O Plugin Anthropic incluído adiciona um grupo **Claude Code** à barra lateral
normal de sessões. As linhas são abertas no painel normal de Chat. Ele encontra
sessões não arquivadas do Claude Code no Gateway e nos hosts de Node conectados:

- As sessões do Claude CLI vêm de registros válidos do índice de projetos e de
  arquivos JSONL atuais cujo prefixo limitado de metadados identifica uma sessão
  `sdk-cli` que não seja sidechain em `~/.claude/projects/`.
- As sessões do Claude Desktop usam o título do Desktop, a hora de atividade e
  o estado de arquivamento quando os metadados apontam para o mesmo ID de sessão
  do Claude Code.
- Uma sessão exclusiva da CLI não tem indicador de arquivamento, portanto,
  permanece visível enquanto sua transcrição estiver presente.

Nenhuma configuração adicional do OpenClaw é necessária. O Plugin Anthropic
está incluído e ativado por padrão; um Node nativo do macOS anuncia os comandos
somente leitura das sessões do Claude quando o diretório local
`~/.claude/projects/` existe. Aprove a atualização do pareamento do Node quando
esses comandos aparecerem pela primeira vez.

A barra lateral começa com a página limitada mais recente de cada host e é
atualizada na cadência normal de 30 segundos. Use **Carregar mais sessões**
abaixo de um grupo do catálogo para anexar a próxima página de cada host que
tenha mais histórico; as linhas anexadas permanecem visíveis e são buscadas
novamente até a mesma profundidade a cada atualização. Os clientes do catálogo
usam `sessions.catalog.list`; abrir uma linha usa `sessions.catalog.read`.

A seleção de uma linha lê primeiro a página mais recente da transcrição.
**Carregar itens mais antigos da transcrição** segue um cursor opaco de bytes e
lê outra seção limitada do arquivo JSONL, em vez de carregar todo o histórico.
O conteúdo normal de usuário, assistente, raciocínio, chamada de ferramenta e
resultado de ferramenta é preservado. Um item individual maior que o limite de
segurança do Node/Gateway é claramente marcado como truncado.

Em uma linha `claude-cli` local do Gateway, digitar no compositor normal chama
`sessions.catalog.continue`. O OpenClaw resolve novamente o registro local do
catálogo, cria ou reutiliza uma sessão nativa vinculada ao modelo, importa no
máximo 200 itens visíveis ou 512 KiB e inicializa a vinculação do Claude CLI. O
primeiro turno é retomado com `--fork-session`; o Claude atribui um novo ID de
sessão à bifurcação, portanto os turnos posteriores usam a bifurcação e a sessão
de origem permanece inalterada. As linhas do Claude Desktop e de Nodes pareados
são somente para visualização.

<Note>
As sessões do Claude em Nodes pareados são somente leitura. O OpenClaw não
modifica os metadados do Claude Desktop, não arquiva sessões do Claude nem
inicia um segundo executor no computador proprietário. A página exige uma
conexão de operador com escopo de gravação porque usa o transporte autenticado
`node.invoke`, embora ambos os comandos do Node para o Claude sejam somente
leitura.
</Note>

Consulte [Nodes: sessões e transcrições do Claude](/pt-BR/nodes#claude-sessions-and-transcripts)
para conhecer o comando do Node e o limite de segurança.

## Padrões de raciocínio (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 e 4.6)

`anthropic/claude-sonnet-5` usa raciocínio adaptativo com esforço `high` por
padrão. Use `/think off` para desativar o raciocínio ou `/think xhigh|max` para
usar os níveis nativos de esforço mais altos do modelo. O OpenClaw omite
orçamentos manuais de raciocínio, parâmetros personalizados de amostragem,
prefixos de resposta do assistente e Priority Tier para o Sonnet 5 porque a
Anthropic não oferece suporte a esses recursos de solicitação nesse modelo.
O catálogo usa o preço introdutório da Anthropic de `$2/$10` para
entrada/saída até 31 de agosto de 2026; o preço padrão de `$3/$15` começa em
1º de setembro de 2026.

`anthropic/claude-fable-5` sempre usa raciocínio adaptativo e adota `high` como
esforço padrão. A Anthropic não permite desativar o raciocínio nesse modelo,
portanto `/think off` e `/think minimal` são mapeados para o esforço `low`. O
OpenClaw também omite valores personalizados de temperatura nas solicitações do
Fable 5, pois a Anthropic rejeita a substituição da temperatura em qualquer
solicitação com raciocínio ativado.

`anthropic/claude-mythos-5` é um modelo de acesso limitado com o mesmo contrato
de raciocínio adaptativo sempre ativo. O OpenClaw usa `high` por padrão, mapeia
`/think off` e `/think minimal` para `low` e omite parâmetros de amostragem
selecionados pelo chamador. O catálogo publica sua janela de contexto de
1.000.000 tokens, o limite de saída de 128.000 tokens, a entrada de imagens e o
preço de entrada/saída de `$10/$50`.

O Claude Opus 4.8 mantém o raciocínio desativado por padrão no OpenClaw. Quando
você ativa explicitamente o raciocínio adaptativo com `/think high|xhigh|max`, o
OpenClaw envia os valores de esforço do Opus 4.8 da Anthropic; os modelos Claude
4.6 (Opus 4.6 e Sonnet 4.6) usam `adaptive` por padrão.

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

## Alternativa em caso de recusa de segurança (Claude Fable 5)

<Warning>
Usar o Claude Fable 5 também significa usar o Claude Opus 4.8. O Fable 5 é fornecido com
classificadores de segurança que podem recusar uma solicitação, e a recuperação autorizada
pela Anthropic consiste em fazer com que o `claude-opus-4-8` atenda essa interação. O OpenClaw adere a isso
automaticamente para solicitações diretas com chave de API, portanto algumas interações do Fable são respondidas
e cobradas como Claude Opus 4.8. Se sua política ou seu orçamento não puder aceitar
interações atendidas pelo Opus, não selecione `anthropic/claude-fable-5`.
</Warning>

### Por que isso existe

Os classificadores do Fable 5 retornam `stop_reason: "refusal"` em solicitações de domínios
restritos e também geram falsos positivos em trabalhos benignos relacionados (ferramentas
de segurança, ciências da vida ou até mesmo ao pedir que o modelo reproduza seu raciocínio
bruto). Sem um fallback, a interação termina com um erro, embora outro modelo Claude
pudesse atendê-la sem problemas — a própria mensagem de recusa da Anthropic orienta
os integradores da API a configurar um modelo de fallback.

### Como funciona

1. Para cada solicitação direta com chave de API para `anthropic/claude-fable-5`, o OpenClaw
   envia a adesão ao fallback no servidor da Anthropic: o cabeçalho beta
   `server-side-fallback-2026-06-01` mais
   `fallbacks: [{"model": "claude-opus-4-8"}]`. O Claude Opus 4.8 é o único
   destino de fallback que a Anthropic permite para o Fable 5.
2. Somente uma recusa do classificador de segurança aciona o fallback. Limites de taxa,
   sobrecargas e erros do servidor mantêm exatamente o comportamento anterior e passam pelo
   [failover de modelo](/pt-BR/concepts/model-failover) normal do OpenClaw.
3. A recuperação acontece dentro da mesma chamada. Uma recusa antes de qualquer saída é
   imperceptível, exceto pela latência; toda a resposta vem do Opus 4.8. Em uma
   recusa no meio do streaming, o texto parcial é mantido como o prefixo a partir do qual o modelo
   de fallback continua, enquanto o raciocínio e as chamadas de ferramentas do modelo que recusou
   são descartados de acordo com as regras de repetição da Anthropic (eles não podem ser reenviados nem
   executados).
4. Se o Claude Opus 4.8 também recusar, a interação apresenta a recusa como um
   erro, exatamente como antes deste recurso.

O fallback acontece no nível da API da Anthropic, portanto `claude-opus-4-8` não
precisa estar na sua lista de modelos configurados nem na cadeia de fallback — uma chave de API
compatível com o Fable sempre pode atender solicitações com o Opus.

### Observabilidade e cobrança

- Uma interação atendida por fallback registra um diagnóstico `provider_fallback` na
  mensagem do assistente, indicando `fromModel` e `toModel`, e o
  `responseModel` da mensagem informa `claude-opus-4-8`.
- A Anthropic cobra por tentativa: uma recusa antes da saída é gratuita, e a recuperação
  é cobrada pelas tarifas do Claude Opus 4.8 (atualmente metade das tarifas do Fable 5). A
  estimativa de custo por interação do OpenClaw calcula as interações atendidas por fallback pelas tarifas do Opus para corresponder.
- Uma recusa no meio do streaming também gera cobrança pelo conteúdo parcial do Fable já transmitido
  no lado da Anthropic; essa parte é informada no uso por tentativa
  da API, mas não é incorporada à estimativa por interação do OpenClaw.

### Escopo

Aplica-se a `anthropic/claude-fable-5` com autenticação por chave de API em
`api.anthropic.com`. OAuth (reutilização da assinatura do Claude CLI), URLs-base de proxy,
solicitações do Bedrock, Vertex e Foundry não são alteradas e continuam apresentando
recusas como erros nesses ambientes.

Verificado em produção: um prompt benigno que pede ao Fable 5 para reproduzir sua cadeia de
raciocínio bruta é recusado com `category: "reasoning_extraction"` quando enviado sem
fallbacks, e o mesmo prompt pelo OpenClaw retorna uma resposta normal atendida pelo Opus
com o diagnóstico `provider_fallback` anexado.

Consulte o [guia de recusas e
fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
da Anthropic para conhecer o comportamento subjacente.

## Cache de prompts

O OpenClaw oferece suporte ao recurso de cache de prompts da Anthropic para autenticação por chave de API.

| Valor               | Duração do cache | Descrição                                      |
| ------------------- | ---------------- | ---------------------------------------------- |
| `"short"` (padrão)  | 5 minutos        | Aplicado automaticamente à autenticação por chave de API |
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
    Use os parâmetros no nível do modelo como referência e substitua agentes específicos por meio de `agents.list[].params`:

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
    2. `agents.list[].params` (com `id` correspondente, substitui por chave)

    Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desativa o cache para tráfego em rajadas ou com pouca reutilização.

  </Accordion>

  <Accordion title="Observações sobre o Claude no Bedrock">
    - Os modelos Claude da Anthropic no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam o repasse de `cacheRetention` quando configurado.
    - Modelos no Bedrock que não são da Anthropic são forçados a usar `cacheRetention: "none"` em tempo de execução.
    - Os padrões inteligentes para chave de API também definem `cacheRetention: "short"` para referências do Claude no Bedrock quando nenhum valor explícito é definido.

  </Accordion>
</AccordionGroup>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo rápido">
    O controle compartilhado `/fast` do OpenClaw define o campo `service_tier` da Anthropic para tráfego direto com chave de API para `api.anthropic.com`.

    | Comando | Corresponde a |
    |---------|---------------|
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
    - Aplica-se somente a solicitações diretas para `api.anthropic.com` feitas com uma chave de API. Solicitações com OAuth/token de assinatura e rotas de proxy nunca recebem um campo `service_tier`.
    - Os parâmetros explícitos `serviceTier` ou `service_tier` substituem `/fast` quando ambos estão definidos.
    - Em contas sem capacidade do Priority Tier, `service_tier: "auto"` pode ser resolvido como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compreensão de mídia (imagem e PDF)">
    O plugin integrado da Anthropic registra a compreensão de imagens e PDFs. O OpenClaw
    resolve automaticamente os recursos de mídia com base na autenticação configurada da Anthropic; nenhuma
    configuração adicional é necessária.

    | Propriedade       | Valor                  |
    | ----------------- | ---------------------- |
    | Modelo padrão     | `claude-opus-4-8`      |
    | Entrada compatível | Imagens, documentos PDF |

    Quando uma imagem ou um PDF é anexado a uma conversa, o OpenClaw o
    encaminha automaticamente pelo provedor de compreensão de mídia da Anthropic.

  </Accordion>

  <Accordion title="Janela de contexto de 1M">
    Claude Sonnet 5, Mythos 5 e Fable 5 têm uma janela de entrada de exatamente
    1.000.000 tokens e oferecem suporte a até 128.000 tokens de saída. A janela de contexto
    de 1M da Anthropic também está disponível de forma geral nos modelos Claude 4.x com pensamento adaptativo: Opus 4.8,
    Opus 4.7, Opus 4.6 e Sonnet 4.6. O OpenClaw dimensiona esses modelos
    automaticamente, sem necessidade de `params.context1m`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Configurações mais antigas podem manter `params.context1m: true`; isso é uma operação inócua sem efeito para
    esses modelos, e o OpenClaw não envia mais o cabeçalho beta descontinuado
    `context-1m-2025-08-07`, independentemente disso. Entradas antigas de configuração `anthropicBeta`
    com esse valor são removidas durante a resolução dos cabeçalhos da solicitação, e
    modelos Claude mais antigos sem suporte permanecem com sua janela de contexto normal.

    `params.context1m: true` tem o mesmo comportamento no backend do Claude CLI
    (`claude-cli/*`): modelos Opus e Sonnet qualificados e compatíveis com disponibilidade geral já recebem a
    janela de 1M automaticamente, portanto o parâmetro também é opcional nesse caso.

    <Warning>
    Requer acesso a contexto longo na sua credencial da Anthropic. A autenticação por OAuth/token de assinatura mantém os cabeçalhos beta obrigatórios da Anthropic, mas o OpenClaw remove o cabeçalho beta de 1M descontinuado caso ele permaneça em uma configuração antiga.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M do Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e sua variante `claude-cli` têm uma janela de contexto
    de 1M por padrão; não é necessário usar `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros 401 / token repentinamente inválido">
    A autenticação por token da Anthropic expira e pode ser revogada. Para novas configurações, use uma chave de API da Anthropic.
  </Accordion>

  <Accordion title='Nenhuma chave de API encontrada para o provedor "anthropic"'>
    A autenticação da Anthropic é **por agente**; novos agentes não herdam as chaves do agente principal. Execute novamente a integração inicial desse agente (ou configure uma chave de API no host do Gateway) e verifique com `openclaw models status`.
  </Accordion>

  <Accordion title='Nenhuma credencial encontrada para o perfil "anthropic:default"'>
    Execute `openclaw models status` para ver qual perfil de autenticação está ativo. Execute novamente a integração inicial ou configure uma chave de API para o caminho desse perfil.
  </Accordion>

  <Accordion title="Nenhum perfil de autenticação disponível (todos em período de espera)">
    Consulte `openclaw models status --json` para verificar `auth.unusableProfiles`. Os períodos de espera por limite de taxa da Anthropic podem ser específicos do modelo, portanto outro modelo da Anthropic ainda pode estar disponível. Adicione outro perfil da Anthropic ou aguarde o fim do período de espera.
  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Backends de CLI" href="/pt-BR/gateway/cli-backends" icon="terminal">
    Configuração do backend do Claude CLI e detalhes de tempo de execução.
  </Card>
  <Card title="Cache de prompts" href="/pt-BR/reference/prompt-caching" icon="database">
    Como o cache de prompts funciona entre provedores.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
