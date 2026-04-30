---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e plugins
summary: 'Visão geral das ferramentas e plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e plugins
x-i18n:
    generated_at: "2026-04-30T16:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

Tudo que o agente faz além de gerar texto acontece por meio de **ferramentas**.
Ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

O OpenClaw tem três camadas que funcionam em conjunto:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas integradas**, e
    plugins podem registrar outras.

    O agente vê as ferramentas como definições de função estruturadas enviadas à API do modelo.

  </Step>

  <Step title="Skills ensinam o agente quando e como agir">
    Uma Skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas com eficácia. Skills ficam no seu workspace, em pastas compartilhadas
    ou são incluídas em plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criando Skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, provedores de modelo, ferramentas, Skills, fala, transcrição em tempo real,
    voz em tempo real, compreensão de mídia, geração de imagens, geração de vídeos,
    busca de páginas web, pesquisa na web e muito mais. Alguns plugins são **centrais** (incluídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instale e configure plugins](/pt-BR/tools/plugin) | [Crie o seu](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas são incluídas no OpenClaw e estão disponíveis sem instalar plugins:

| Ferramenta                                | O que ela faz                                                        | Página                                                       |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Executar comandos de shell, gerenciar processos em segundo plano     | [Exec](/pt-BR/tools/exec), [Aprovações de Exec](/pt-BR/tools/exec-approvals) |
| `code_execution`                          | Executar análise Python remota em sandbox                            | [Execução de Código](/pt-BR/tools/code-execution)                  |
| `browser`                                 | Controlar um navegador Chromium (navegar, clicar, capturar tela)     | [Navegador](/pt-BR/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`   | Pesquisar na web, pesquisar publicações no X, buscar conteúdo de páginas | [Web](/pt-BR/tools/web), [Busca de Página Web](/pt-BR/tools/web-fetch) |
| `read` / `write` / `edit`                 | E/S de arquivos no workspace                                         |                                                              |
| `apply_patch`                             | Patches de arquivo com múltiplos hunks                               | [Aplicar Patch](/pt-BR/tools/apply-patch)                         |
| `message`                                 | Enviar mensagens por todos os canais                                 | [Envio pelo Agente](/pt-BR/tools/agent-send)                      |
| `canvas`                                  | Controlar node Canvas (apresentar, avaliar, snapshot)                |                                                              |
| `nodes`                                   | Descobrir e direcionar dispositivos pareados                         |                                                              |
| `cron` / `gateway`                        | Gerenciar tarefas agendadas; inspecionar, aplicar patches, reiniciar ou atualizar o Gateway |                                                              |
| `image` / `image_generate`                | Analisar ou gerar imagens                                            | [Geração de Imagens](/pt-BR/tools/image-generation)                |
| `music_generate`                          | Gerar faixas musicais                                                | [Geração de Música](/pt-BR/tools/music-generation)                 |
| `video_generate`                          | Gerar vídeos                                                         | [Geração de Vídeo](/pt-BR/tools/video-generation)                  |
| `tts`                                     | Conversão pontual de texto em fala                                   | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessões, status e orquestração de subagentes       | [Subagentes](/pt-BR/tools/subagents)                              |
| `session_status`                          | Retorno leve no estilo `/status` e substituição do modelo da sessão  | [Ferramentas de Sessão](/pt-BR/concepts/session-tool)              |

Para trabalho com imagens, use `image` para análise e `image_generate` para geração ou edição. Se você direcionar para `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você direcionar para `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você direcionar para `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por workflow, use `music_generate` quando um plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é texto para fala.

`session_status` é a ferramenta leve de status/retorno no grupo de sessões.
Ela responde a perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Como `/status`, ela pode preencher retroativamente contadores esparsos de tokens/cache e o
rótulo do modelo de runtime ativo a partir da entrada de uso mais recente do transcript.

`gateway` é a ferramenta de runtime exclusiva do proprietário para operações do Gateway:

- `config.schema.lookup` para uma subárvore de configuração com escopo de caminho antes de edições
- `config.get` para o snapshot da configuração atual + hash
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa da configuração
- `update.run` para autoatualização explícita + reinicialização

Para mudanças parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você tiver a intenção de substituir a configuração inteira.
Para documentação de configuração mais ampla, leia [Configuração](/pt-BR/gateway/configuration) e
[Referência de configuração](/pt-BR/gateway/configuration-reference).
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos de exec protegidos.

### Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diffs
- [Tarefa LLM](/pt-BR/tools/llm-task) — etapa LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [Geração de Música](/pt-BR/tools/music-generation) — ferramenta `music_generate` compartilhada com provedores baseados em workflow
- [OpenProse](/pt-BR/prose) — orquestração de workflow markdown-first
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos das ferramentas `exec` e `bash`

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar via `tools.allow` / `tools.deny` na
configuração. Negação sempre prevalece sobre permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

O OpenClaw falha de forma fechada quando uma lista de permissões explícita não resolve para nenhuma ferramenta chamável.
Por exemplo, `tools.allow: ["query_db"]` só funciona se um plugin carregado realmente
registrar `query_db`. Se nenhuma ferramenta integrada, plugin ou MCP empacotada corresponder à
lista de permissões, a execução para antes da chamada ao modelo em vez de continuar como uma
execução somente texto que poderia alucinar resultados de ferramentas.

### Perfis de ferramentas

`tools.profile` define uma lista de permissões base antes de `allow`/`deny` ser aplicado.
Substituição por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Base sem restrições para acesso mais amplo de comando/controle; igual a deixar `tools.profile` indefinido                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Apenas `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` é intencionalmente restrito para agentes focados em canais.
Ele deixa de fora ferramentas mais amplas de comando/controle, como sistema de arquivos, runtime,
navegador, canvas, nodes, cron e controle do Gateway. Use `tools.profile: "full"`
como a base sem restrições para acesso mais amplo de comando/controle e, em seguida, reduza o
acesso com `tools.allow` / `tools.deny` quando necessário.
</Note>

`coding` inclui ferramentas web leves (`web_search`, `web_fetch`, `x_search`),
mas não a ferramenta completa de controle de navegador. A automação de navegador pode controlar
sessões reais e perfis autenticados, então adicione-a explicitamente com
`tools.alsoAllow: ["browser"]` ou por agente
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Configurar `tools.exec` ou `tools.fs` em um perfil restritivo (`messaging`, `minimal`) não amplia implicitamente a lista de permissões do perfil. Adicione entradas explícitas em `tools.alsoAllow` (por exemplo, `["exec", "process"]` para exec, ou `["read", "write", "edit"]` para fs) quando você quiser que um perfil restritivo use essas seções configuradas. O OpenClaw registra um aviso de inicialização quando uma seção de configuração está presente sem uma concessão `alsoAllow` correspondente.
</Note>

Os perfis `coding` e `messaging` também permitem ferramentas MCP de bundle configuradas
sob a chave de plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando você
quiser que um perfil mantenha seus recursos integrados normais, mas oculte todas as ferramentas MCP configuradas.
O perfil `minimal` não inclui ferramentas MCP de bundle.

Exemplo (superfície de ferramentas mais ampla por padrão):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grupos de ferramentas

Use atalhos `group:*` em listas de permissão/negação:

| Grupo              | Ferramentas                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como um alias para `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Todas as ferramentas integradas do OpenClaw (exclui ferramentas de Plugin)                                |

`sessions_history` retorna uma visualização de recuperação limitada e filtrada por segurança. Ela remove
tags de pensamento, estruturas auxiliares de `<relevant-memories>`, cargas XML
de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta),
estruturas auxiliares rebaixadas de chamadas de ferramenta, tokens de controle
de modelo ASCII/de largura total vazados e XML de chamadas de ferramenta MiniMax
malformado do texto do assistente; em seguida, aplica redação/truncamento e
possíveis marcadores de posição para linhas grandes demais, em vez de agir
como um despejo bruto de transcrição.

### Restrições específicas de provedor

Use `tools.byProvider` para restringir ferramentas para provedores específicos sem
alterar os padrões globais:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
