---
read_when:
    - Você quer usar o harness de servidor de app Codex incluído
    - Você precisa de exemplos de configuração do harness do Codex
    - Você quer que implantações somente Codex falhem em vez de recorrer ao OpenClaw
summary: Execute turnos de agentes incorporados do OpenClaw pelo harness de app-server Codex incluído
title: Harness do Codex
x-i18n:
    generated_at: "2026-06-27T17:45:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

O plugin `codex` incluído permite que o OpenClaw execute turnos de agente OpenAI
embarcados por meio do Codex app-server em vez do harness integrado do OpenClaw.

Use o harness do Codex quando você quiser que o Codex seja responsável pela sessão
de agente de baixo nível: retomada nativa de thread, continuação nativa de ferramenta,
compactação nativa e execução no app-server. O OpenClaw ainda é responsável por
canais de chat, arquivos de sessão, seleção de modelo, ferramentas dinâmicas do
OpenClaw, aprovações, entrega de mídia e o espelho visível da transcrição.

A configuração normal usa refs de modelo OpenAI canônicas, como `openai/gpt-5.5`.
Não configure refs GPT legadas do Codex. Coloque a ordem de autenticação do agente
OpenAI em `auth.order.openai`; ids de perfis de autenticação legados do Codex e
entradas legadas de ordem de autenticação do Codex são estado legado reparado por
`openclaw doctor --fix`.

Quando nenhum sandbox do OpenClaw está ativo, o OpenClaw inicia threads do Codex
app-server com o modo de código nativo do Codex habilitado, mantendo code-mode-only
desativado por padrão. Isso mantém o workspace nativo e os recursos de código do
Codex disponíveis enquanto as ferramentas dinâmicas do OpenClaw continuam pelo
bridge `item/tool/call` do app-server. O sandboxing ativo do OpenClaw e políticas
restritas de ferramentas desabilitam totalmente o modo de código nativo, a menos
que você opte pelo caminho experimental de exec-server de sandbox.

Este recurso nativo do Codex é separado do
[modo de código do OpenClaw](/pt-BR/reference/code-mode), que é um runtime QuickJS-WASI
opcional para execuções genéricas do OpenClaw com um formato de entrada `exec`
diferente.

Para a divisão mais ampla entre modelo/provedor/runtime, comece com
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a ref do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Requisitos

- OpenClaw com o plugin `codex` incluído disponível.
- Se sua configuração usa `plugins.allow`, inclua `codex`.
- Codex app-server `0.125.0` ou mais recente. O plugin incluído gerencia um
  binário compatível do Codex app-server por padrão, portanto comandos `codex`
  locais no `PATH` não afetam a inicialização normal do harness.
- Autenticação do Codex disponível por meio de `openclaw models auth login --provider openai`,
  uma conta do app-server no Codex home do agente ou um perfil explícito de
  autenticação por chave de API do Codex.

Para precedência de autenticação, isolamento de ambiente, comandos personalizados
do app-server, descoberta de modelos e todos os campos de configuração, consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

A maioria dos usuários que quer Codex no OpenClaw quer este caminho: entrar com
uma assinatura ChatGPT/Codex, habilitar o plugin `codex` incluído e usar uma
ref de modelo `openai/gpt-*` canônica.

Entre com OAuth do Codex:

```bash
openclaw models auth login --provider openai
```

Habilite o plugin `codex` incluído e selecione um modelo de agente OpenAI:

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

Reinicie o gateway depois de alterar a configuração de plugins. Se um chat
existente já tiver uma sessão, use `/new` ou `/reset` antes de testar mudanças
de runtime para que o próximo turno resolva o harness a partir da configuração
atual.

## Configuração

A configuração do início rápido é a configuração mínima viável do harness do Codex.
Defina opções do harness do Codex na configuração do OpenClaw e use a CLI apenas
para autenticação do Codex:

| Necessidade                            | Defina                                                                           | Onde                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar o harness                    | `plugins.entries.codex.enabled: true`                                            | Configuração do OpenClaw           |
| Manter uma instalação de plugin permitida | Incluir `codex` em `plugins.allow`                                            | Configuração do OpenClaw           |
| Rotear turnos de agente OpenAI pelo Codex | `agents.defaults.model` ou `agents.list[].model` como `openai/gpt-*`          | Configuração de agente do OpenClaw |
| Entrar com OAuth do ChatGPT/Codex      | `openclaw models auth login --provider openai`                                   | Perfil de autenticação da CLI      |
| Adicionar backup por chave de API para execuções do Codex | Perfil de chave de API `openai:*` listado após autenticação por assinatura em `auth.order.openai` | Perfil de autenticação da CLI + configuração do OpenClaw |
| Falhar fechado quando o Codex estiver indisponível | `agentRuntime.id: "codex"` do provedor ou modelo                         | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API OpenAI      | `agentRuntime.id: "openclaw"` do provedor ou modelo com autenticação OpenAI normal | Configuração de modelo/provedor do OpenClaw |
| Ajustar comportamento do app-server    | `plugins.entries.codex.config.appServer.*`                                       | Configuração do plugin Codex       |
| Habilitar apps nativos de plugin do Codex | `plugins.entries.codex.config.codexPlugins.*`                                 | Configuração do plugin Codex       |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuração do plugin Codex       |

Use refs de modelo `openai/gpt-*` para turnos de agente OpenAI com suporte do Codex.
Prefira `auth.order.openai` para ordenação com assinatura primeiro e chave de API
como backup. Ids de perfis de autenticação legados do Codex existentes e ordem de
autenticação legada do Codex são estado legado apenas para doctor; não grave novas
refs GPT legadas do Codex.

Não defina `compaction.model` ou `compaction.provider` em agentes com suporte do
Codex. O Codex compacta por meio de seu estado de thread nativo do app-server,
portanto o OpenClaw ignora essas substituições locais de sumarizador em runtime e
`openclaw doctor --fix` as remove quando o agente usa Codex.

Lossless continua compatível como engine de contexto para montagem, ingestão e
manutenção em torno de turnos do Codex. Configure-o por meio de
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, não por
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra o formato antigo
`compaction.provider: "lossless-claw"` para o slot de engine de contexto Lossless
quando o Codex é o runtime ativo, mas o Codex nativo ainda é responsável pela compactação.

O harness nativo do Codex app-server oferece suporte a engines de contexto que exigem
montagem pré-prompt. Backends genéricos de CLI, incluindo `codex-cli`, não fornecem
essa capacidade de host.

Para agentes com suporte do Codex, `/compact` inicia a compactação nativa do Codex
app-server na thread vinculada. O OpenClaw não espera a conclusão, não impõe um
timeout do OpenClaw, não reinicia o app-server compartilhado nem recorre a uma
engine de contexto ou sumarizador público da OpenAI. Se o vínculo da thread nativa
do Codex estiver ausente ou obsoleto, o comando falha fechado para que o operador
veja o limite real do runtime em vez de alternar silenciosamente backends de compactação.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Nesse formato, ambos os perfis ainda rodam pelo Codex para turnos de agente
`openai/gpt-*`. A chave de API é apenas um fallback de autenticação, não uma
solicitação para alternar para OpenClaw ou para OpenAI Responses simples.

O restante desta página cobre variantes comuns entre as quais os usuários precisam
escolher: formato de implantação, roteamento fail-closed, política de aprovação
guardian, plugins nativos do Codex e Computer Use. Para listas completas de opções,
padrões, enums, descoberta, isolamento de ambiente, timeouts e campos de transporte
do app-server, consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Verificar runtime do Codex

Use `/status` no chat em que você espera Codex. Um turno de agente OpenAI com
suporte do Codex mostra:

```text
Runtime: OpenAI Codex
```

Depois verifique o estado do Codex app-server:

```text
/codex status
/codex models
```

`/codex status` informa conectividade do app-server, conta, limites de taxa,
servidores MCP e Skills. `/codex models` lista o catálogo ao vivo do Codex
app-server para o harness e a conta. Se `/status` surpreender, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha refs de provedor e política de runtime separadas:

- Use `openai/gpt-*` para turnos de agente OpenAI pelo Codex.
- Não use refs GPT legadas do Codex na configuração. Execute `openclaw doctor --fix`
  para reparar refs legadas e pins obsoletos de rota de sessão.
- `agentRuntime.id: "codex"` é opcional para o modo automático normal da OpenAI, mas
  útil quando uma implantação deve falhar fechado se o Codex estiver indisponível.
- `agentRuntime.id: "openclaw"` opta um provedor ou modelo pelo runtime embarcado
  do OpenClaw quando isso é intencional.
- `/codex ...` controla conversas nativas do Codex app-server a partir do chat.
- ACP/acpx é um caminho de harness externo separado. Use-o apenas quando o usuário
  pedir ACP/acpx ou um adaptador de harness externo.

Roteamento de comandos comum:

| Intenção do usuário                                   | Use                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Anexar o chat atual                                   | `/codex bind [--cwd <path>]`                                                                          |
| Retomar uma thread existente do Codex                 | `/codex resume <thread-id>`                                                                           |
| Listar ou filtrar threads do Codex                    | `/codex threads [filter]`                                                                             |
| Listar plugins nativos do Codex                       | `/codex plugins list`                                                                                 |
| Habilitar ou desabilitar um plugin nativo configurado do Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                              |
| Anexar uma sessão existente do Codex CLI em um nó pareado | `/codex sessions --host <node> [filter]`, depois `/codex resume <session-id> --host <node> --bind here` |
| Enviar apenas feedback do Codex                       | `/codex diagnostics [note]`                                                                           |
| Iniciar uma tarefa ACP/acpx                           | Comandos de sessão ACP/acpx, não `/codex`                                                             |

| Caso de uso                                          | Configurar                                                            | Verificar                                | Observações                           |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*` mais Plugin `codex` habilitado                         | `/status` mostra `Runtime: OpenAI Codex` | Caminho recomendado                   |
| Falhar fechado se o Codex estiver indisponível       | Provedor ou modelo `agentRuntime.id: "codex"`                         | O turno falha em vez de fallback embutido | Use para implantações somente Codex   |
| Tráfego direto de chave de API da OpenAI via OpenClaw | Provedor ou modelo `agentRuntime.id: "openclaw"` e autenticação normal da OpenAI | `/status` mostra runtime do OpenClaw     | Use somente quando OpenClaw for intencional |
| Configuração legada                                  | referências GPT legadas do Codex                                      | `openclaw doctor --fix` reescreve isso   | Não escreva nova configuração assim   |
| Adaptador ACP/acpx do Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                              | Status de tarefa/sessão ACP              | Separado do harness nativo do Codex   |

`agents.defaults.imageModel` segue a mesma divisão por prefixo. Use `openai/gpt-*`
para a rota normal da OpenAI e `codex/gpt-*` somente quando o entendimento de imagem
deve passar por um turno delimitado do servidor de aplicativo do Codex. Não use
referências GPT legadas do Codex; o doctor reescreve esse prefixo legado para `openai/gpt-*`.

## Padrões de implantação

### Implantação básica do Codex

Use a configuração de início rápido quando todos os turnos de agente da OpenAI devem usar Codex por
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

### Implantação com provedores mistos

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

Com esta configuração, o agente `main` usa seu caminho normal de provedor e o
agente `codex` usa o servidor de aplicativo do Codex.

### Implantação Codex com falha fechada

Para turnos de agente da OpenAI, `openai/gpt-*` já resolve para Codex quando o
Plugin empacotado está disponível. Adicione uma política de runtime explícita quando quiser uma regra
de falha fechada por escrito:

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

Com o Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, se o
servidor de aplicativo for antigo demais ou se o servidor de aplicativo não conseguir iniciar.

## Política do servidor de aplicativo

Por padrão, o Plugin inicia localmente o binário Codex gerenciado pelo OpenClaw com transporte
stdio. Defina `appServer.command` somente quando você intencionalmente quiser executar um
executável diferente. Use transporte WebSocket somente quando um servidor de aplicativo já estiver
em execução em outro lugar:

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

Sessões locais de servidor de aplicativo stdio usam por padrão a postura confiável de operador local:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem essa
postura YOLO implícita, o OpenClaw seleciona permissões de guardião permitidas em vez disso.
Quando um sandbox do OpenClaw está ativo para a sessão, o OpenClaw desabilita o Code Mode
nativo do Codex, servidores MCP de usuário e execução de Plugin com suporte de aplicativo para esse
turno, em vez de depender do sandboxing no host do Codex. O acesso ao shell é exposto
por meio de ferramentas dinâmicas baseadas no sandbox do OpenClaw, como `sandbox_exec` e
`sandbox_process`, quando as ferramentas normais de exec/process estiverem disponíveis.

Use o modo de execução normalizado do OpenClaw quando quiser revisão automática nativa do Codex antes
de escapes do sandbox ou permissões extras:

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

Para sessões de servidor de aplicativo do Codex, o OpenClaw mapeia `tools.exec.mode: "auto"` para aprovações
revisadas pelo Guardian do Codex, normalmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando os requisitos locais permitirem esses valores.
Em `tools.exec.mode: "auto"`, o OpenClaw não preserva substituições legadas inseguras do Codex
`approvalPolicy: "never"` ou `sandbox: "danger-full-access"`; use
`tools.exec.mode: "full"` para uma postura Codex intencional sem aprovação. A
predefinição legada `plugins.entries.codex.config.appServer.mode: "guardian"` ainda
funciona, mas `tools.exec.mode: "auto"` é a superfície normalizada do OpenClaw.

Para a comparação em nível de modo com aprovações de execução do host e permissões ACPX,
consulte [Modos de permissão](/pt-BR/tools/permission-modes).

Para todos os campos do servidor de aplicativo, ordem de autenticação, isolamento de ambiente, descoberta e
comportamento de timeout, consulte [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Comandos e diagnósticos

O Plugin empacotado registra `/codex` como comando de barra em qualquer canal que
ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` verifica conectividade do servidor de aplicativo, modelos, conta, limites de taxa,
  servidores MCP e Skills.
- `/codex models` lista modelos ativos do servidor de aplicativo do Codex.
- `/codex threads [filter]` lista threads recentes do servidor de aplicativo do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma
  thread existente do Codex.
- `/codex compact` pede ao servidor de aplicativo do Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback do Codex para a
  thread anexada.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do servidor de aplicativo do Codex.
- `/codex skills` lista Skills do servidor de aplicativo do Codex.

Para a maioria dos relatórios de suporte, comece com `/diagnostics [note]` na conversa
onde o bug aconteceu. Ele cria um relatório de diagnóstico do Gateway e, para sessões do
harness do Codex, pede aprovação para enviar o pacote de feedback relevante do Codex.
Consulte [Exportação de diagnóstico](/pt-BR/gateway/diagnostics) para o modelo de privacidade e o comportamento em
chat em grupo.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de
feedback do Codex para a thread atualmente anexada, sem o pacote completo de diagnósticos do
Gateway.

### Inspecionar threads do Codex localmente

A forma mais rápida de inspecionar uma execução ruim do Codex costuma ser abrir a thread nativa do Codex
diretamente:

```bash
codex resume <thread-id>
```

Obtenha o id da thread na resposta concluída de `/diagnostics`, `/codex binding` ou
`/codex threads [filter]`.

Para mecanismos de upload e limites de diagnóstico em nível de runtime, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

A autenticação é selecionada nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, de preferência em
   `auth.order.openai`. Execute `openclaw doctor --fix` para migrar ids mais antigos
   de perfil de autenticação legado do Codex e ordem de autenticação legada do Codex.
2. A conta existente do servidor de aplicativo na home Codex desse agente.
3. Somente para inicializações locais de servidor de aplicativo stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de servidor de aplicativo estiver presente e a autenticação OpenAI
   ainda for necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex gerado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do servidor de aplicativo do Codex serem cobrados pela API por acidente.
Perfis explícitos de chave de API do Codex e fallback de chave de ambiente stdio local usam login no servidor de aplicativo
em vez de ambiente herdado do processo filho. Conexões WebSocket de servidor de aplicativo
não recebem fallback de chave de API de ambiente do Gateway; use um perfil de autenticação explícito ou a
própria conta do servidor de aplicativo remoto.
Quando Plugins nativos do Codex são configurados, o OpenClaw instala ou atualiza esses
Plugins por meio do servidor de aplicativo conectado antes de expor aplicativos pertencentes ao Plugin à
thread do Codex. `app/list` continua sendo a fonte da verdade para ids de aplicativos,
acessibilidade e metadados, mas o OpenClaw controla a decisão de habilitação por thread:
se a política permitir um aplicativo acessível listado, o OpenClaw envia
`thread/start.config.apps[appId].enabled = true` mesmo quando `app/list` atualmente
relata que esse aplicativo está desabilitado. Este caminho não inventa instalação de aplicativo para
ids desconhecidos; o OpenClaw ativa somente Plugins do marketplace com `plugin/install`
e depois atualiza o inventário.

Se um perfil de assinatura atingir um limite de uso do Codex, o OpenClaw registra o horário de redefinição
quando o Codex informa um e tenta o próximo perfil de autenticação ordenado para a mesma
execução do Codex. Quando o horário de redefinição passa, o perfil de assinatura volta a ficar elegível
sem alterar o modelo `openai/gpt-*` selecionado ou o runtime do Codex.

Para inicializações locais de servidor de aplicativo stdio, o OpenClaw define `CODEX_HOME` como um diretório
por agente para que configuração, arquivos de autenticação/conta, cache/dados de Plugin e estado nativo
de thread do Codex não leiam nem gravem no `~/.codex` pessoal do operador por
padrão. O OpenClaw preserva o `HOME` normal do processo; subprocessos executados pelo Codex
ainda podem encontrar configuração e tokens na home do usuário, e o Codex pode descobrir entradas
compartilhadas de `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`.

Se uma implantação precisar de isolamento de ambiente adicional, adicione essas variáveis a
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

`appServer.clearEnv` afeta somente o processo filho do servidor de aplicativo Codex gerado.
O OpenClaw remove `CODEX_HOME` e `HOME` dessa lista durante a normalização de inicialização local:
`CODEX_HOME` permanece por agente, e `HOME` continua herdado para que
subprocessos possam usar estado normal da home do usuário.

As ferramentas dinâmicas do Codex usam carregamento `searchable` por padrão. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações de workspace nativas do Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. A maioria das demais
ferramentas de integração do OpenClaw, como mensagens, mídia, cron, navegador, nós,
gateway e `heartbeat_respond`, está disponível pela busca de ferramentas do Codex no
namespace `openclaw`, mantendo menor o contexto inicial do modelo. A busca na Web
usa a ferramenta hospedada `web_search` do Codex por padrão quando a busca está ativada e nenhum
provedor gerenciado está selecionado. A busca hospedada nativa e a ferramenta dinâmica
gerenciada `web_search` do OpenClaw são mutuamente exclusivas, para que a busca gerenciada não possa contornar
restrições de domínio nativas. O OpenClaw usa a ferramenta gerenciada quando a busca hospedada está
indisponível, explicitamente desativada ou substituída por um provedor gerenciado selecionado.
O OpenClaw mantém a extensão independente `web.run` do Codex desativada porque
o tráfego de app-server de produção rejeita seu namespace `web` definido pelo usuário.
`tools.web.search.enabled: false` desativa ambos os caminhos, assim como execuções
somente LLM com ferramentas desativadas. O Codex trata `"cached"` como uma preferência e a resolve para acesso
externo ao vivo em turnos irrestritos de app-server. O fallback gerenciado automático
falha de forma fechada quando `allowedDomains` nativos estão definidos, para que a allowlist não possa ser
contornada. Alterações persistentes na política efetiva de busca rotacionam a thread vinculada do Codex
antes do próximo turno. Restrições transitórias por turno usam uma thread restrita
temporária e preservam o vínculo existente para retomada posterior.
`sessions_yield` e respostas de origem somente com ferramenta de mensagens permanecem diretas porque
esses são contratos de controle de turno. `sessions_spawn` permanece pesquisável para que o
`spawn_agent` nativo do Codex continue sendo a principal superfície de subagente do Codex, enquanto a delegação
explícita do OpenClaw ou ACP ainda fica disponível pelo namespace de ferramentas dinâmicas
`openclaw`. As instruções de colaboração de Heartbeat orientam o Codex a buscar
`heartbeat_respond` antes de encerrar um turno de heartbeat quando a ferramenta ainda não estiver
carregada.

Defina `codexDynamicToolsLoading: "direct"` somente ao conectar a um app-server Codex
customizado que não consegue pesquisar ferramentas dinâmicas adiadas ou ao depurar o payload
completo de ferramentas.

Campos de plugin Codex de nível superior compatíveis:

| Campo                      | Padrão        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar as ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos de app-server do Codex.              |
| `codexPlugins`             | desativado       | Suporte nativo a plugin/app do Codex para plugins curados migrados instalados a partir do código-fonte.           |

Campos `appServer` compatíveis:

| Campo                                         | Padrão                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | binário Codex gerenciado                              | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | não definido                                           | URL do app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | não definido                                           | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket extras. Valores de cabeçalho aceitam strings literais ou valores SecretInput, por exemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomes extras de variáveis de ambiente removidos do processo app-server stdio iniciado depois que o OpenClaw monta seu ambiente herdado. O OpenClaw mantém `CODEX_HOME` por agente e `HOME` herdado para inicializações locais.                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | Ativa a superfície de ferramentas exclusiva de modo de código do Codex. As ferramentas dinâmicas do OpenClaw permanecem registradas no Codex para que chamadas `tools.*` aninhadas retornem pela ponte `item/tool/call` do app-server.                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | não definido                                           | Raiz remota do workspace do app-server Codex. Quando definido, o OpenClaw infere a raiz local do workspace a partir do workspace OpenClaw resolvido, preserva o sufixo do cwd atual sob essa raiz remota e envia apenas o cwd final do app-server para o Codex. Se o cwd estiver fora da raiz do workspace OpenClaw resolvida, o OpenClaw falha de forma fechada em vez de enviar um caminho local do Gateway para o app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela silenciosa depois que o Codex aceita um turno ou depois de uma solicitação ao app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guarda de conclusão ociosa e progresso usada após uma transferência de ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente pós-ferramenta, conclusão de raciocínio bruto ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para workloads confiáveis ou pesadas em que a síntese pós-ferramenta pode legitimamente ficar silenciosa por mais tempo que o orçamento final de liberação do assistente.                                |
| `mode`                                        | `"yolo"` salvo quando requisitos locais do Codex desabilitam YOLO | Predefinição para execução YOLO ou revisada por guardian. Requisitos locais de stdio que omitem `danger-full-access`, aprovação `never` ou o revisor `user` tornam o padrão implícito guardian.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação guardian permitida       | Política de aprovação nativa do Codex enviada para início/retomada/turno de thread. Padrões guardian preferem `"on-request"` quando permitido.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou uma sandbox guardian permitida  | Modo de sandbox nativo do Codex enviado para início/retomada de thread. Padrões guardian preferem `"workspace-write"` quando permitido; caso contrário, `"read-only"`. Quando uma sandbox OpenClaw está ativa, turnos `danger-full-access` usam `workspace-write` do Codex com acesso à rede derivado da configuração de saída da sandbox OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` ou um revisor guardian permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido; caso contrário, `guardian_subagent` ou `user`. `guardian_subagent` permanece um alias legado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | não definido                                           | Camada de serviço opcional do app-server Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, `null` limpa a substituição e o legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | desabilitado                                           | Ativa a rede por perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Ativação experimental de prévia que registra um ambiente Codex respaldado pela sandbox do OpenClaw no app-server Codex 0.132.0 ou mais recente para que a execução nativa do Codex possa rodar dentro da sandbox OpenClaw ativa.                                                                                                                                                                                                         |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do Codex.
Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração de thread do Codex para que o perfil de
permissão gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o
OpenClaw gera um nome de perfil `openclaw-network-<fingerprint>` resistente a
colisões a partir do corpo do perfil; use `profileName` apenas quando um nome
local estável for necessário.

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
`networkProxy` usa acesso ao sistema de arquivos no estilo workspace para o
perfil de permissão gerado. A aplicação de rede gerenciada pelo Codex é rede em
sandbox, portanto um perfil com acesso total não protegeria o tráfego de saída.
Entradas de domínio usam `allow` ou `deny`; entradas de soquete Unix usam os
valores `allow` ou `none` do Codex.

As chamadas dinâmicas de ferramentas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: solicitações Codex `item/tool/call` usam um watchdog
do OpenClaw de 90 segundos por padrão. Um argumento positivo `timeoutMs` por chamada estende
ou reduz o orçamento dessa ferramenta específica. A ferramenta `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando a chamada da ferramenta não
fornece seu próprio timeout, ou um padrão de geração de imagem de 120 segundos caso contrário.
A ferramenta `image` de entendimento de mídia usa
`tools.media.image.timeoutSeconds` ou seu padrão de mídia de 60 segundos. Para entendimento de
imagem, esse timeout se aplica à própria solicitação e não é
reduzido pelo trabalho de preparação anterior. Orçamentos de ferramentas dinâmicas são
limitados a 600000 ms. Em caso de timeout, o OpenClaw aborta o sinal da ferramenta
quando houver suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que o turno
possa continuar em vez de deixar a sessão em `processing`.
Esse watchdog é o orçamento externo dinâmico de `item/tool/call`; timeouts de
solicitação específicos do provedor executam dentro dessa chamada e mantêm sua própria semântica de timeout.

Depois que o Codex aceita um turno, e depois que o OpenClaw responde a uma solicitação de
app-server com escopo de turno, o harness espera que o Codex faça progresso no turno atual e
eventualmente finalize o turno nativo com `turn/completed`. Se o app-server ficar
silencioso por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw faz o melhor esforço para
interromper o turno do Codex, registra um timeout de diagnóstico e libera a faixa de sessão do
OpenClaw para que mensagens de chat subsequentes não fiquem enfileiradas atrás de um turno
nativo obsoleto. A maioria das notificações não terminais para o mesmo turno desarma esse curto
watchdog porque o Codex provou que o turno ainda está ativo. Transferências para ferramentas usam um
orçamento ocioso pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta
`item/tool/call`, depois que itens de ferramentas nativas como `commandExecution` são concluídos, depois de conclusões brutas de
`custom_tool_call_output`, e depois de progresso bruto do assistente pós-ferramenta,
conclusões brutas de raciocínio ou progresso de raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e
usa cinco minutos por padrão caso contrário. Esse mesmo orçamento pós-ferramenta também estende o
watchdog de progresso para a janela silenciosa de síntese antes que o Codex emita o próximo
evento do turno atual. Notificações globais do app-server, como atualizações de limite de taxa,
não redefinem o progresso ocioso do turno. Conclusões de raciocínio, conclusões de
`agentMessage` de comentário e progresso bruto de raciocínio ou do assistente antes da ferramenta podem
ser seguidos por uma resposta final automática, portanto usam a proteção de resposta pós-progresso
em vez de liberar a faixa de sessão imediatamente. Somente itens `agentMessage`
concluídos finais/sem comentário e conclusões brutas do assistente antes da ferramenta armam a liberação da saída do assistente:
se o Codex então ficar silencioso sem `turn/completed`, o OpenClaw faz o melhor esforço para interromper o turno nativo e
libera a faixa de sessão. Falhas replay-safe de app-server stdio, incluindo
timeouts de ociosidade de conclusão de turno sem evidência de assistente, ferramenta, item ativo ou
efeito colateral, são repetidas uma vez em uma nova tentativa de app-server. Timeouts inseguros
ainda aposentam o cliente de app-server travado e liberam a faixa de sessão do OpenClaw.
Eles também limpam a associação obsoleta de thread nativa em vez de serem
reexecutados automaticamente. Timeouts de observação de conclusão exibem texto de timeout específico do Codex:
casos replay-safe dizem que a resposta pode estar incompleta, enquanto casos inseguros
dizem ao usuário para verificar o estado atual antes de tentar novamente. Diagnósticos públicos de timeout
incluem campos estruturais como o último método de notificação do app-server,
id/tipo/função do item bruto de resposta do assistente, contagens de solicitações/itens ativos e estado de
observação armado. Quando a última notificação é um item bruto de resposta do assistente, eles
também incluem uma prévia limitada do texto do assistente. Eles não incluem prompt bruto nem
conteúdo de ferramenta.

Substituições de ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` não está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A configuração é
preferível para implantações repetíveis porque mantém o comportamento do plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Plugins nativos do Codex

O suporte a plugins nativos do Codex usa os próprios recursos de app e plugin do app-server do Codex
na mesma thread do Codex que o turno do harness do OpenClaw. O OpenClaw
não traduz plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw.

`codexPlugins` afeta apenas sessões que selecionam o harness nativo do Codex. Ele
não tem efeito em execuções do harness integrado, execuções normais do provedor OpenAI, associações de conversas ACP
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

A configuração de app da thread é calculada quando o OpenClaw estabelece uma sessão de harness do Codex
ou substitui uma associação obsoleta de thread do Codex. Ela não é recalculada a cada turno.
Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o gateway para que
futuras sessões do harness do Codex comecem com o conjunto de apps atualizado.

Para elegibilidade de migração, inventário de apps, política de ações destrutivas,
elicitações e diagnósticos de plugins nativos, consulte
[Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins).

O acesso a apps e plugins do lado da OpenAI é controlado pela conta Codex conectada
e, para workspaces Business e Enterprise/Edu, pelos controles de app do workspace. Consulte
[Usar o Codex com seu plano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para a visão geral da OpenAI sobre controles de conta e workspace.

## Computer Use

Computer Use é abordado em seu próprio guia de configuração:
[Codex Computer Use](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não incorpora o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server do Codex, verifica se o servidor MCP
`computer-use` está disponível e então deixa o Codex ser dono das chamadas nativas de
ferramentas MCP durante turnos no modo Codex.

## Limites de runtime

O harness do Codex altera apenas o executor de agente embarcado de baixo nível.

- Ferramentas dinâmicas do OpenClaw têm suporte. O Codex pede que o OpenClaw execute essas
  ferramentas, então o OpenClaw permanece no caminho de execução.
- Ferramentas nativas de shell, patch, MCP e app do Codex pertencem ao Codex.
  O OpenClaw pode observar ou bloquear eventos nativos selecionados por meio do relay com suporte,
  mas não reescreve argumentos de ferramentas nativas.
- O Codex é dono da compaction nativa. O OpenClaw mantém um espelho de transcrição para o histórico
  do canal, busca, `/new`, `/reset` e futura troca de modelo ou harness, mas
  não substitui a compaction do Codex por um resumidor do OpenClaw ou de mecanismo de contexto.
- Geração de mídia, entendimento de mídia, TTS, aprovações e saída de ferramentas de mensagens
  continuam pelas configurações correspondentes de provedor/modelo do OpenClaw.
- `tool_result_persist` se aplica a resultados de ferramentas de transcrição pertencentes ao OpenClaw, não
  a registros de resultados de ferramentas nativas do Codex.

Para camadas de hooks, superfícies V1 com suporte, tratamento de permissões nativas, direcionamento de filas,
mecânica de upload de feedback do Codex e detalhes de compaction, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime).

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa o harness integrado em vez do Codex:** confirme se a referência de modelo é
`openai/gpt-*` no provedor oficial da OpenAI e se o plugin do Codex está
instalado e habilitado. Se você precisar de prova estrita durante testes, defina o `agentRuntime.id` do provedor ou
modelo como `"codex"`. Um runtime Codex forçado falha em vez de
recair para o OpenClaw.

**O runtime OpenAI Codex recai para o caminho de chave de API:** colete um trecho redigido do
gateway que mostre o modelo, runtime, provedor selecionado e falha.
Peça aos colaboradores afetados que executem este comando somente leitura no host OpenClaw deles:

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

**A configuração de referências de modelo Codex legadas permanece:** execute `openclaw doctor --fix`.
O Doctor reescreve referências de modelos legadas para `openai/*`, remove pins obsoletos de sessão e
runtime de agente inteiro, e preserva substituições existentes de perfil de autenticação.

**O app-server é rejeitado:** use o app-server do Codex `0.125.0` ou mais recente.
Pré-lançamentos da mesma versão ou versões com sufixo de build, como
`0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o OpenClaw testa o
piso de protocolo estável `0.125.0`.

**`/codex status` não consegue conectar:** verifique se o plugin `codex` incluído está
habilitado, se `plugins.allow` o inclui quando uma allowlist está configurada, e
se qualquer `appServer.command`, `url`, `authToken` ou cabeçalho personalizado é válido.

**A descoberta de modelos está lenta:** reduza
`plugins.entries.codex.config.discovery.timeoutMs` ou desabilite a descoberta. Consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#model-discovery).

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`,
cabeçalhos e se o app-server remoto fala a mesma versão do protocolo do app-server do Codex.

**Ferramentas nativas de shell ou patch são bloqueadas com `Native hook relay unavailable`:**
a thread do Codex ainda está tentando usar um id de relay de hook nativo que o OpenClaw
não tem mais registrado. Isso é um problema de transporte de hook nativo do Codex, não uma falha de backend
ACP, provedor, GitHub ou comando de shell. Inicie uma nova sessão
no chat afetado com `/new` ou `/reset` e então tente novamente um comando inofensivo. Se isso
funcionar uma vez, mas a próxima chamada de ferramenta nativa falhar de novo, trate `/new` apenas como uma solução temporária:
copie o prompt para uma nova sessão depois de reiniciar o app-server do Codex
ou o Gateway do OpenClaw para que threads antigas sejam descartadas e registros de hooks nativos
sejam recriados.

**Um modelo não Codex usa o harness integrado:** isso é esperado, a menos que
a política de runtime do provedor ou modelo o direcione para outro harness. Referências simples de provedores não OpenAI
permanecem em seu caminho normal de provedor no modo `auto`.

**Computer Use está instalado, mas as ferramentas não são executadas:** verifique
`/codex computer-use status` em uma nova sessão. Se uma ferramenta relatar
`Native hook relay unavailable`, use a recuperação do relay de hook nativo acima. Consulte
[Codex Computer Use](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Relacionados

- [Referência do harness Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins Codex nativos](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Ajuda do OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
