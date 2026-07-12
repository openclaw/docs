---
doc-schema-version: 1
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você está escolhendo entre ferramentas integradas, Skills e plugins
    - Você precisa do ponto de entrada correto na documentação para políticas de ferramentas, automação ou coordenação de agentes
summary: 'Visão geral das ferramentas, Skills e plugins do OpenClaw: o que os agentes podem chamar e como estendê-los'
title: Visão geral
x-i18n:
    generated_at: "2026-07-12T00:26:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Use esta página para escolher a superfície de recursos adequada. **Ferramentas** são
ações que podem ser chamadas, **Skills** ensinam os agentes a trabalhar e **Plugins** adicionam
recursos de tempo de execução, como ferramentas, provedores, canais, hooks e
Skills empacotadas.

Esta é uma página de visão geral e direcionamento. Para consultar políticas de ferramentas, padrões,
associação a grupos, restrições de provedores e campos de configuração de forma completa, use
[Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Comece aqui

Para a maioria dos agentes, comece com as categorias de ferramentas integradas e ajuste a política
somente quando o agente precisar ver menos ferramentas ou necessitar de acesso explícito ao host.

| Se você precisar...                                      | Use isto primeiro                                      | Depois, leia                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Permitir que um agente atue com os recursos existentes   | [Ferramentas integradas](#built-in-tool-categories)    | [Categorias de ferramentas](#built-in-tool-categories)                                                                   |
| Controlar o que um agente pode chamar                    | [Política de ferramentas](#configure-access-and-approvals) | [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools)                                                     |
| Ensinar um fluxo de trabalho a um agente                 | [Skills](#choose-tools-skills-or-plugins)              | [Skills](/pt-BR/tools/skills), [Criação de Skills](/pt-BR/tools/creating-skills) e [Oficina de Skills](/pt-BR/tools/skill-workshop)        |
| Adicionar uma nova integração ou superfície de execução | [Plugins](#extend-capabilities)                        | [Plugins](/pt-BR/tools/plugin) e [Criar Plugins](/pt-BR/plugins/building-plugins)                                                     |
| Executar trabalho posteriormente ou em segundo plano     | [Automação](/pt-BR/automation)                               | [Visão geral da automação](/pt-BR/automation)                                                                                   |
| Coordenar vários agentes ou ambientes de execução        | [Subagentes](/pt-BR/tools/subagents)                         | [Agentes ACP](/pt-BR/tools/acp-agents) e [Envio do agente](/pt-BR/tools/agent-send)                                                   |
| Pesquisar um catálogo amplo de ferramentas do OpenClaw   | [Pesquisa de ferramentas](/pt-BR/tools/tool-search)          | [Pesquisa de ferramentas](/pt-BR/tools/tool-search)                                                                             |

## Escolha ferramentas, Skills ou Plugins

<Steps>
  <Step title="Use a tool when the agent needs to act">
    Uma ferramenta é uma função tipada que o agente pode chamar, como `exec`, `browser`,
    `web_search`, `message` ou `image_generate`. Use ferramentas quando o agente
    precisar ler dados, alterar arquivos, enviar mensagens, chamar um provedor ou
    operar outro sistema. As ferramentas visíveis são enviadas ao modelo como
    definições estruturadas de funções.

    O modelo vê somente as ferramentas que permanecem após a aplicação do perfil ativo, da política
    de permissão/negação, das restrições do provedor, do estado do sandbox, das permissões
    do canal e da disponibilidade de Plugins.

  </Step>

  <Step title="Use a skill when the agent needs instructions">
    Uma Skill é um pacote de instruções `SKILL.md` carregado no prompt do agente. Use
    uma Skill quando o agente já tiver as ferramentas necessárias, mas precisar de um
    fluxo de trabalho repetível, critérios de revisão, uma sequência de comandos ou uma
    restrição operacional.

    As Skills podem residir em um workspace, em um diretório compartilhado de Skills, na raiz
    gerenciada de Skills do OpenClaw ou em um pacote de Plugin.

    [Skills](/pt-BR/tools/skills) | [Oficina de Skills](/pt-BR/tools/skill-workshop) | [Criação de Skills](/pt-BR/tools/creating-skills) | [Configuração de Skills](/pt-BR/tools/skills-config)

  </Step>

  <Step title="Use a plugin when OpenClaw needs a new capability">
    Um Plugin pode adicionar ferramentas, Skills, canais, provedores de modelos, fala,
    voz em tempo real, geração de mídia, pesquisa na web, obtenção de conteúdo da web, hooks
    e outros recursos de tempo de execução. Use um Plugin quando o recurso envolver código,
    credenciais, hooks de ciclo de vida, metadados de manifesto ou um
    pacote instalável. Plugins existentes podem ser instalados pelo ClawHub, npm, git,
    diretórios locais ou arquivos compactados.

    [Instalar e configurar Plugins](/pt-BR/tools/plugin) | [Criar Plugins](/pt-BR/plugins/building-plugins) | [SDK de Plugins](/pt-BR/plugins/sdk-overview)

  </Step>
</Steps>

## Categorias de ferramentas integradas

A tabela apresenta ferramentas representativas para que você possa reconhecer a superfície. Ela
não é a referência completa de políticas. Para consultar grupos, padrões e semântica
de permissão/negação exatos, use [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

| Categoria                      | Use quando o agente precisar...                                                        | Ferramentas representativas                                                                            | Leia em seguida                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Tempo de execução              | Executar comandos, gerenciar processos ou usar análise em Python fornecida pelo provedor | `exec`, `process`, `code_execution`                                                                    | [Exec](/pt-BR/tools/exec), [Execução de código](/pt-BR/tools/code-execution)                                 |
| Arquivos                       | Ler e alterar arquivos do workspace                                                    | `read`, `write`, `edit`, `apply_patch`                                                                 | [Aplicar patch](/pt-BR/tools/apply-patch)                                                              |
| Web                            | Pesquisar na web, pesquisar publicações no X ou obter conteúdo legível de páginas      | `web_search`, `x_search`, `web_fetch`                                                                  | [Ferramentas da web](/pt-BR/tools/web), [Obtenção de conteúdo da web](/pt-BR/tools/web-fetch)                 |
| Navegador                      | Operar uma sessão de navegador                                                         | `browser`                                                                                              | [Navegador](/pt-BR/tools/browser)                                                                      |
| Mensagens e canais             | Enviar respostas ou ações de canal                                                     | `message`                                                                                              | [Envio do agente](/pt-BR/tools/agent-send)                                                              |
| Sessões e agentes              | Inspecionar sessões, delegar trabalho, orientar outra execução ou relatar o status     | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal`   | [Objetivo](/pt-BR/tools/goal), [Subagentes](/pt-BR/tools/subagents), [Ferramenta de sessão](/pt-BR/concepts/session-tool) |
| Automação                      | Agendar trabalho ou responder a eventos em segundo plano                               | `cron`, `heartbeat_respond`                                                                            | [Automação](/pt-BR/automation)                                                                          |
| Gateway e Nodes                | Inspecionar o estado do Gateway ou dispositivos de destino pareados                    | `gateway`, `nodes`                                                                                     | [Configuração do Gateway](/pt-BR/gateway/configuration), [Nodes](/pt-BR/nodes)                                |
| Mídia                          | Analisar, gerar ou reproduzir mídia por voz                                            | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                   | [Visão geral de mídia](/pt-BR/tools/media-overview)                                                     |
| Catálogos amplos do OpenClaw   | Pesquisar e chamar muitas ferramentas qualificadas sem enviar todos os esquemas ao modelo | `tool_search_code`, `tool_search`, `tool_describe`                                                   | [Pesquisa de ferramentas](/pt-BR/tools/tool-search)                                                     |

<Note>
A Pesquisa de ferramentas é uma superfície experimental de agentes do OpenClaw. As execuções no ambiente
do Codex usam o modo de código nativo do Codex, a pesquisa nativa de ferramentas, ferramentas dinâmicas
adiadas e chamadas de ferramentas aninhadas em vez de `tools.toolSearch`.
</Note>

## Ferramentas fornecidas por Plugins

Plugins podem registrar ferramentas adicionais. Os autores de Plugins conectam as ferramentas por meio de
`api.registerTool(...)` e de `contracts.tools` no manifesto; use
[SDK de Plugins](/pt-BR/plugins/sdk-overview) e [Manifesto de Plugin](/pt-BR/plugins/manifest)
para obter detalhes dos contratos.

Entre as ferramentas normalmente fornecidas por Plugins estão:

- [Diffs](/pt-BR/tools/diffs) para renderizar diffs de arquivos e Markdown
- [Exibir widget](/tools/show-widget) para SVG e HTML autocontidos e incorporados no chat da web
- [Tarefa de LLM](/pt-BR/tools/llm-task) para etapas de fluxo de trabalho somente em JSON
- [Lobster](/pt-BR/tools/lobster) para fluxos de trabalho tipados com aprovações retomáveis
- [Tokenjuice](/pt-BR/tools/tokenjuice) para compactar a saída ruidosa das ferramentas `exec` e `bash`
- [Pesquisa de ferramentas](/pt-BR/tools/tool-search) para descobrir e chamar grandes catálogos de ferramentas
  sem inserir todos os esquemas no prompt
- [Canvas](/pt-BR/plugins/reference/canvas) para controlar o Canvas do Node e renderizar
  A2UI

## Configure o acesso e as aprovações

A política de ferramentas é aplicada antes da chamada ao modelo. Se a política remover uma ferramenta, o
modelo não receberá o esquema dessa ferramenta no turno. Uma execução pode perder ferramentas
devido à configuração global, à configuração específica do agente, à política do canal, às restrições
do provedor, às regras do sandbox, à política do canal ou do tempo de execução ou à disponibilidade
de Plugins.

- [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) documenta perfis de ferramentas,
  listas de permissão/negação, restrições específicas de provedores, detecção de loops e
  configurações de ferramentas fornecidas por provedores.
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) documenta a política de aprovação de comandos
  do host.
- [Exec elevado](/pt-BR/tools/elevated) documenta a execução controlada fora do
  sandbox.
- [Sandbox versus política de ferramentas versus acesso elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
  explica qual camada controla o acesso a arquivos e processos.
- [Restrições de sandbox e ferramentas por agente](/pt-BR/tools/multi-agent-sandbox-tools)
  documenta restrições específicas do agente para execuções delegadas.

## Amplie os recursos

Escolha o caminho de extensão de acordo com a tarefa que o OpenClaw precisa executar:

- Instale ou gerencie um Plugin existente com [Plugins](/pt-BR/tools/plugin).
- Crie uma nova integração, provedor, canal, ferramenta ou hook com
  [Criar Plugins](/pt-BR/plugins/building-plugins).
- Adicione ou ajuste instruções reutilizáveis de agentes com [Skills](/pt-BR/tools/skills) e
  [Criação de Skills](/pt-BR/tools/creating-skills).
- Use o [SDK de Plugins](/pt-BR/plugins/sdk-overview) e o
  [Manifesto de Plugin](/pt-BR/plugins/manifest) quando precisar de contratos de
  implementação.

## Solucione problemas de ferramentas ausentes

Se o modelo não conseguir ver ou chamar uma ferramenta, comece pela política efetiva para
o turno atual:

1. Verifique o perfil ativo, `tools.allow` e `tools.deny` em
   [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).
2. Verifique as restrições específicas do provedor em
   [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) e confirme se o
   [provedor de modelos](/pt-BR/concepts/model-providers) selecionado oferece suporte ao formato da
   ferramenta.
3. Verifique as permissões do canal, o estado do sandbox e o acesso elevado em
   [Sandbox versus política de ferramentas versus acesso elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
   e [Exec elevado](/pt-BR/tools/elevated).
4. Verifique se o Plugin responsável está instalado e habilitado em
   [Plugins](/pt-BR/tools/plugin).
5. Para execuções delegadas, verifique as restrições por agente em
   [Restrições de sandbox e ferramentas por agente](/pt-BR/tools/multi-agent-sandbox-tools).
6. Para catálogos amplos do OpenClaw, confirme se a execução usa exposição direta de ferramentas
   ou [Pesquisa de ferramentas](/pt-BR/tools/tool-search).

## Relacionado

- [Automação](/pt-BR/automation) para cron, tarefas, heartbeat, compromissos, hooks,
  ordens permanentes e Task Flow
- [Agentes](/pt-BR/concepts/agent) para o modelo de agente, sessões, memória e
  coordenação multiagente
- [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) para a referência
  canônica de políticas de ferramentas
- [Plugins](/pt-BR/tools/plugin) para instalação e gerenciamento de plugins
- [SDK de Plugins](/pt-BR/plugins/sdk-overview) para a referência de autores de plugins
- [Skills](/pt-BR/tools/skills) para ordem de carregamento, controle de acesso e configuração de Skills
- [Oficina de Skills](/pt-BR/tools/skill-workshop) para a criação de Skills
  geradas e revisadas
- [Pesquisa de ferramentas](/pt-BR/tools/tool-search) para descobrir de forma compacta
  o catálogo de ferramentas do OpenClaw
