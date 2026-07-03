---
read_when:
    - Você quer usar o harness do servidor de aplicativo Codex incluído
    - Você precisa de exemplos de configuração do harness Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrerem ao OpenClaw
summary: Execute turnos do agente incorporado do OpenClaw pelo harness app-server do Codex incluído
title: harness do Codex
x-i18n:
    generated_at: "2026-07-03T13:21:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

O plugin `codex` incluído permite que o OpenClaw execute turnos de agente OpenAI incorporados
por meio do app-server do Codex em vez do harness integrado do OpenClaw.

Use o harness do Codex quando você quiser que o Codex controle a sessão de agente de baixo nível:
retomada nativa de thread, continuação nativa de ferramenta, compaction nativa e
execução no app-server. O OpenClaw ainda controla canais de chat, arquivos de sessão, seleção de modelo,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e o espelho visível
da transcrição.

A configuração normal usa refs canônicas de modelo OpenAI, como `openai/gpt-5.5`.
Não configure refs GPT legadas do Codex. Coloque a ordem de autenticação de agente OpenAI
em `auth.order.openai`; ids de perfil de autenticação legados do Codex mais antigos e
entradas legadas de ordem de autenticação do Codex são estado legado reparado por
`openclaw doctor --fix`.

Quando nenhum sandbox do OpenClaw está ativo, o OpenClaw inicia threads do app-server do Codex
com o modo de código nativo do Codex ativado, mantendo code-mode-only desativado por padrão.
Isso mantém o workspace nativo e as capacidades de código do Codex disponíveis enquanto
as ferramentas dinâmicas do OpenClaw continuam por meio da ponte `item/tool/call` do app-server.
Sandboxing ativo do OpenClaw e políticas restritas de ferramentas desativam o modo de código nativo
inteiramente, a menos que você opte pelo caminho experimental do exec-server de sandbox.

Este recurso nativo do Codex é separado do
[modo de código do OpenClaw](/pt-BR/reference/code-mode), que é um runtime QuickJS-WASI opcional
para execuções genéricas do OpenClaw com um formato de entrada `exec` diferente.

Para a divisão mais ampla entre modelo/provedor/runtime, comece por
[Runtime de agentes](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a ref de modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Requisitos

- OpenClaw com o plugin `codex` incluído disponível.
- Se sua configuração usa `plugins.allow`, inclua `codex`.
- App-server do Codex `0.125.0` ou mais recente. O plugin incluído gerencia um binário
  compatível do app-server do Codex por padrão, portanto comandos `codex` locais em `PATH` não
  afetam a inicialização normal do harness.
- Autenticação do Codex disponível por meio de `openclaw models auth login --provider openai`,
  uma conta de app-server na home do Codex do agente ou um perfil explícito de autenticação
  por chave de API do Codex.

Para precedência de autenticação, isolamento de ambiente, comandos personalizados de app-server, descoberta de modelos
e todos os campos de configuração, consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

A maioria dos usuários que quer Codex no OpenClaw quer este caminho: entrar com uma
assinatura ChatGPT/Codex, ativar o plugin `codex` incluído e usar uma
ref canônica de modelo `openai/gpt-*`.

Entre com OAuth do Codex:

```bash
openclaw models auth login --provider openai
```

Ative o plugin `codex` incluído e selecione um modelo de agente OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Se sua configuração usa `plugins.allow`, adicione `codex` lá também:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Reinicie o gateway depois de alterar a configuração de plugins. Se um chat existente já
tem uma sessão, use `/new` ou `/reset` antes de testar mudanças de runtime para que o próximo
turno resolva o harness a partir da configuração atual.

## Configuração

A configuração de início rápido é a configuração mínima viável do harness do Codex. Defina as opções do
harness do Codex na configuração do OpenClaw e use a CLI apenas para autenticação do Codex:

| Necessidade                            | Defina                                                                           | Onde                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Ativar o harness                       | `plugins.entries.codex.enabled: true`                                            | Configuração do OpenClaw           |
| Manter uma instalação de plugin na allowlist | Inclua `codex` em `plugins.allow`                                                | Configuração do OpenClaw           |
| Rotear turnos de agente OpenAI pelo Codex | `agents.defaults.model` ou `agents.list[].model` como `openai/gpt-*`             | Configuração de agente do OpenClaw |
| Entrar com OAuth do ChatGPT/Codex      | `openclaw models auth login --provider openai`                                   | Perfil de autenticação da CLI      |
| Adicionar backup por chave de API para execuções do Codex | Perfil de chave de API `openai:*` listado após a autenticação por assinatura em `auth.order.openai` | Perfil de autenticação da CLI + configuração do OpenClaw |
| Falhar fechado quando o Codex estiver indisponível | `agentRuntime.id: "codex"` do provedor ou modelo                                 | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API OpenAI      | `agentRuntime.id: "openclaw"` do provedor ou modelo com autenticação normal da OpenAI | Configuração de modelo/provedor do OpenClaw |
| Ajustar comportamento do app-server    | `plugins.entries.codex.config.appServer.*`                                       | Configuração do plugin Codex       |
| Ativar apps nativos de plugin do Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuração do plugin Codex       |
| Ativar Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | Configuração do plugin Codex       |

Use refs de modelo `openai/gpt-*` para turnos de agente OpenAI com backend do Codex. Prefira
`auth.order.openai` para ordenação assinatura-primeiro/backup-por-chave-de-API. Ids de perfil
de autenticação legados do Codex existentes e ordem de autenticação legada do Codex são
estado legado exclusivo do doctor; não escreva novas refs GPT legadas do Codex.

Não defina `compaction.model` nem `compaction.provider` em agentes com backend do Codex.
O Codex compacta por meio do estado nativo de thread do app-server, então o OpenClaw ignora
essas substituições de sumarizador local em runtime e `openclaw doctor --fix` as remove
quando o agente usa o Codex.

Lossless continua com suporte como mecanismo de contexto para montagem, ingestão e
manutenção ao redor de turnos do Codex. Configure-o por meio de
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, não por meio de
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra o formato antigo
`compaction.provider: "lossless-claw"` para o slot de mecanismo de contexto Lossless
quando Codex é o runtime ativo, mas o Codex nativo ainda controla a compaction.

O harness nativo do app-server do Codex oferece suporte a mecanismos de contexto que exigem
montagem antes do prompt. Backends genéricos de CLI, incluindo `codex-cli`, não fornecem
essa capacidade de host.

Para agentes com backend do Codex, `/compact` inicia a compaction nativa do app-server do Codex na
thread vinculada. O OpenClaw não espera a conclusão, não impõe um timeout do OpenClaw,
não reinicia o app-server compartilhado nem recorre a um mecanismo de contexto ou
sumarizador público da OpenAI. Se a vinculação nativa de thread do Codex estiver ausente ou
obsoleta, o comando falha fechado para que o operador veja o limite real de runtime
em vez de trocar silenciosamente de backend de compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Nesse formato, ambos os perfis ainda passam pelo Codex para turnos de agente
`openai/gpt-*`. A chave de API é apenas um fallback de autenticação, não uma solicitação para alternar para OpenClaw ou
OpenAI Responses puro.

O restante desta página cobre variantes comuns entre as quais os usuários devem escolher:
formato de implantação, roteamento fail-closed, política de aprovação de guardião, plugins nativos do Codex
e Computer Use. Para listas completas de opções, padrões, enums, descoberta,
isolamento de ambiente, timeouts e campos de transporte do app-server, consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Verificar runtime do Codex

Use `/status` no chat onde você espera o Codex. Um turno de agente OpenAI
com backend do Codex mostra:

```text
Runtime: OpenAI Codex
```

Então verifique o estado do app-server do Codex:

```text
/codex status
/codex models
```

`/codex status` relata conectividade do app-server, conta, limites de taxa, servidores MCP
e skills. `/codex models` lista o catálogo ativo do app-server do Codex para
o harness e a conta. Se `/status` for surpreendente, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha refs de provedor e política de runtime separadas:

- Use `openai/gpt-*` para turnos de agente OpenAI pelo Codex.
- Não use refs GPT legadas do Codex na configuração. Execute `openclaw doctor --fix` para
  reparar refs legadas e pins obsoletos de rota de sessão.
- `agentRuntime.id: "codex"` é opcional para o modo automático normal da OpenAI, mas útil
  quando uma implantação deve falhar fechado se o Codex estiver indisponível.
- `agentRuntime.id: "openclaw"` coloca um provedor ou modelo no runtime
  incorporado do OpenClaw quando isso é intencional.
- `/codex ...` controla conversas nativas do app-server do Codex pelo chat.
- ACP/acpx é um caminho de harness externo separado. Use-o apenas quando o usuário pedir
  ACP/acpx ou um adaptador de harness externo.

Roteamento de comandos comum:

| Intenção do usuário                                  | Use                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Anexar o chat atual                                  | `/codex bind [--cwd <path>]`                                                                          |
| Retomar uma thread existente do Codex                | `/codex resume <thread-id>`                                                                           |
| Listar ou filtrar threads do Codex                   | `/codex threads [filter]`                                                                             |
| Listar plugins nativos do Codex                      | `/codex plugins list`                                                                                 |
| Ativar ou desativar um plugin nativo do Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Anexar uma sessão existente da CLI do Codex em um nó pareado | `/codex sessions --host <node> [filter]`, depois `/codex resume <session-id> --host <node> --bind here` |
| Enviar apenas feedback do Codex                      | `/codex diagnostics [note]`                                                                           |
| Iniciar uma tarefa ACP/acpx                          | Comandos de sessão ACP/acpx, não `/codex`                                                             |

| Caso de uso                                          | Configurar                                                             | Verificar                               | Observações                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*` mais Plugin `codex` habilitado                          | `/status` mostra `Runtime: OpenAI Codex` | Caminho recomendado                   |
| Falhar fechado se o Codex estiver indisponível       | Provider ou model `agentRuntime.id: "codex"`                           | O turno falha em vez do fallback embutido | Use para implantações somente Codex   |
| Tráfego direto com chave de API da OpenAI pelo OpenClaw | Provider ou model `agentRuntime.id: "openclaw"` e autenticação OpenAI normal | `/status` mostra runtime OpenClaw       | Use somente quando OpenClaw for intencional |
| Configuração legada                                  | refs legadas de GPT do Codex                                           | `openclaw doctor --fix` a reescreve     | Não escreva nova configuração assim   |
| Adaptador ACP/acpx do Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                               | Status da tarefa/sessão ACP             | Separado do harness nativo do Codex   |

`agents.defaults.imageModel` segue a mesma divisão por prefixo. Use `openai/gpt-*`
para a rota OpenAI normal e `codex/gpt-*` somente quando o entendimento de imagem
deve passar por um turno limitado do app-server do Codex. Não use
refs legadas de GPT do Codex; o doctor reescreve esse prefixo legado para `openai/gpt-*`.

## Padrões de implantação

### Implantação básica do Codex

Use a configuração do quickstart quando todos os turnos de agente OpenAI devem usar Codex por
padrão.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### Implantação com providers mistos

Este formato mantém Claude como o agente padrão e adiciona um agente Codex nomeado:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

Com esta configuração, o agente `main` usa seu caminho normal de provider e o
agente `codex` usa o app-server do Codex.

### Implantação Codex com falha fechada

Para turnos de agente OpenAI, `openai/gpt-*` já resolve para Codex quando o
Plugin incluído está disponível. Adicione uma política explícita de runtime quando quiser uma regra escrita
de falha fechada:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Com Codex forçado, OpenClaw falha cedo se o Plugin do Codex estiver desabilitado, o
app-server for antigo demais ou o app-server não conseguir iniciar.

## Política de app-server

Por padrão, o Plugin inicia localmente o binário gerenciado do Codex do OpenClaw com transporte
stdio. Defina `appServer.command` somente quando quiser executar intencionalmente um
executável diferente. Use transporte WebSocket somente quando um app-server já
estiver em execução em outro lugar:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Sessões locais de app-server stdio usam por padrão a postura de operador local confiável:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem essa
postura YOLO implícita, OpenClaw seleciona permissões de guardian permitidas em vez disso.
Quando um sandbox do OpenClaw está ativo para a sessão, OpenClaw desabilita o
Code Mode nativo do Codex, servidores MCP do usuário e execução de Plugin baseada em app para esse
turno, em vez de depender do sandboxing do lado do host Codex. O acesso ao shell é exposto
por meio de ferramentas dinâmicas apoiadas pelo sandbox do OpenClaw, como `sandbox_exec` e
`sandbox_process`, quando as ferramentas normais de exec/process estão disponíveis.

Use o modo exec normalizado do OpenClaw quando quiser auto-review nativo do Codex antes de
escapes do sandbox ou permissões extras:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Para sessões de app-server Codex, OpenClaw mapeia `tools.exec.mode: "auto"` para aprovações
revisadas pelo Guardian do Codex, geralmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando os requisitos locais permitem esses valores.
Em `tools.exec.mode: "auto"`, OpenClaw não preserva sobrescritas legadas inseguras do Codex
`approvalPolicy: "never"` ou `sandbox: "danger-full-access"`; use
`tools.exec.mode: "full"` para uma postura Codex intencional sem aprovação. O
preset legado `plugins.entries.codex.config.appServer.mode: "guardian"` ainda
funciona, mas `tools.exec.mode: "auto"` é a superfície normalizada do OpenClaw.

Para a comparação em nível de modo com aprovações de exec do host e permissões ACPX,
consulte [Modos de permissão](/pt-BR/tools/permission-modes).

Para todos os campos de app-server, ordem de autenticação, isolamento de ambiente, descoberta e
comportamento de timeout, consulte [Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Comandos e diagnósticos

O Plugin incluído registra `/codex` como um comando slash em qualquer canal que
ofereça suporte a comandos de texto do OpenClaw.

Execução e controle nativos exigem um proprietário ou um cliente Gateway `operator.admin`.
Isso inclui vincular ou retomar threads, enviar ou parar turnos,
alterar modelo, modo rápido ou estado de permissão, compactar ou revisar e
desanexar um vínculo. Outros remetentes autorizados mantêm comandos somente leitura de status,
ajuda, conta, modelo, thread, servidor MCP, skill e inspeção de vínculo.

Formas comuns:

- `/codex status` verifica conectividade do app-server, modelos, conta, limites de taxa,
  servidores MCP e skills.
- `/codex models` lista modelos ativos do app-server Codex.
- `/codex threads [filter]` lista threads recentes do app-server Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma
  thread Codex existente.
- `/codex compact` pede ao app-server Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pede confirmação antes de enviar feedback do Codex para a
  thread anexada.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server Codex.
- `/codex skills` lista skills do app-server Codex.

Para a maioria dos relatórios de suporte, comece com `/diagnostics [note]` na conversa
em que o bug aconteceu. Ele cria um relatório de diagnósticos do Gateway e, para sessões de
harness Codex, pede aprovação para enviar o pacote de feedback Codex relevante.
Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o modelo de privacidade e o comportamento
em chat de grupo.

Use `/codex diagnostics [note]` somente quando quiser especificamente o upload de feedback do Codex
para a thread anexada no momento, sem o pacote completo de diagnósticos do Gateway.

### Inspecionar threads Codex localmente

A maneira mais rápida de inspecionar uma execução Codex ruim costuma ser abrir a thread nativa do Codex
diretamente:

```bash
codex resume <thread-id>
```

Obtenha o id da thread pela resposta concluída de `/diagnostics`, `/codex binding` ou
`/codex threads [filter]`.

Para a mecânica de upload e limites de diagnóstico em nível de runtime, consulte
[Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

A autenticação é selecionada nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, preferencialmente em
   `auth.order.openai`. Execute `openclaw doctor --fix` para migrar ids de perfil de autenticação
   Codex legados mais antigos e a ordem de autenticação Codex legada.
2. A conta existente do app-server no home Codex desse agente.
3. Somente para inicializações locais de app-server stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de app-server estiver presente e a autenticação OpenAI
   ainda for necessária.

Quando OpenClaw vê um perfil de autenticação Codex no estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex gerado. Isso
mantém as chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do app-server Codex cobrarem pela API por acidente.
Perfis Codex explícitos com chave de API e fallback local stdio por chave de ambiente usam login do app-server
em vez de env herdado do processo filho. Conexões WebSocket de app-server
não recebem fallback de chave de API de env do Gateway; use um perfil de autenticação explícito ou a
própria conta do app-server remoto.
Quando plugins nativos do Codex são configurados, OpenClaw instala ou atualiza esses
plugins pelo app-server conectado antes de expor apps pertencentes a Plugins à
thread Codex. `app/list` continua sendo a fonte da verdade para ids de app,
acessibilidade e metadados, mas OpenClaw controla a decisão de habilitação por thread:
se a política permitir um app acessível listado, OpenClaw envia
`thread/start.config.apps[appId].enabled = true` mesmo quando `app/list` atualmente
relata que esse app está desabilitado. Este caminho não inventa instalação de app para
ids desconhecidos; OpenClaw apenas ativa plugins de marketplace com `plugin/install`
e então atualiza o inventário.

Se um perfil de assinatura atingir um limite de uso do Codex, OpenClaw registra o horário de redefinição
quando o Codex informa um e tenta o próximo perfil de autenticação ordenado para a mesma
execução Codex. Quando o horário de redefinição passa, o perfil de assinatura volta a ficar elegível
sem alterar o modelo `openai/gpt-*` selecionado ou o runtime Codex.

Para inicializações locais de app-server stdio, OpenClaw define `CODEX_HOME` como um diretório por agente
para que a configuração Codex, arquivos de autenticação/conta, cache/dados de Plugins e estado nativo
de thread não leiam nem gravem no `~/.codex` pessoal do operador por
padrão. OpenClaw preserva o `HOME` normal do processo; subprocessos executados pelo Codex
ainda podem encontrar configuração e tokens do home do usuário, e o Codex pode descobrir entradas compartilhadas de
`$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`.

Se uma implantação precisar de isolamento adicional de ambiente, adicione essas variáveis a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` afeta somente o processo filho do app-server Codex gerado.
OpenClaw remove `CODEX_HOME` e `HOME` desta lista durante a normalização da inicialização local:
`CODEX_HOME` permanece por agente, e `HOME` continua herdado para que
subprocessos possam usar o estado normal do home do usuário.

As ferramentas dinâmicas do Codex usam carregamento `searchable` por padrão. O OpenClaw não expõe
ferramentas dinâmicas que dupliquem operações de workspace nativas do Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. A maioria das demais
ferramentas de integração do OpenClaw, como mensagens, mídia, cron, navegador, nós,
gateway e `heartbeat_respond`, está disponível pela busca de ferramentas do Codex sob
o namespace `openclaw`, mantendo o contexto inicial do modelo menor. A busca na Web
usa a ferramenta hospedada `web_search` do Codex por padrão quando a busca está ativada e nenhum
provedor gerenciado é selecionado. A busca hospedada nativa e a ferramenta dinâmica
`web_search` gerenciada do OpenClaw são mutuamente exclusivas, para que a busca gerenciada não possa contornar
restrições nativas de domínio. O OpenClaw usa a ferramenta gerenciada quando a busca hospedada está
indisponível, explicitamente desativada ou substituída por um provedor gerenciado selecionado.
O OpenClaw mantém a extensão independente `web.run` do Codex desativada porque
o tráfego de app-server de produção rejeita seu namespace `web` definido pelo usuário.
`tools.web.search.enabled: false` desativa ambos os caminhos, assim como execuções
somente LLM com ferramentas desativadas. O Codex trata `"cached"` como uma preferência e a resolve para acesso
externo ao vivo em turnos irrestritos de app-server. O fallback gerenciado automático
falha fechado quando `allowedDomains` nativos estão definidos, para que a lista de permissões não possa ser
contornada. Alterações persistentes na política efetiva de busca rotacionam a thread do Codex
vinculada antes do próximo turno. Restrições transitórias por turno usam uma thread temporária
restrita e preservam a vinculação existente para retomada posterior.
`sessions_yield` e respostas de origem somente de ferramenta de mensagem permanecem diretas porque
esses são contratos de controle de turno. `sessions_spawn` permanece pesquisável para que o
`spawn_agent` nativo do Codex continue sendo a principal superfície de subagente do Codex, enquanto a delegação
explícita do OpenClaw ou ACP ainda fica disponível pelo namespace de ferramenta dinâmica
`openclaw`. As instruções de colaboração de Heartbeat dizem ao Codex para buscar
`heartbeat_respond` antes de encerrar um turno de Heartbeat quando a ferramenta ainda não estiver
carregada.

Defina `codexDynamicToolsLoading: "direct"` somente ao se conectar a um app-server personalizado do Codex
que não consiga buscar ferramentas dinâmicas adiadas ou ao depurar o payload completo de
ferramentas.

Campos de Plugin do Codex de nível superior compatíveis:

| Campo                      | Padrão        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos de app-server do Codex.              |
| `codexPlugins`             | desativado       | Suporte nativo a plugins/apps do Codex para plugins curados migrados instalados a partir do código-fonte.           |

Campos `appServer` compatíveis:

| Campo                                         | Padrão                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | binário gerenciado do Codex                            | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                                                                                                                                                               |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | não definido                                           | URL do app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                     |
| `authToken`                                   | não definido                                           | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket extras. Os valores dos cabeçalhos aceitam strings literais ou valores SecretInput, por exemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Nomes extras de variáveis de ambiente removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado. O OpenClaw mantém `CODEX_HOME` por agente e o `HOME` herdado para inicializações locais.                                                                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | Ativa a superfície de ferramentas somente do modo de código do Codex. As ferramentas dinâmicas do OpenClaw permanecem registradas no Codex para que chamadas `tools.*` aninhadas retornem pela ponte `item/tool/call` do app-server.                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | não definido                                           | Raiz remota do workspace do app-server Codex. Quando definido, o OpenClaw infere a raiz local do workspace a partir do workspace OpenClaw resolvido, preserva o sufixo do cwd atual sob essa raiz remota e envia apenas o cwd final do app-server ao Codex. Se o cwd estiver fora da raiz resolvida do workspace OpenClaw, o OpenClaw falha de forma fechada em vez de enviar um caminho local do gateway ao app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas de plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                   |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela silenciosa depois que o Codex aceita um turno ou depois de uma solicitação app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guarda de ociosidade de conclusão e progresso usada depois de uma transferência para ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente pós-ferramenta, conclusão bruta de raciocínio ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para cargas de trabalho confiáveis ou pesadas em que a síntese pós-ferramenta pode legitimamente permanecer silenciosa por mais tempo que o orçamento final de liberação do assistente. |
| `mode`                                        | `"yolo"`, a menos que os requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardião. Requisitos locais de stdio que omitem `danger-full-access`, aprovação `never` ou o revisor `user` tornam o padrão implícito guardião.                                                                                                                                                                                                   |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação de guardião permitida | Política de aprovação nativa do Codex enviada para início/retomada/turno da thread. Os padrões de guardião preferem `"on-request"` quando permitido.                                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox de guardião permitido | Modo sandbox nativo do Codex enviado para início/retomada da thread. Os padrões de guardião preferem `"workspace-write"` quando permitido; caso contrário, `"read-only"`. Quando um sandbox OpenClaw está ativo, turnos `danger-full-access` usam `workspace-write` do Codex com acesso à rede derivado da configuração de saída do sandbox OpenClaw.                                          |
| `approvalsReviewer`                           | `"user"` ou um revisor guardião permitido              | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido; caso contrário, `guardian_subagent` ou `user`. `guardian_subagent` permanece como um alias legado.                                                                                                                                                                                           |
| `serviceTier`                                 | não definido                                           | Camada de serviço opcional do app-server Codex. `"priority"` habilita roteamento de modo rápido, `"flex"` solicita processamento flex, `null` limpa a substituição e o legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                              |
| `networkProxy`                                | desabilitado                                           | Ativa a rede do perfil de permissões do Codex para comandos app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                                        |
| `experimental.sandboxExecServer`              | `false`                                                | Opção experimental de prévia que registra um ambiente Codex apoiado pelo sandbox do OpenClaw no app-server Codex 0.132.0 ou mais recente, para que a execução nativa do Codex possa rodar dentro do sandbox OpenClaw ativo.                                                                                                                                                                      |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do Codex.
Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração da thread do Codex para que o perfil de
permissão gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o
OpenClaw gera um nome de perfil resistente a colisões
`openclaw-network-<fingerprint>` a partir do corpo do perfil; use `profileName`
apenas quando um nome local estável for necessário.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Se o runtime normal do app-server seria `danger-full-access`, habilitar
`networkProxy` usa acesso ao sistema de arquivos em estilo workspace para o
perfil de permissão gerado. A aplicação de rede gerenciada pelo Codex é uma rede
em sandbox, portanto um perfil de acesso total não protegeria o tráfego de saída.
Entradas de domínio usam `allow` ou `deny`; entradas de socket Unix usam os
valores `allow` ou `none` do Codex.

As chamadas dinâmicas de ferramentas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: solicitações Codex `item/tool/call` usam um watchdog
do OpenClaw de 90 segundos por padrão. Um argumento positivo `timeoutMs` por chamada estende
ou encurta esse orçamento específico da ferramenta. A ferramenta `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando a chamada de ferramenta não
fornece seu próprio tempo limite, ou um padrão de geração de imagem de 120 segundos caso contrário.
A ferramenta `image` de compreensão de mídia usa
`tools.media.image.timeoutSeconds` ou seu padrão de mídia de 60 segundos. Para compreensão
de imagem, esse tempo limite se aplica à própria solicitação e não é
reduzido por trabalho de preparação anterior. Orçamentos dinâmicos de ferramentas são
limitados a 600000 ms. Em caso de tempo limite, o OpenClaw aborta o sinal da ferramenta
quando há suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que o turno
possa continuar, em vez de deixar a sessão em `processing`.
Esse watchdog é o orçamento dinâmico externo de `item/tool/call`; tempos limite de
solicitação específicos do provedor são executados dentro dessa chamada e mantêm sua própria semântica de tempo limite.

Depois que o Codex aceita um turno, e depois que o OpenClaw responde a uma solicitação
do servidor de app com escopo de turno, o harness espera que o Codex faça progresso no turno atual e
eventualmente finalize o turno nativo com `turn/completed`. Se o servidor de app
ficar silencioso por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw, em melhor esforço,
interrompe o turno do Codex, registra um tempo limite de diagnóstico e libera a
faixa de sessão do OpenClaw para que mensagens de chat de acompanhamento não fiquem enfileiradas atrás de um
turno nativo obsoleto. A maioria das notificações não terminais para o mesmo turno desarma esse
watchdog curto porque o Codex comprovou que o turno ainda está vivo. Passagens de ferramenta usam um
orçamento ocioso pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta
`item/tool/call`, depois que itens de ferramenta nativos como `commandExecution` concluem, depois de conclusões brutas
`custom_tool_call_output`, e depois de progresso bruto pós-ferramenta do assistente,
conclusões brutas de raciocínio ou progresso de raciocínio. A guarda usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e
usa cinco minutos por padrão caso contrário. Esse mesmo orçamento pós-ferramenta também estende o
watchdog de progresso para a janela de síntese silenciosa antes que o Codex emita o próximo
evento do turno atual. Notificações globais do servidor de app, como atualizações de limite de taxa,
não redefinem o progresso ocioso do turno. Conclusões de raciocínio, conclusões
`agentMessage` de comentário e progresso bruto de raciocínio ou assistente antes da ferramenta podem
ser seguidos por uma resposta final automática, portanto usam a guarda de resposta pós-progresso
em vez de liberar a faixa da sessão imediatamente. Apenas itens `agentMessage`
concluídos finais/não comentário e conclusões brutas do assistente antes da ferramenta armam a liberação
de saída do assistente: se o Codex então ficar silencioso sem `turn/completed`, o OpenClaw
interrompe em melhor esforço o turno nativo e libera a faixa da sessão. Se outra
vigilância de turno vencer essa disputa de liberação, o OpenClaw ainda aceita o item final
concluído do assistente assim que nenhuma solicitação nativa, item ou conclusão de ferramenta dinâmica
permanecer ativa e a liberação de saída do assistente ainda pertencer ao item concluído mais recente,
sem conclusão de item posterior. Isso pode preservar a resposta final depois de trabalho de ferramenta
concluído sem reproduzir o turno. Deltas parciais do assistente, respostas anteriores obsoletas
e conclusões posteriores vazias não se qualificam. Falhas do servidor de app por stdio seguras para repetição,
incluindo tempos limite ociosos de conclusão de turno sem evidência de assistente, ferramenta, item ativo
ou efeito colateral, são tentadas novamente uma vez em uma nova tentativa do servidor de app. Tempos limite inseguros
ainda aposentam o cliente do servidor de app travado e liberam a faixa de sessão do OpenClaw.
Eles também limpam o vínculo obsoleto da thread nativa em vez de serem
reproduzidos automaticamente. Tempos limite de vigilância de conclusão exibem texto de tempo limite específico do Codex:
casos seguros para repetição dizem que a resposta pode estar incompleta, enquanto casos inseguros
orientam o usuário a verificar o estado atual antes de tentar novamente. Diagnósticos públicos de tempo limite
incluem campos estruturais como o último método de notificação do servidor de app,
id/tipo/papel do item bruto de resposta do assistente, contagens de solicitações/itens ativos e estado
de vigilância armado. Quando a última notificação é um item bruto de resposta do assistente, eles
também incluem uma prévia limitada do texto do assistente. Eles não incluem conteúdo bruto de prompt
ou ferramenta.

Substituições por ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` não está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. Configuração é
preferível para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Plugins nativos do Codex

O suporte a Plugin nativo do Codex usa os próprios recursos de app e Plugin do servidor de app do Codex
na mesma thread do Codex que o turno do harness do OpenClaw. O OpenClaw
não traduz Plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw.

`codexPlugins` afeta apenas sessões que selecionam o harness nativo do Codex. Ele
não tem efeito em execuções do harness integrado, execuções normais do provedor OpenAI, vínculos de conversa ACP
ou outros harnesses.

Configuração mínima migrada:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

A configuração de app da thread é computada quando o OpenClaw estabelece uma sessão do harness do Codex
ou substitui um vínculo obsoleto de thread do Codex. Ela não é recomputada a cada turno.
Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o gateway para que
sessões futuras do harness do Codex comecem com o conjunto de apps atualizado.

Para elegibilidade de migração, inventário de apps, política de ação destrutiva,
elicitações e diagnósticos de Plugin nativo, consulte
[Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins).

O acesso a apps e Plugins no lado da OpenAI é controlado pela conta Codex conectada
e, para workspaces Business e Enterprise/Edu, por controles de app do workspace. Consulte
[Usando o Codex com seu plano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para a visão geral da OpenAI sobre controles de conta e workspace.

## Uso do computador

Uso do computador é abordado em seu próprio guia de configuração:
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não incorpora como vendor o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o servidor de app do Codex, verifica se o
servidor MCP `computer-use` está disponível e então deixa o Codex controlar as chamadas
nativas de ferramenta MCP durante turnos em modo Codex.

## Limites de runtime

O harness do Codex altera apenas o executor de agente embarcado de baixo nível.

- Ferramentas dinâmicas do OpenClaw são compatíveis. O Codex pede que o OpenClaw execute essas
  ferramentas, então o OpenClaw permanece no caminho de execução.
- Ferramentas nativas do Codex de shell, patch, MCP e app nativo pertencem ao Codex.
  O OpenClaw pode observar ou bloquear eventos nativos selecionados por meio do relay
  compatível, mas não reescreve argumentos de ferramentas nativas.
- O Codex controla a Compaction nativa. O OpenClaw mantém um espelho de transcrição para histórico
  de canais, busca, `/new`, `/reset` e futura troca de modelo ou harness, mas
  não substitui a Compaction do Codex por um sumarizador do OpenClaw ou do mecanismo de contexto.
- Geração de mídia, compreensão de mídia, TTS, aprovações e saída de ferramenta de mensagens
  continuam pelos ajustes correspondentes de provedor/modelo do OpenClaw.
- `tool_result_persist` se aplica a resultados de ferramentas de transcrição pertencentes ao OpenClaw, não
  a registros de resultados de ferramentas nativas do Codex.

Para camadas de hooks, superfícies V1 compatíveis, tratamento de permissões nativas, direcionamento
de fila, mecânica de envio de feedback do Codex e detalhes de Compaction, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime).

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa o harness integrado em vez do Codex:** garanta que a ref do modelo seja
`openai/gpt-*` no provedor oficial OpenAI e que o Plugin Codex esteja
instalado e habilitado. Se precisar de prova estrita durante testes, defina no provedor ou
modelo `agentRuntime.id: "codex"`. Um runtime Codex forçado falha em vez de
retornar para o OpenClaw.

**O runtime OpenAI Codex retorna para o caminho de chave de API:** colete um trecho redigido
do gateway que mostre o modelo, runtime, provedor selecionado e falha.
Peça aos colaboradores afetados para executar este comando somente leitura no host OpenClaw deles:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Trechos úteis geralmente incluem `openai/gpt-5.5` ou `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` ou `harnessRuntime`,
`candidateProvider: "openai"` e um resultado `401`, `Incorrect API key` ou
`No API key`. Uma execução corrigida deve mostrar o caminho OAuth da OpenAI
em vez de uma falha simples de chave de API da OpenAI.

**A configuração de refs de modelo Codex legadas permanece:** execute `openclaw doctor --fix`.
O Doctor reescreve refs de modelo legadas para `openai/*`, remove pins obsoletos de sessão e
runtime de agente inteiro, e preserva substituições existentes de perfil de autenticação.

**O servidor de app é rejeitado:** use o servidor de app do Codex `0.125.0` ou mais novo.
Pré-lançamentos da mesma versão ou versões com sufixo de build, como
`0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o OpenClaw testa o
piso do protocolo estável `0.125.0`.

**`/codex status` não consegue conectar:** verifique se o Plugin `codex` incluído está
habilitado, se `plugins.allow` o inclui quando uma allowlist está configurada, e
se qualquer `appServer.command`, `url`, `authToken` ou cabeçalhos personalizados são válidos.

**A descoberta de modelos está lenta:** reduza
`plugins.entries.codex.config.discovery.timeoutMs` ou desabilite a descoberta. Consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#model-discovery).

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`,
cabeçalhos, e se o servidor de app remoto fala a mesma versão do protocolo de servidor de app
do Codex.

**Ferramentas nativas de shell ou patch são bloqueadas com `Native hook relay unavailable`:**
a conversa do Codex ainda está tentando usar um id de relay de hook nativo que o OpenClaw não
tem mais registrado. Este é um problema de transporte de hook nativo do Codex, não uma falha do
backend ACP, do provider, do GitHub ou de comando de shell. Inicie uma nova sessão no
chat afetado com `/new` ou `/reset` e tente novamente um comando inofensivo. Se isso
funcionar uma vez, mas a próxima chamada de ferramenta nativa falhar de novo, trate `/new` apenas como uma solução temporária: copie o prompt para uma sessão nova depois de reiniciar o app-server do Codex ou o Gateway do OpenClaw para que as conversas antigas sejam descartadas e os registros de hook nativo sejam recriados.

**Um modelo que não é Codex usa o harness integrado:** isso é esperado, a menos que
a política de runtime do provider ou do modelo o direcione para outro harness. Refs simples de
providers que não são OpenAI permanecem no caminho normal do provider no modo `auto`.

**Computer Use está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` em uma sessão nova. Se uma ferramenta relatar
`Native hook relay unavailable`, use a recuperação de relay de hook nativo acima. Consulte
[Codex Computer Use](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Relacionados

- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Providers de modelo](/pt-BR/concepts/model-providers)
- [Provider OpenAI](/pt-BR/providers/openai)
- [Ajuda do OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Exportação de diagnóstico](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
