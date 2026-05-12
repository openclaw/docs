---
doc-schema-version: 1
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você está decidindo entre ferramentas integradas, Skills e plugins
    - Você precisa do ponto de entrada correto da documentação para a política de ferramentas, automação ou coordenação de agentes
summary: 'Visão geral das ferramentas, Skills e plugins do OpenClaw: o que os agentes podem chamar e como estendê-los'
title: Visão geral
x-i18n:
    generated_at: "2026-05-12T01:00:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Use esta página para escolher a superfície de Capacidades correta. **Ferramentas** são
ações chamáveis, **Skills** ensinam os agentes a trabalhar, e **plugins** adicionam
recursos de runtime, como ferramentas, provedores, canais, hooks e Skills empacotadas.

Esta é uma página de visão geral e roteamento. Para política completa de ferramentas, padrões,
participação em grupos, restrições de provedores e campos de configuração, use
[Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Comece aqui

Para a maioria dos agentes, comece com as categorias de ferramentas integradas e depois ajuste a política
somente quando o agente deve ver menos ferramentas ou precisar de acesso explícito ao host.

| Se você precisa...                          | Use isto primeiro                              | Depois leia                                                            |
| ------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Permitir que um agente atue com capacidades existentes | [Ferramentas integradas](#built-in-tool-categories) | [Categorias de ferramentas](#built-in-tool-categories)                 |
| Controlar o que um agente pode chamar       | [Política de ferramentas](#configure-access-and-approvals) | [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools)       |
| Ensinar um fluxo de trabalho a um agente    | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/pt-BR/tools/skills) e [Criação de Skills](/pt-BR/tools/creating-skills)  |
| Adicionar uma nova integração ou superfície de runtime | [Plugins](#extend-capabilities)                | [Plugins](/pt-BR/tools/plugin) e [Criar plugins](/pt-BR/plugins/building-plugins) |
| Executar trabalho depois ou em segundo plano | [Automação](/pt-BR/automation)                       | [Visão geral da automação](/pt-BR/automation)                                |
| Coordenar vários agentes ou harnesses       | [Subagentes](/pt-BR/tools/subagents)                 | [Agentes ACP](/pt-BR/tools/acp-agents) e [Envio de agente](/pt-BR/tools/agent-send) |
| Pesquisar um grande catálogo de ferramentas PI | [Pesquisa de Ferramentas](/pt-BR/tools/tool-search)  | [Pesquisa de Ferramentas](/pt-BR/tools/tool-search)                          |

## Escolha ferramentas, Skills ou plugins

<Steps>
  <Step title="Use uma ferramenta quando o agente precisa agir">
    Uma ferramenta é uma função tipada que o agente pode chamar, como `exec`, `browser`,
    `web_search`, `message` ou `image_generate`. Use ferramentas quando o agente
    precisa ler dados, alterar arquivos, enviar mensagens, chamar um provedor ou operar
    outro sistema. Ferramentas visíveis são enviadas ao modelo como definições de função
    estruturadas.

    O modelo só vê ferramentas que sobrevivem ao perfil ativo, à política de permissão/negação,
    às restrições do provedor, ao estado do sandbox, às permissões do canal e
    à disponibilidade do plugin.

  </Step>

  <Step title="Use uma Skill quando o agente precisa de instruções">
    Uma Skill é um pacote de instruções `SKILL.md` carregado no prompt do agente. Use uma
    Skill quando o agente já tem as ferramentas de que precisa, mas precisa de um
    fluxo de trabalho repetível, rubrica de revisão, sequência de comandos ou restrição operacional.

    Skills podem ficar em um workspace, diretório compartilhado de Skills, raiz de
    Skills gerenciada pelo OpenClaw ou pacote de plugin.

    [Skills](/pt-BR/tools/skills) | [Criação de Skills](/pt-BR/tools/creating-skills) | [Configuração de Skills](/pt-BR/tools/skills-config)

  </Step>

  <Step title="Use um plugin quando o OpenClaw precisa de uma nova capacidade">
    Um plugin pode adicionar ferramentas, Skills, canais, provedores de modelo, fala, voz em tempo real,
    geração de mídia, pesquisa na web, busca na web, hooks e outras capacidades de runtime.
    Use um plugin quando a capacidade envolve código, credenciais,
    hooks de ciclo de vida, metadados de manifesto ou empacotamento instalável. Plugins existentes
    podem ser instalados do ClawHub, npm, git, diretórios locais ou
    arquivos compactados.

    [Instalar e configurar plugins](/pt-BR/tools/plugin) | [Criar plugins](/pt-BR/plugins/building-plugins) | [Plugin SDK](/pt-BR/plugins/sdk-overview)

  </Step>
</Steps>

## Categorias de ferramentas integradas

A tabela lista ferramentas representativas para que você reconheça a superfície. Ela
não é a referência completa de política. Para grupos exatos, padrões e semântica de
permissão/negação, use [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

| Categoria              | Use quando o agente precisa...                                               | Ferramentas representativas                                           | Leia a seguir                                                          |
| ---------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Runtime                | Executar comandos, gerenciar processos ou usar análise Python apoiada por provedor | `exec`, `process`, `code_execution`                                  | [Exec](/pt-BR/tools/exec), [Execução de código](/pt-BR/tools/code-execution)       |
| Arquivos               | Ler e alterar arquivos do workspace                                           | `read`, `write`, `edit`, `apply_patch`                               | [Aplicar patch](/pt-BR/tools/apply-patch)                                    |
| Web                    | Pesquisar na web, pesquisar posts do X ou buscar conteúdo legível de páginas  | `web_search`, `x_search`, `web_fetch`                                | [Ferramentas web](/pt-BR/tools/web), [Busca web](/pt-BR/tools/web-fetch)           |
| Navegador              | Operar uma sessão de navegador                                                | `browser`                                                            | [Navegador](/pt-BR/tools/browser)                                            |
| Mensagens e canais     | Enviar respostas ou ações de canal                                            | `message`                                                            | [Envio de agente](/pt-BR/tools/agent-send)                                   |
| Sessões e agentes      | Inspecionar sessões, delegar trabalho, orientar outra execução ou relatar status | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [Subagentes](/pt-BR/tools/subagents), [Ferramenta de sessão](/pt-BR/concepts/session-tool) |
| Automação              | Agendar trabalho ou responder a eventos em segundo plano                      | `cron`, `heartbeat_respond`                                          | [Automação](/pt-BR/automation)                                               |
| Gateway e nós          | Inspecionar o estado do Gateway ou dispositivos de destino pareados           | `gateway`, `nodes`                                                   | [Configuração do Gateway](/pt-BR/gateway/configuration), [Nós](/pt-BR/nodes)       |
| Mídia                  | Analisar, gerar ou falar mídia                                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Visão geral de mídia](/pt-BR/tools/media-overview)                          |
| Grandes catálogos PI   | Pesquisar e chamar muitas ferramentas elegíveis sem enviar todos os schemas ao modelo | `tool_search_code`, `tool_search`, `tool_describe`                   | [Pesquisa de Ferramentas](/pt-BR/tools/tool-search)                          |

<Note>
Tool Search é uma superfície experimental de agente PI. Execuções do harness Codex usam
modo de código nativo do Codex, pesquisa de ferramentas nativa, ferramentas dinâmicas adiadas e chamadas de
ferramentas aninhadas em vez de `tools.toolSearch`.
</Note>

## Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Autores de plugins conectam ferramentas por meio de
`api.registerTool(...)` e `contracts.tools` do manifesto; use
[Plugin SDK](/pt-BR/plugins/sdk-overview) e [Manifesto do plugin](/pt-BR/plugins/manifest)
para detalhes do contrato.

Ferramentas comuns fornecidas por plugins incluem:

- [Diffs](/pt-BR/tools/diffs) para renderizar diffs de arquivos e markdown
- [LLM Task](/pt-BR/tools/llm-task) para etapas de fluxo de trabalho somente JSON
- [Lobster](/pt-BR/tools/lobster) para fluxos de trabalho tipados com aprovações retomáveis
- [Tokenjuice](/pt-BR/tools/tokenjuice) para compactar saída ruidosa das ferramentas `exec` e `bash`
- [Tool Search](/pt-BR/tools/tool-search) para descobrir e chamar grandes catálogos de ferramentas
  sem colocar todos os schemas no prompt
- [Canvas](/pt-BR/plugins/reference/canvas) para controle de Canvas de nós e renderização A2UI

## Configurar acesso e aprovações

A política de ferramentas é aplicada antes da chamada do modelo. Se a política remove uma ferramenta, o
modelo não recebe o schema dessa ferramenta para o turno. Uma execução pode perder ferramentas
por causa de configuração global, configuração por agente, política de canal, restrições de
provedor, regras de sandbox, bloqueio somente para proprietário ou disponibilidade de plugin.

- [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) documenta perfis de ferramentas,
  listas de permissão/negação, restrições específicas de provedor, detecção de loop e
  configurações de ferramentas apoiadas por provedor.
- [Aprovações de exec](/pt-BR/tools/exec-approvals) documenta a política de aprovação de comandos do host.
- [Exec elevado](/pt-BR/tools/elevated) documenta execução controlada fora do
  sandbox.
- [Sandbox vs política de ferramentas vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) explica qual camada controla o acesso a arquivos e processos.
- [Sandbox por agente e restrições de ferramentas](/pt-BR/tools/multi-agent-sandbox-tools)
  documenta restrições específicas de agente para execuções delegadas.

## Estender capacidades

Escolha o caminho de extensão pelo trabalho que você precisa que o OpenClaw faça:

- Instale ou gerencie um plugin existente com [Plugins](/pt-BR/tools/plugin).
- Crie uma nova integração, provedor, canal, ferramenta ou hook com
  [Criar plugins](/pt-BR/plugins/building-plugins).
- Adicione ou ajuste instruções reutilizáveis de agente com [Skills](/pt-BR/tools/skills) e
  [Criação de Skills](/pt-BR/tools/creating-skills).
- Empacote material de fluxo de trabalho reutilizável com
  [Workshop de Skills](/pt-BR/plugins/skill-workshop) quando o fluxo de trabalho pertence a um
  pacote de Skills distribuído por plugin.
- Use [Plugin SDK](/pt-BR/plugins/sdk-overview) e [Manifesto do plugin](/pt-BR/plugins/manifest) quando precisar de contratos de implementação.

## Solucionar problemas de ferramentas ausentes

Se o modelo não consegue ver ou chamar uma ferramenta, comece pela política efetiva para o
turno atual:

1. Verifique o perfil ativo, `tools.allow` e `tools.deny` em
   [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).
2. Verifique restrições específicas de provedor em
   [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) e confirme se o
   [provedor de modelo](/pt-BR/concepts/model-providers) selecionado é compatível com o formato da ferramenta.
3. Verifique permissões de canal, estado do sandbox e acesso elevado com
   [Sandbox vs política de ferramentas vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) e [Exec elevado](/pt-BR/tools/elevated).
4. Verifique se o plugin proprietário está instalado e habilitado em
   [Plugins](/pt-BR/tools/plugin).
5. Para execuções delegadas, verifique restrições por agente em
   [Sandbox por agente e restrições de ferramentas](/pt-BR/tools/multi-agent-sandbox-tools).
6. Para grandes catálogos PI, confirme se a execução usa exposição direta de ferramentas ou
   [Tool Search](/pt-BR/tools/tool-search).

## Relacionados

- [Automação](/pt-BR/automation) para cron, tarefas, Heartbeat, compromissos, hooks, ordens permanentes e Task Flow
- [Agentes](/pt-BR/concepts/agent) para o modelo de agente, sessões, memória e coordenação multiagente
- [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) para a referência canônica de política de ferramentas
- [Plugins](/pt-BR/tools/plugin) para instalação e gerenciamento de plugins
- [Plugin SDK](/pt-BR/plugins/sdk-overview) para referência de autores de plugins
- [Skills](/pt-BR/tools/skills) para ordem de carregamento, bloqueio e configuração de Skills
- [Tool Search](/pt-BR/tools/tool-search) para descoberta compacta de catálogos de ferramentas PI
