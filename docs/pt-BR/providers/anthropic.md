---
read_when:
    - Você deseja usar modelos da Anthropic no OpenClaw
    - Você quer navegar pelas sessões do Claude CLI ou do Claude Desktop em computadores emparelhados
summary: Use o Anthropic Claude por meio de chaves de API ou da CLI do Claude no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T12:50:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

A Anthropic desenvolve a família de modelos **Claude**. O OpenClaw oferece suporte a duas formas de autenticação:

- **Chave de API** - acesso direto à API da Anthropic com cobrança baseada no uso (modelos `anthropic/*`)
- **Claude CLI** - reutiliza um login existente do Claude Code no mesmo host

## Rastreamento de uso e custos

O OpenClaw detecta a credencial disponível da Anthropic e seleciona a interface de uso correspondente:

- As credenciais de assinatura/configuração do Claude mostram janelas de cota e um orçamento opcional para uso adicional.
- `ANTHROPIC_ADMIN_KEY` ou `ANTHROPIC_ADMIN_API_KEY` mostra 30 dias de custos da organização e uso da API Messages informados pelo provedor em **Usage** na Control UI, incluindo gastos diários, totais de tokens/cache, principais modelos e categorias de custos.
- Uma credencial `sk-ant-admin...` armazenada no perfil do provedor Anthropic é detectada automaticamente como uma chave da Admin API.

O histórico de custos da Admin API vem da [API de uso e custos](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) da Anthropic. Trata-se da cobrança real do provedor, separada do custo estimado pelo OpenClaw com base nas sessões.

<Warning>
O backend Claude CLI do OpenClaw executa a CLI instalada do Claude Code no
modo de impressão não interativo (`claude -p`). A documentação atual do Claude Code da Anthropic
descreve esse modo como uso programático/do Agent SDK. A atualização de suporte da Anthropic de 15 de junho de 2026
suspendeu a alteração anunciada de cobrança separada do Agent SDK: o Claude
Agent SDK, `claude -p` e o uso de aplicativos de terceiros ainda consomem os limites de uso
da assinatura conectada, e o crédito mensal do Agent SDK anunciado anteriormente
não está disponível enquanto a Anthropic revisa esse plano.

O Claude Code interativo ainda consome os limites do plano Claude conectado.
A autenticação por chave de API usa cobrança direta conforme o uso e não depende desse plano.
Para hosts de Gateway de longa duração, automação compartilhada e gastos de produção
previsíveis, use uma chave de API da Anthropic.

Os artigos de suporte atuais da Anthropic podem alterar esse comportamento sem uma
versão do OpenClaw:

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
      <Step title="Execute a integração inicial">
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
    **Ideal para:** reutilizar um login existente da Claude CLI sem uma chave de API separada.

    <Steps>
      <Step title="Verifique se a Claude CLI está instalada e conectada">
        Verifique com:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Execute a integração inicial">
        ```bash
        openclaw onboard
        # escolha: Claude CLI
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
    Os detalhes de configuração e execução do backend Claude CLI estão em [Backends de CLI](/pt-BR/gateway/cli-backends).
    </Note>

    <Warning>
    A reutilização da Claude CLI exige que o processo do OpenClaw seja executado no mesmo host que o
    login da Claude CLI. Instalações com Docker podem manter o diretório inicial de um contêiner e fazer login no
    Claude Code dentro dele; consulte
    [Backend Claude CLI no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).
    Outras instalações em contêiner, como o [Podman](/pt-BR/install/podman), não montam o
    `~/.claude` do host na configuração nem na execução; nesse caso, use uma chave de API da Anthropic ou escolha
    um provedor com OAuth gerenciado pelo OpenClaw, como o
    [OpenAI Codex](/pt-BR/providers/openai).
    </Warning>

    ### Obter um token de configuração

    Execute `claude setup-token` em qualquer máquina com o Claude Code instalado. Ele imprime
    um token de longa duração que começa com `sk-ant-oat01-`.

    Durante a integração inicial, cole o token no aplicativo para macOS escolhendo
    **Anthropic setup-token** em **Connect with an API key or token**, ou use:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Exemplo de configuração

    Prefira a referência canônica do modelo Anthropic com uma substituição do runtime da CLI:

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

    As referências de modelo legadas `claude-cli/claude-opus-4-7` ainda funcionam para
    compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo como
    `anthropic/*` e colocar o backend de execução na política de runtime do provedor/modelo.

    ### Cobrança e `claude -p`

    O OpenClaw usa o caminho não interativo `claude -p` do Claude Code nas execuções da Claude CLI.
    Atualmente, a Anthropic trata esse caminho como uso programático/do Agent SDK:

    - A atualização de suporte da Anthropic de 15 de junho de 2026 suspendeu o plano de créditos
      separados do Agent SDK anunciado anteriormente.
    - O uso do Claude Agent SDK, de `claude -p` e de aplicativos de terceiros pelo plano de assinatura
      ainda consome os limites de uso da assinatura conectada.
    - O crédito mensal do Agent SDK anunciado anteriormente não está disponível enquanto
      a Anthropic revisa esse plano.
    - Logins pelo Console/com chave de API usam cobrança de API conforme o uso e não recebem
      o crédito do Agent SDK da assinatura.

    Consulte o [artigo sobre o plano do Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    da Anthropic para ver o aviso de suspensão e os artigos sobre os planos do Claude Code para consultar o comportamento das assinaturas
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    e
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    A Anthropic pode alterar o comportamento de cobrança e limitação de taxa do Claude Code sem uma
    versão do OpenClaw. Verifique `claude auth status`, `/status` e
    a documentação vinculada da Anthropic quando a previsibilidade da cobrança for importante.

    <Tip>
    Para automação de produção compartilhada, use uma chave de API da Anthropic em vez da
    Claude CLI. O OpenClaw também oferece opções no estilo de assinatura da
    [OpenAI Codex](/pt-BR/providers/openai), [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax) e [Z.AI / GLM](/pt-BR/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sessões do Claude entre computadores

O plugin Anthropic incluído adiciona um grupo **Claude Code** à barra lateral normal de sessões.
As linhas são abertas no painel normal de Chat. Ele descobre sessões não arquivadas do Claude
Code no Gateway e nos hosts Node conectados:

- As sessões da Claude CLI vêm de registros válidos do índice de projetos e de arquivos JSONL
  atuais cujo prefixo limitado de metadados identifica uma sessão `sdk-cli`
  que não seja sidechain em `~/.claude/projects/`.
- As sessões do Claude Desktop usam o título do Desktop, o horário da atividade e o
  estado de arquivamento quando os metadados apontam para o mesmo ID de sessão do Claude Code.
- Uma sessão exclusiva da CLI não tem sinalizador de arquivamento, portanto permanece visível enquanto sua
  transcrição estiver presente.

Nenhuma configuração adicional do OpenClaw é necessária para a descoberta. O plugin Anthropic
está incluído e ativado por padrão; um Node nativo do macOS anuncia os comandos somente leitura
de sessões do Claude quando o diretório local `~/.claude/projects/` existe.
Aprove a atualização do pareamento do Node quando esses comandos aparecerem pela primeira vez.

A barra lateral agrupa as linhas pelo Gateway ou host de Node pareado correspondente, começa com a
página limitada mais recente de cada host e é atualizada na cadência normal de 30 segundos.
Use **Carregar mais sessões** abaixo de um grupo de catálogo para adicionar a próxima página
de cada host que tenha mais histórico; as linhas adicionadas permanecem visíveis e são
buscadas novamente até a mesma profundidade durante as atualizações. Os clientes do catálogo usam
`sessions.catalog.list`; a abertura de uma linha usa `sessions.catalog.read`.

A tomada de controle do terminal resolve `claude` pelo PATH do shell de login
do usuário do host proprietário antes do PATH do serviço/daemon. Isso mantém as sessões iniciadas pelo aplicativo alinhadas
com a Claude CLI que o operador obtém em um terminal normal.

Ao selecionar uma linha, a página mais recente da transcrição é lida primeiro. **Carregar itens mais antigos da transcrição**
segue um cursor de bytes opaco e lê outra seção limitada do
arquivo JSONL, em vez de carregar todo o histórico. O conteúdo normal de usuário, assistente,
raciocínio, chamada de ferramenta e resultado de ferramenta é preservado. Um item individual
maior que o limite máximo de segurança do Node/Gateway é claramente marcado como truncado.

Para uma linha `claude-cli` local do Gateway, digitar no compositor normal chama
`sessions.catalog.continue`. O OpenClaw resolve novamente o registro local do catálogo,
cria ou reutiliza uma sessão nativa vinculada ao modelo, importa no máximo 200 itens visíveis
ou 512 KiB e inicializa a vinculação da Claude CLI. O primeiro turno é retomado com
`--fork-session`; o Claude atribui um novo ID de sessão à bifurcação, portanto os turnos posteriores usam
a bifurcação, e a sessão de origem permanece intacta.

Um host Node sem interface gráfica também pode permitir a continuação de suas linhas da Claude CLI ativando
a configuração local do Node abaixo e reiniciando o host Node:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

O Node anuncia `agent.cli.claude.run.v1` somente quando a configuração está ativada
e seu executável local `claude` é resolvido. O OpenClaw resolve novamente o registro do catálogo
nesse Node, importa o mesmo histórico limitado e vincula a sessão adotada
ao Node e ao diretório de trabalho informado pelo catálogo. Cada turno executa o
processo real `claude -p` do Node usando os arquivos e o login do Claude desse Node. A
política de aprovação de execução do Node continua aplicável; o Gateway não pode forçar a adesão.

A continuação em Node v1 é somente de uso único. Ela omite a configuração MCP de loopback do Gateway e
os argumentos do plugin de Skills do Gateway, não reinicializa a partir de uma transcrição do Gateway e
rejeita anexos e imagens. As linhas do Claude Desktop permanecem somente para visualização. Nodes
de aplicativos nativos do macOS também permanecem somente para visualização até que o aplicativo anuncie o comando de execução.

<Note>
As sessões do Claude em Nodes pareados permanecem somente leitura, a menos que o Node sem interface gráfica anuncie explicitamente
`agent.cli.claude.run.v1`. O OpenClaw nunca modifica os metadados do Claude Desktop
nem arquiva sessões do Claude. A página requer uma conexão de operador
com escopo de gravação porque usa `node.invoke` autenticado; a listagem e a leitura
permanecem somente leitura mesmo em um Node com continuação ativada.
</Note>

Consulte [Nodes: sessões e transcrições do Claude](/pt-BR/nodes#claude-sessions-and-transcripts)
para conhecer o comando do Node e o limite de segurança.

## Padrões de raciocínio (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 e 4.6)

`anthropic/claude-sonnet-5` usa pensamento adaptativo com esforço `high` por padrão.
Use `/think off` para desativar o pensamento ou `/think xhigh|max` para os níveis
mais altos de esforço nativo do modelo. O OpenClaw omite orçamentos manuais de pensamento,
parâmetros de amostragem personalizados, preenchimentos prévios do assistente e Priority Tier para o Sonnet 5 porque
a Anthropic não oferece suporte a esses recursos de solicitação neste modelo.
O catálogo usa os preços promocionais de entrada/saída `$2/$10` da Anthropic até
31 de agosto de 2026; os preços padrão `$3/$15` começam em 1º de setembro de 2026.

`anthropic/claude-fable-5` sempre usa pensamento adaptativo e adota o esforço `high`
por padrão. A Anthropic não permite desativar o pensamento neste modelo, portanto
`/think off` e `/think minimal` são mapeados para o esforço `low`. O OpenClaw também
omite valores de temperatura personalizados nas solicitações do Fable 5, pois a Anthropic rejeita
uma substituição de temperatura em qualquer solicitação com pensamento ativado.

`anthropic/claude-mythos-5` é um modelo de acesso limitado com o mesmo contrato de
pensamento adaptativo sempre ativo. O OpenClaw adota `high` por padrão, mapeia `/think off` e
`/think minimal` para `low` e omite parâmetros de amostragem selecionados pelo chamador.
O catálogo publica sua janela de contexto de 1.000.000 tokens, limite de saída
de 128.000 tokens, entrada de imagens e preços de entrada/saída `$10/$50`.

O Claude Opus 4.8 mantém o pensamento desativado por padrão no OpenClaw. Quando o pensamento
adaptativo é ativado explicitamente com `/think high|xhigh|max`, o OpenClaw envia
os valores de esforço do Opus 4.8 da Anthropic; os modelos Claude 4.6 (Opus 4.6 e Sonnet 4.6)
adotam `adaptive` por padrão.

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
- [Pensamento adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Pensamento estendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback para recusas de segurança (Claude Fable 5)

<Warning>
Usar o Claude Fable 5 também significa usar o Claude Opus 4.8. O Fable 5 inclui
classificadores de segurança que podem recusar uma solicitação, e a recuperação autorizada
pela Anthropic consiste em fazer com que `claude-opus-4-8` atenda essa interação. O OpenClaw adere a isso
automaticamente em solicitações diretas com chave de API, portanto algumas interações do Fable são respondidas
e cobradas como Claude Opus 4.8. Se sua política ou seu orçamento não puder aceitar
interações atendidas pelo Opus, não selecione `anthropic/claude-fable-5`.
</Warning>

### Por que isso existe

Os classificadores do Fable 5 retornam `stop_reason: "refusal"` em solicitações de domínios
restritos e também geram falsos positivos em trabalhos benignos relacionados (ferramentas
de segurança, ciências biológicas ou até mesmo ao pedir que o modelo reproduza seu
raciocínio bruto). Sem um fallback, a interação termina com um erro, embora
outro modelo Claude pudesse atendê-la sem problemas — a própria mensagem de recusa da Anthropic
instrui os integradores da API a configurar um modelo de fallback.

### Como funciona

1. Para cada solicitação direta com chave de API para `anthropic/claude-fable-5`, o OpenClaw
   envia a adesão ao fallback do lado do servidor da Anthropic: o cabeçalho beta
   `server-side-fallback-2026-06-01` mais
   `fallbacks: [{"model": "claude-opus-4-8"}]`. O Claude Opus 4.8 é o único
   destino de fallback permitido pela Anthropic para o Fable 5.
2. Somente uma recusa do classificador de segurança aciona o fallback. Limites de taxa,
   sobrecargas e erros do servidor se comportam exatamente como antes e passam pelo
   [failover de modelo](/pt-BR/concepts/model-failover) normal do OpenClaw.
3. O resgate ocorre dentro da mesma chamada. Uma recusa antes de qualquer saída é
   imperceptível, exceto pela latência; toda a resposta vem do Opus 4.8. Em uma
   recusa no meio do fluxo, o texto parcial é mantido como o prefixo a partir do qual o modelo
   de fallback continua, enquanto o raciocínio e as chamadas de ferramenta do modelo que recusou
   são descartados de acordo com as regras de repetição da Anthropic (eles não devem ser retornados nem
   executados).
4. Se o Claude Opus 4.8 também recusar, a interação apresenta a recusa como um
   erro, exatamente como antes deste recurso.

O fallback ocorre no nível da API da Anthropic, portanto `claude-opus-4-8` não
precisa estar na lista de modelos configurados nem na cadeia de fallback — uma chave de API
compatível com o Fable sempre pode atender o Opus.

### Observabilidade e cobrança

- Uma interação atendida por fallback registra um diagnóstico `provider_fallback` na
  mensagem do assistente, identificando `fromModel` e `toModel`, e o
  `responseModel` da mensagem informa `claude-opus-4-8`.
- A Anthropic cobra por tentativa: uma recusa antes da saída é gratuita, e o resgate
  é cobrado pelas tarifas do Claude Opus 4.8 (atualmente metade das tarifas do Fable 5). A estimativa
  de custo por interação do OpenClaw aplica as tarifas do Opus às interações atendidas por fallback para corresponder.
- Uma recusa no meio do fluxo cobra adicionalmente, por parte da Anthropic, o conteúdo parcial
  do Fable já transmitido; essa parte é informada no uso por tentativa
  da API, mas não é incluída na estimativa por interação do OpenClaw.

### Escopo

Aplica-se a `anthropic/claude-fable-5` com autenticação por chave de API em
`api.anthropic.com`. OAuth (reutilização da assinatura do Claude CLI), URLs-base de proxy,
solicitações do Bedrock, Vertex e Foundry permanecem inalteradas e ainda apresentam
as recusas como erros nesses casos.

Verificado ao vivo: um prompt benigno que pede ao Fable 5 para reproduzir sua cadeia
de pensamento bruta é recusado com `category: "reasoning_extraction"` quando enviado sem
fallbacks, e o mesmo prompt por meio do OpenClaw retorna uma resposta normal atendida pelo Opus
com o diagnóstico `provider_fallback` anexado.

Consulte o [guia de recusas e fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
da Anthropic para conhecer o comportamento subjacente.

## Cache de prompts

O OpenClaw oferece suporte ao recurso de cache de prompts da Anthropic para autenticação por chave de API.

| Valor               | Duração do cache | Descrição                                      |
| ------------------- | ---------------- | ---------------------------------------------- |
| `"short"` (padrão) | 5 minutos        | Aplicado automaticamente à autenticação por chave de API |
| `"long"`            | 1 hora           | Cache estendido                                |
| `"none"`            | Sem cache        | Desativar o cache de prompts                   |

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
    Use os parâmetros no nível do modelo como referência e substitua-os para agentes específicos por meio de `agents.list[].params`:

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

  <Accordion title="Observações sobre o Claude no Bedrock">
    - Os modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam o repasse de `cacheRetention` quando configurado.
    - Modelos Bedrock que não são da Anthropic são forçados a `cacheRetention: "none"` em tempo de execução.
    - Os padrões inteligentes da chave de API também preenchem `cacheRetention: "short"` para referências do Claude no Bedrock quando nenhum valor explícito é definido.

  </Accordion>
</AccordionGroup>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo rápido">
    A opção compartilhada `/fast` do OpenClaw define o campo `service_tier` da Anthropic como `api.anthropic.com` para tráfego direto com chave de API.

    | Comando | Corresponde a |
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
    - Aplica-se somente a solicitações diretas de `api.anthropic.com` feitas com uma chave de API. Solicitações com OAuth/token de assinatura e rotas de proxy nunca recebem um campo `service_tier`.
    - Os parâmetros explícitos `serviceTier` ou `service_tier` substituem `/fast` quando ambos estão definidos.
    - Em contas sem capacidade do Priority Tier, `service_tier: "auto"` pode ser resolvido como `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compreensão de mídia (imagem e PDF)">
    O Plugin Anthropic incluído registra a compreensão de imagens e PDFs. O OpenClaw
    resolve automaticamente os recursos de mídia com base na autenticação Anthropic configurada; nenhuma
    configuração adicional é necessária.

    | Propriedade       | Valor                 |
    | --------------- | --------------------- |
    | Modelo padrão   | `claude-opus-4-8`     |
    | Entrada compatível | Imagens, documentos PDF |

    Quando uma imagem ou um PDF é anexado a uma conversa, o OpenClaw automaticamente
    o encaminha pelo provedor de compreensão de mídia da Anthropic.

  </Accordion>

  <Accordion title="Janela de contexto de 1M">
    Claude Sonnet 5, Mythos 5 e Fable 5 têm uma janela de entrada exata de
    1.000.000 tokens e são compatíveis com até 128.000 tokens de saída. A janela de
    contexto de 1M da Anthropic também está disponível de forma geral nos modelos Claude 4.x com raciocínio adaptativo: Opus 4.8,
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

    Configurações mais antigas podem manter `params.context1m: true`; ele é uma operação inócua sem efeito para
    esses modelos, e o OpenClaw não envia mais o cabeçalho beta descontinuado
    `context-1m-2025-08-07`, independentemente disso. Entradas de configuração `anthropicBeta` mais antigas
    com esse valor são descartadas durante a resolução dos cabeçalhos da solicitação, e
    modelos Claude mais antigos sem compatibilidade permanecem em sua janela de contexto normal.

    `params.context1m: true` funciona da mesma forma para o backend da CLI do Claude
    (`claude-cli/*`): modelos Opus e Sonnet qualificados e com disponibilidade geral já recebem
    automaticamente a janela de 1M, portanto o parâmetro também é opcional nesse caso.

    <Warning>
    Requer acesso a contexto longo na credencial da Anthropic. A autenticação por OAuth/token de assinatura mantém os cabeçalhos beta obrigatórios da Anthropic, mas o OpenClaw remove o cabeçalho beta descontinuado de 1M caso ele permaneça em configurações mais antigas.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M do Claude Opus 4.8">
    `anthropic/claude-opus-4-8` e sua variante `claude-cli` têm uma janela de contexto
    de 1M por padrão; não é necessário `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros 401/token repentinamente inválido">
    A autenticação por token da Anthropic expira e pode ser revogada. Para novas configurações, use uma chave de API da Anthropic.
  </Accordion>

  <Accordion title='Nenhuma chave de API encontrada para o provedor "anthropic"'>
    A autenticação da Anthropic é **por agente**; novos agentes não herdam as chaves do agente principal. Execute novamente a integração para esse agente (ou configure uma chave de API no host do Gateway) e verifique com `openclaw models status`.
  </Accordion>

  <Accordion title='Nenhuma credencial encontrada para o perfil "anthropic:default"'>
    Execute `openclaw models status` para ver qual perfil de autenticação está ativo. Execute novamente a integração ou configure uma chave de API para o caminho desse perfil.
  </Accordion>

  <Accordion title="Nenhum perfil de autenticação disponível (todos em espera)">
    Verifique `openclaw models status --json` para `auth.unusableProfiles`. Os períodos de espera por limite de taxa da Anthropic podem ser específicos do modelo, portanto, outro modelo da Anthropic ainda pode estar disponível. Adicione outro perfil da Anthropic ou aguarde o fim do período de espera.
  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Backends de CLI" href="/pt-BR/gateway/cli-backends" icon="terminal">
    Configuração do backend da CLI do Claude e detalhes de execução.
  </Card>
  <Card title="Cache de prompts" href="/pt-BR/reference/prompt-caching" icon="database">
    Como o cache de prompts funciona entre os provedores.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
