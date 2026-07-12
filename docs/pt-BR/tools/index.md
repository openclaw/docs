---
doc-schema-version: 1
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você está escolhendo entre ferramentas integradas, Skills e plugins
    - Você precisa do ponto de entrada correto da documentação para políticas de ferramentas, automação ou coordenação de agentes
summary: 'Visão geral das ferramentas, Skills e plugins do OpenClaw: o que os agentes podem chamar e como estendê-los'
title: Visão geral
x-i18n:
    generated_at: "2026-07-12T15:49:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Use esta página para escolher a área de Recursos adequada. **Ferramentas** são
ações que podem ser chamadas, **skills** ensinam os agentes a trabalhar e **plugins** adicionam
recursos de runtime, como ferramentas, provedores, canais, hooks e
skills empacotadas.

Esta é uma página de visão geral e direcionamento. Para consultar políticas completas de ferramentas, padrões,
participação em grupos, restrições de provedores e campos de configuração, acesse
[Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Comece aqui

Para a maioria dos agentes, comece pelas categorias de ferramentas integradas e ajuste a política
somente quando o agente precisar acessar menos ferramentas ou precisar de acesso explícito ao host.

| Se você precisar...                                    | Use isto primeiro                                      | Depois, leia                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Permitir que um agente atue com os recursos existentes | [Ferramentas integradas](#built-in-tool-categories)    | [Categorias de ferramentas](#built-in-tool-categories)                                                                          |
| Controlar o que um agente pode chamar                  | [Política de ferramentas](#configure-access-and-approvals) | [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools)                                                             |
| Ensinar um fluxo de trabalho a um agente               | [Skills](#choose-tools-skills-or-plugins)               | [Skills](/pt-BR/tools/skills), [Criação de skills](/pt-BR/tools/creating-skills) e [Oficina de Skills](/pt-BR/tools/skill-workshop)                |
| Adicionar uma nova integração ou área de runtime       | [Plugins](#extend-capabilities)                         | [Plugins](/pt-BR/tools/plugin) e [Criar plugins](/pt-BR/plugins/building-plugins)                                                            |
| Executar trabalhos posteriormente ou em segundo plano  | [Automação](/pt-BR/automation)                                | [Visão geral da automação](/pt-BR/automation)                                                                                          |
| Coordenar vários agentes ou harnesses                  | [Subagentes](/pt-BR/tools/subagents)                          | [Agentes ACP](/pt-BR/tools/acp-agents) e [Envio do agente](/pt-BR/tools/agent-send)                                                          |
| Pesquisar um grande catálogo de ferramentas do OpenClaw | [Pesquisa de Ferramentas](/pt-BR/tools/tool-search)          | [Pesquisa de Ferramentas](/pt-BR/tools/tool-search)                                                                                    |

## Escolha ferramentas, skills ou plugins

<Steps>
  <Step title="Use uma ferramenta quando o agente precisar agir">
    Uma ferramenta é uma função tipada que o agente pode chamar, como `exec`, `browser`,
    `web_search`, `message` ou `image_generate`. Use ferramentas quando o agente
    precisar ler dados, alterar arquivos, enviar mensagens, chamar um provedor ou
    operar outro sistema. As ferramentas visíveis são enviadas ao modelo como definições
    estruturadas de funções.

    O modelo vê apenas as ferramentas que passam pelo perfil ativo, pela política de
    permissão/negação, pelas restrições do provedor, pelo estado do sandbox, pelas permissões
    do canal e pela disponibilidade de plugins.

  </Step>

  <Step title="Use uma skill quando o agente precisar de instruções">
    Uma skill é um pacote de instruções `SKILL.md` carregado no prompt do agente. Use
    uma skill quando o agente já tiver as ferramentas necessárias, mas precisar de um
    fluxo de trabalho repetível, critérios de revisão, uma sequência de comandos ou uma
    restrição operacional.

    As Skills podem residir em um workspace, diretório compartilhado de skills, raiz gerenciada
    de skills do OpenClaw ou pacote de plugin.

    [Skills](/pt-BR/tools/skills) | [Oficina de Skills](/pt-BR/tools/skill-workshop) | [Criação de skills](/pt-BR/tools/creating-skills) | [Configuração de skills](/pt-BR/tools/skills-config)

  </Step>

  <Step title="Use um plugin quando o OpenClaw precisar de um novo recurso">
    Um plugin pode adicionar ferramentas, skills, canais, provedores de modelos, fala,
    voz em tempo real, geração de mídia, pesquisa na web, busca de conteúdo web, hooks e outros
    recursos de runtime. Use um plugin quando o recurso envolver código,
    credenciais, hooks de ciclo de vida, metadados de manifesto ou
    empacotamento instalável. Plugins existentes podem ser instalados pelo ClawHub, npm, git,
    diretórios locais ou arquivos compactados.

    [Instalar e configurar plugins](/pt-BR/tools/plugin) | [Criar plugins](/pt-BR/plugins/building-plugins) | [SDK de Plugin](/pt-BR/plugins/sdk-overview)

  </Step>
</Steps>

## Categorias de ferramentas integradas

A tabela lista ferramentas representativas para que você possa reconhecer a área. Ela
não é a referência completa de políticas. Para consultar os grupos, padrões e a semântica
de permissão/negação exatos, acesse [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

| Categoria                   | Use quando o agente precisar...                                                     | Ferramentas representativas                                                                           | Leia em seguida                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Runtime                     | Executar comandos, gerenciar processos ou usar análise em Python fornecida por provedor | `exec`, `process`, `code_execution`                                                                | [Exec](/pt-BR/tools/exec), [Execução de código](/pt-BR/tools/code-execution)                                 |
| Arquivos                    | Ler e alterar arquivos do workspace                                                 | `read`, `write`, `edit`, `apply_patch`                                                               | [Aplicar patch](/pt-BR/tools/apply-patch)                                                              |
| Web                         | Pesquisar na web, pesquisar publicações no X ou buscar conteúdo legível de páginas  | `web_search`, `x_search`, `web_fetch`                                                                | [Ferramentas web](/pt-BR/tools/web), [Busca de conteúdo web](/pt-BR/tools/web-fetch)                          |
| Navegador                   | Operar uma sessão do navegador                                                       | `browser`                                                                                            | [Navegador](/pt-BR/tools/browser)                                                                      |
| Mensagens e canais          | Enviar respostas ou ações de canal                                                   | `message`                                                                                            | [Envio do agente](/pt-BR/tools/agent-send)                                                             |
| Sessões e agentes           | Inspecionar sessões, delegar trabalho, orientar outra execução ou informar o status | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Meta](/pt-BR/tools/goal), [Subagentes](/pt-BR/tools/subagents), [Ferramenta de sessão](/pt-BR/concepts/session-tool) |
| Automação                   | Agendar trabalho ou responder a eventos em segundo plano                             | `cron`, `heartbeat_respond`                                                                          | [Automação](/pt-BR/automation)                                                                         |
| Gateway e nodes             | Inspecionar o estado do Gateway ou dispositivos de destino pareados                  | `gateway`, `nodes`                                                                                   | [Configuração do Gateway](/pt-BR/gateway/configuration), [Nodes](/pt-BR/nodes)                               |
| Mídia                       | Analisar, gerar ou reproduzir mídia por voz                                           | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [Visão geral de mídia](/pt-BR/tools/media-overview)                                                    |
| Grandes catálogos do OpenClaw | Pesquisar e chamar várias ferramentas qualificadas sem enviar todos os esquemas ao modelo | `tool_search_code`, `tool_search`, `tool_describe`                                               | [Pesquisa de Ferramentas](/pt-BR/tools/tool-search)                                                    |

<Note>
A Pesquisa de Ferramentas é uma área experimental para agentes do OpenClaw. As execuções no harness do Codex usam
o modo de código nativo do Codex, pesquisa nativa de ferramentas, ferramentas dinâmicas adiadas e
chamadas de ferramentas aninhadas em vez de `tools.toolSearch`.
</Note>

## Ferramentas fornecidas por plugins

Os Plugins podem registrar ferramentas adicionais. Os autores de plugins conectam ferramentas por meio de
`api.registerTool(...)` e de `contracts.tools` no manifesto; consulte
[SDK de Plugin](/pt-BR/plugins/sdk-overview) e [Manifesto do plugin](/pt-BR/plugins/manifest)
para obter detalhes do contrato.

Ferramentas comuns fornecidas por plugins incluem:

- [Diffs](/pt-BR/tools/diffs) para renderizar diffs de arquivos e Markdown
- [Exibir widget](/tools/show-widget) para SVG e HTML inline autocontidos no chat da web
- [Tarefa de LLM](/pt-BR/tools/llm-task) para etapas de fluxo de trabalho somente em JSON
- [Lobster](/pt-BR/tools/lobster) para fluxos de trabalho tipados com aprovações retomáveis
- [Tokenjuice](/pt-BR/tools/tokenjuice) para compactar a saída ruidosa das ferramentas `exec` e `bash`
- [Pesquisa de Ferramentas](/pt-BR/tools/tool-search) para descobrir e chamar grandes catálogos de
  ferramentas sem incluir todos os esquemas no prompt
- [Canvas](/pt-BR/plugins/reference/canvas) para controle do Canvas do node e renderização
  A2UI

## Configure o acesso e as aprovações

A política de ferramentas é aplicada antes da chamada ao modelo. Se a política remover uma ferramenta, o
modelo não receberá o esquema dessa ferramenta no turno. Uma execução pode perder ferramentas
devido à configuração global, à configuração por agente, à política do canal, às restrições
do provedor, às regras do sandbox, à política do canal/runtime ou à disponibilidade de plugins.

- [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) documenta perfis de ferramentas,
  listas de permissão/negação, restrições específicas de provedores, detecção de loops e
  configurações de ferramentas fornecidas por provedores.
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) documenta a política de aprovação de
  comandos do host.
- [Exec elevado](/pt-BR/tools/elevated) documenta a execução controlada fora do
  sandbox.
- [Sandbox versus política de ferramentas versus modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
  explica qual camada controla o acesso a arquivos e processos.
- [Restrições de sandbox e ferramentas por agente](/pt-BR/tools/multi-agent-sandbox-tools)
  documenta restrições específicas do agente para execuções delegadas.

## Amplie os recursos

Escolha o caminho de extensão conforme a tarefa que você precisa que o OpenClaw execute:

- Instale ou gerencie um plugin existente com [Plugins](/pt-BR/tools/plugin).
- Crie uma nova integração, provedor, canal, ferramenta ou hook com
  [Criar plugins](/pt-BR/plugins/building-plugins).
- Adicione ou ajuste instruções reutilizáveis para agentes com [Skills](/pt-BR/tools/skills) e
  [Criação de skills](/pt-BR/tools/creating-skills).
- Use o [SDK de Plugin](/pt-BR/plugins/sdk-overview) e o
  [Manifesto do plugin](/pt-BR/plugins/manifest) quando precisar de contratos de
  implementação.

## Solucione problemas de ferramentas ausentes

Se o modelo não conseguir ver ou chamar uma ferramenta, comece pela política efetiva do
turno atual:

1. Verifique o perfil ativo, `tools.allow` e `tools.deny` em
   [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).
2. Verifique as restrições específicas do provedor em
   [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) e confirme se o
   [provedor de modelo](/pt-BR/concepts/model-providers) selecionado é compatível com o formato da
   ferramenta.
3. Verifique as permissões do canal, o estado do sandbox e o acesso elevado em
   [Sandbox versus política de ferramentas versus modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
   e [Exec elevado](/pt-BR/tools/elevated).
4. Verifique se o plugin responsável está instalado e habilitado em
   [Plugins](/pt-BR/tools/plugin).
5. Para execuções delegadas, verifique as restrições por agente em
   [Restrições de sandbox e ferramentas por agente](/pt-BR/tools/multi-agent-sandbox-tools).
6. Para grandes catálogos do OpenClaw, confirme se a execução usa exposição direta de
   ferramentas ou a [Pesquisa de Ferramentas](/pt-BR/tools/tool-search).

## Relacionados

- [Automação](/pt-BR/automation) para cron, tarefas, heartbeat, compromissos, hooks,
  ordens permanentes e Task Flow
- [Agentes](/pt-BR/concepts/agent) para o modelo de agente, sessões, memória e
  coordenação multiagente
- [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) para a referência
  canônica de políticas de ferramentas
- [Plugins](/pt-BR/tools/plugin) para instalação e gerenciamento de plugins
- [SDK de Plugin](/pt-BR/plugins/sdk-overview) para a referência de autores de plugins
- [Skills](/pt-BR/tools/skills) para ordem de carregamento, controle de acesso e configuração de skills
- [Workshop de Skills](/pt-BR/tools/skill-workshop) para criação de skills
  geradas e revisadas
- [Pesquisa de ferramentas](/pt-BR/tools/tool-search) para descoberta compacta do catálogo
  de ferramentas do OpenClaw
