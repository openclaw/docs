---
read_when:
    - Você quer entender quais Tools o OpenClaw oferece
    - Você precisa configurar, permitir ou negar Tools
    - Você está decidindo entre Tools integradas, Skills e Plugins
summary: 'Visão geral de Tools e Plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Tools e Plugins
x-i18n:
    generated_at: "2026-04-23T14:08:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Tools e Plugins

Tudo o que o agente faz além de gerar texto acontece por meio de **Tools**.
Tools são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Tools, Skills e Plugins

O OpenClaw tem três camadas que funcionam juntas:

<Steps>
  <Step title="Tools são o que o agente chama">
    Uma Tool é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **Tools integradas** e
    Plugins podem registrar outras adicionais.

    O agente vê as Tools como definições estruturadas de função enviadas para a API do modelo.

  </Step>

  <Step title="Skills ensinam ao agente quando e como">
    Uma Skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar Tools de forma eficaz. Skills ficam no seu workspace, em pastas compartilhadas
    ou são fornecidas dentro de Plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criando Skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um Plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, provedores de modelo, Tools, Skills, fala, transcrição em tempo real,
    voz em tempo real, media-understanding, geração de imagem, geração de vídeo,
    web fetch, pesquisa na web e mais. Alguns Plugins são **core** (distribuídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar Plugins](/pt-BR/tools/plugin) | [Criar o seu próprio](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Tools integradas

Estas Tools são distribuídas com o OpenClaw e estão disponíveis sem instalar nenhum Plugin:

| Tool                                       | O que faz                                                           | Página                                                       |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Executa comandos de shell, gerencia processos em segundo plano      | [Exec](/pt-BR/tools/exec), [Exec Approvals](/pt-BR/tools/exec-approvals) |
| `code_execution`                           | Executa análise remota de Python em sandbox                         | [Code Execution](/pt-BR/tools/code-execution)                      |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, screenshot)        | [Browser](/pt-BR/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts no X, obtém conteúdo de páginas     | [Web](/pt-BR/tools/web), [Web Fetch](/pt-BR/tools/web-fetch)             |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                        |                                                              |
| `apply_patch`                              | Patches de arquivo com múltiplos trechos                            | [Apply Patch](/pt-BR/tools/apply-patch)                            |
| `message`                                  | Envia mensagens em todos os canais                                  | [Agent Send](/pt-BR/tools/agent-send)                              |
| `canvas`                                   | Controla o Canvas do Node (present, eval, snapshot)                 |                                                              |
| `nodes`                                    | Descobre e direciona dispositivos pareados                          |                                                              |
| `cron` / `gateway`                         | Gerencia trabalhos agendados; inspeciona, corrige, reinicia ou atualiza o Gateway |                                                              |
| `image` / `image_generate`                 | Analisa ou gera imagens                                             | [Image Generation](/pt-BR/tools/image-generation)                  |
| `music_generate`                           | Gera faixas musicais                                                | [Music Generation](/pt-BR/tools/music-generation)                  |
| `video_generate`                           | Gera vídeos                                                         | [Video Generation](/pt-BR/tools/video-generation)                  |
| `tts`                                      | Conversão pontual de texto em fala                                  | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessão, status e orquestração de subagentes        | [Sub-agents](/pt-BR/tools/subagents)                               |
| `session_status`                           | Retorno leve no estilo `/status` e sobrescrita do modelo da sessão  | [Session Tools](/pt-BR/concepts/session-tool)                      |

Para trabalho com imagem, use `image` para análise e `image_generate` para geração ou edição. Se você usar `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você usar `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você usar `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por workflow, use `music_generate` quando um Plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é conversão de texto em fala.

`session_status` é a Tool leve de status/retorno no grupo de sessões.
Ela responde perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma sobrescrita de modelo por sessão; `model=default` limpa essa
sobrescrita. Como `/status`, ela pode preencher contadores esparsos de tokens/cache e o
rótulo do modelo ativo em runtime a partir da entrada de uso mais recente da transcrição.

`gateway` é a Tool de runtime exclusiva do proprietário para operações do Gateway:

- `config.schema.lookup` para uma subárvore de config com escopo de caminho antes de edições
- `config.get` para o snapshot + hash da config atual
- `config.patch` para atualizações parciais de config com reinicialização
- `config.apply` apenas para substituição completa da config
- `update.run` para autoatualização + reinicialização explícitas

Para alterações parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você pretende substituir a config inteira.
A Tool também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Tools fornecidas por Plugin

Plugins podem registrar Tools adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diff
- [LLM Task](/pt-BR/tools/llm-task) — etapa de LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [Music Generation](/pt-BR/tools/music-generation) — Tool compartilhada `music_generate` com provedores baseados em workflow
- [OpenProse](/pt-BR/prose) — orquestração de workflow com prioridade para markdown
- [Tokenjuice](/pt-BR/tools/tokenjuice) — resultados compactos para Tools ruidosas `exec` e `bash`

## Configuração de Tools

### Listas de permissão e negação

Controle quais Tools o agente pode chamar via `tools.allow` / `tools.deny` na
configuração. A negação sempre vence a permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfis de Tool

`tools.profile` define uma allowlist base antes de `allow`/`deny` ser aplicado.
Sobrescrita por agente: `agents.list[].tools.profile`.

| Profile     | O que inclui                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sem restrição (igual a não definir)                                                                                                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | apenas `session_status`                                                                                                                           |

Os perfis `coding` e `messaging` também permitem Tools MCP de bundle configuradas
sob a chave de Plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando
quiser que um perfil mantenha suas Tools integradas normais, mas oculte todas as Tools MCP configuradas.
O perfil `minimal` não inclui Tools MCP de bundle.

### Grupos de Tool

Use abreviações `group:*` em listas de permissão/negação:

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias de `exec`)                                      |
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
| `group:openclaw`   | Todas as Tools integradas do OpenClaw (exclui Tools de Plugin)                                            |

`sessions_history` retorna uma visualização de recuperação limitada e filtrada por segurança. Ela remove
tags de thinking, scaffolding `<relevant-memories>`, payloads XML de chamada de Tool em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de Tool),
scaffolding rebaixado de chamada de Tool, tokens de controle de modelo vazados em ASCII/largura total
e XML malformado de chamada de Tool do MiniMax no texto do assistente, depois aplica
redação/truncamento e possíveis placeholders de linha superdimensionada em vez de agir
como um dump bruto da transcrição.

### Restrições específicas por provedor

Use `tools.byProvider` para restringir Tools para provedores específicos sem
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
