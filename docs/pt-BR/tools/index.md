---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e plugins
summary: 'Visão geral das ferramentas e plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e plugins
x-i18n:
    generated_at: "2026-05-10T19:52:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
Ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

OpenClaw tem três camadas que funcionam juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). OpenClaw inclui um conjunto de **ferramentas integradas** e
    plugins podem registrar outras.

    O agente vê ferramentas como definições de função estruturadas enviadas à API do modelo.

  </Step>

  <Step title="Skills ensinam ao agente quando e como">
    Uma skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills fornecem ao agente contexto, restrições e orientações passo a passo para
    usar ferramentas de forma eficaz. Skills ficam no seu workspace, em pastas compartilhadas,
    ou são incluídas em plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Como criar skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um plugin é um pacote que pode registrar qualquer combinação de recursos:
    canais, provedores de modelo, ferramentas, skills, fala, transcrição em tempo real,
    voz em tempo real, entendimento de mídia, geração de imagens, geração de vídeos,
    busca de conteúdo web, pesquisa na web e mais. Alguns plugins são **core** (incluídos com
    OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar plugins](/pt-BR/tools/plugin) | [Crie o seu próprio](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas vêm com OpenClaw e estão disponíveis sem instalar nenhum plugin:

| Ferramenta                                | O que ela faz                                                        | Página                                                       |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Executa comandos shell, gerencia processos em segundo plano          | [Exec](/pt-BR/tools/exec), [Aprovações de Exec](/pt-BR/tools/exec-approvals) |
| `code_execution`                          | Executa análise Python remota em sandbox                            | [Execução de Código](/pt-BR/tools/code-execution)                  |
| `browser`                                 | Controla um navegador Chromium (navegar, clicar, capturar tela)      | [Navegador](/pt-BR/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`   | Pesquisa na web, pesquisa posts do X, busca conteúdo de páginas      | [Web](/pt-BR/tools/web), [Busca de Conteúdo Web](/pt-BR/tools/web-fetch) |
| `read` / `write` / `edit`                 | E/S de arquivos no workspace                                        |                                                              |
| `apply_patch`                             | Patches de arquivo com múltiplos hunks                              | [Aplicar Patch](/pt-BR/tools/apply-patch)                          |
| `message`                                 | Envia mensagens por todos os canais                                 | [Envio pelo Agente](/pt-BR/tools/agent-send)                       |
| `nodes`                                   | Descobre e direciona dispositivos pareados                          |                                                              |
| `cron` / `gateway`                        | Gerencia tarefas agendadas; inspeciona, aplica patch, reinicia ou atualiza o Gateway |                                                              |
| `image` / `image_generate`                | Analisa ou gera imagens                                             | [Geração de Imagens](/pt-BR/tools/image-generation)                |
| `music_generate`                          | Gera faixas musicais                                                | [Geração de Música](/pt-BR/tools/music-generation)                 |
| `video_generate`                          | Gera vídeos                                                        | [Geração de Vídeo](/pt-BR/tools/video-generation)                  |
| `tts`                                     | Conversão pontual de texto em fala                                  | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessões, status e orquestração de subagentes       | [Subagentes](/pt-BR/tools/subagents)                               |
| `session_status`                          | Retorno leve no estilo `/status` e override de modelo da sessão      | [Ferramentas de Sessão](/pt-BR/concepts/session-tool)              |

Para trabalho com imagens, use `image` para análise e `image_generate` para geração ou edição. Se você direcionar para `openai/*`, `google/*`, `fal/*` ou outro provedor de imagens não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você direcionar para `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você direcionar para `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por workflow, use `music_generate` quando um plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é texto para fala.

`session_status` é a ferramenta leve de status/retorno no grupo de sessões.
Ela responde perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir um override de modelo por sessão; `model=default` limpa esse
override. Assim como `/status`, ela pode preencher contadores esparsos de tokens/cache e o
rótulo do modelo de runtime ativo a partir da entrada de uso mais recente do transcript.

`gateway` é a ferramenta de runtime exclusiva do owner para operações do Gateway:

- `config.schema.lookup` para uma subárvore de configuração com escopo de caminho antes de edições
- `config.get` para o snapshot + hash da configuração atual
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` somente para substituição completa de configuração
- `update.run` para autoatualização + reinicialização explícitas

Para alterações parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` somente quando você pretende substituir a configuração inteira.
Para documentação de configuração mais ampla, leia [Configuração](/pt-BR/gateway/configuration) e
[Referência de configuração](/pt-BR/gateway/configuration-reference).
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos exec protegidos.

### Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Canvas](/pt-BR/plugins/reference/canvas) — plugin experimental incluído para controle de Canvas de Node e renderização A2UI
- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diffs
- [Tarefa LLM](/pt-BR/tools/llm-task) — etapa LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [Geração de Música](/pt-BR/tools/music-generation) — ferramenta compartilhada `music_generate` com provedores baseados em workflow
- [OpenProse](/pt-BR/prose) — orquestração de workflow com markdown em primeiro lugar
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos das ferramentas `exec` e `bash`

Ferramentas de plugin ainda são criadas com `api.registerTool(...)` e declaradas na
lista `contracts.tools` do manifesto do plugin. OpenClaw captura o descritor de
ferramenta validado durante a descoberta e o armazena em cache por origem e contrato do plugin, para que
o planejamento posterior de ferramentas possa pular o carregamento do runtime do plugin. A execução da ferramenta ainda carrega
o plugin proprietário e chama a implementação registrada ativa.

[Pesquisa de Ferramentas](/pt-BR/tools/tool-search) é a superfície compacta
para catálogos grandes. Em vez de colocar todo schema de ferramenta OpenClaw, MCP ou cliente
no prompt, OpenClaw pode fornecer ao modelo um runtime Node isolado
com `openclaw.tools.search`, `openclaw.tools.describe` e
`openclaw.tools.call`. As chamadas ainda retornam pelo Gateway, então políticas
de ferramentas, aprovações, hooks e logs de sessão continuam sendo a autoridade.

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar via `tools.allow` / `tools.deny` na
configuração. A negação sempre vence a permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw falha fechado quando uma allowlist explícita não resolve para nenhuma ferramenta chamável.
Por exemplo, `tools.allow: ["query_db"]` só funciona se um plugin carregado de fato
registrar `query_db`. Se nenhuma ferramenta integrada, plugin ou ferramenta MCP incluída corresponder à
allowlist, a execução para antes da chamada ao modelo, em vez de continuar como uma
execução somente texto que poderia alucinar resultados de ferramentas.

### Perfis de ferramentas

`tools.profile` define uma allowlist base antes da aplicação de `allow`/`deny`.
Override por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Todas as ferramentas core e de plugins opcionais; baseline irrestrito para acesso mais amplo a comando/controle                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Somente `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` é intencionalmente restrito para agentes focados em canais.
Ele deixa de fora ferramentas mais amplas de comando/controle, como sistema de arquivos, runtime,
navegador, canvas, nós, cron e controle de Gateway. Use `tools.profile: "full"`
como baseline irrestrito para acesso mais amplo a comando/controle, depois reduza
o acesso com `tools.allow` / `tools.deny` quando necessário.
</Note>

`coding` inclui ferramentas web leves (`web_search`, `web_fetch`, `x_search`),
mas não a ferramenta completa de controle do navegador. A automação de navegador pode conduzir
sessões reais e perfis autenticados, então adicione-a explicitamente com
`tools.alsoAllow: ["browser"]` ou por agente com
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Configurar `tools.exec` ou `tools.fs` sob um perfil restritivo (`messaging`, `minimal`) não amplia implicitamente a allowlist do perfil. Adicione entradas explícitas em `tools.alsoAllow` (por exemplo, `["exec", "process"]` para exec, ou `["read", "write", "edit"]` para fs) quando quiser que um perfil restritivo use essas seções configuradas. OpenClaw registra um aviso de inicialização quando uma seção de configuração está presente sem uma concessão `alsoAllow` correspondente.
</Note>

Os perfis `coding` e `messaging` também permitem ferramentas MCP de bundle configuradas
sob a chave de plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando você
quiser que um perfil mantenha seus built-ins normais, mas oculte todas as ferramentas MCP configuradas.
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
| `group:ui`         | browser, canvas quando o Plugin Canvas incluído está habilitado                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Todas as ferramentas integradas do OpenClaw (exclui ferramentas de plugin)                                |

`sessions_history` retorna uma visualização de recuperação limitada e filtrada por segurança. Ela remove
tags de raciocínio, estruturas de apoio `<relevant-memories>`, payloads XML
de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta),
estruturas de apoio de chamadas de ferramenta rebaixadas, tokens de controle
de modelo ASCII/largura total vazados e XML de chamadas de ferramenta MiniMax
malformado do texto do assistente; em seguida, aplica redação/truncamento e
possíveis placeholders para linhas grandes demais, em vez de atuar como um
despejo bruto da transcrição.

### Restrições específicas por provedor

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
