---
read_when:
    - Você quer entender quais ferramentas o OpenClaw fornece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas embutidas, Skills e plugins
summary: 'Visão geral das ferramentas e plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e plugins
x-i18n:
    generated_at: "2026-04-06T03:12:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2371239316997b0fe389bfa2ec38404e1d3e177755ad81ff8035ac583d9adeb
    source_path: tools/index.md
    workflow: 15
---

# Ferramentas e plugins

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
As ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

O OpenClaw tem três camadas que funcionam juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas embutidas** e
    plugins podem registrar ferramentas adicionais.

    O agente vê as ferramentas como definições estruturadas de função enviadas à API do modelo.

  </Step>

  <Step title="Skills ensinam o agente quando e como">
    Uma Skill é um arquivo Markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientações passo a passo para
    usar ferramentas com eficácia. Skills ficam no seu workspace, em pastas compartilhadas
    ou podem vir dentro de plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criando Skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, provedores de modelo, ferramentas, Skills, fala, transcrição em tempo real,
    voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo,
    web fetch, web search e mais. Alguns plugins são **core** (incluídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar plugins](/pt-BR/tools/plugin) | [Criar o seu](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas embutidas

Essas ferramentas vêm com o OpenClaw e estão disponíveis sem instalar nenhum plugin:

| Ferramenta                                 | O que faz                                                            | Página                                      |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Executa comandos de shell, gerencia processos em segundo plano       | [Exec](/pt-BR/tools/exec)                         |
| `code_execution`                           | Executa análise remota em Python em sandbox                          | [Code Execution](/pt-BR/tools/code-execution)     |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, captura de tela)    | [Browser](/pt-BR/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts no X, busca conteúdo de páginas      | [Web](/pt-BR/tools/web)                           |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                         |                                             |
| `apply_patch`                              | Patches de arquivo com múltiplos blocos                              | [Apply Patch](/pt-BR/tools/apply-patch)           |
| `message`                                  | Envia mensagens por todos os canais                                  | [Agent Send](/pt-BR/tools/agent-send)             |
| `canvas`                                   | Controla o node Canvas (present, eval, snapshot)                     |                                             |
| `nodes`                                    | Descobre e direciona dispositivos pareados                           |                                             |
| `cron` / `gateway`                         | Gerencia trabalhos agendados; inspeciona, faz patch, reinicia ou atualiza o gateway |                                             |
| `image` / `image_generate`                 | Analisa ou gera imagens                                              | [Image Generation](/pt-BR/tools/image-generation) |
| `music_generate`                           | Gera faixas de música                                                | [Music Generation](/tools/music-generation) |
| `video_generate`                           | Gera vídeos                                                          | [Video Generation](/tools/video-generation) |
| `tts`                                      | Conversão pontual de texto em fala                                   | [TTS](/pt-BR/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessão, status e orquestração de subagentes         | [Sub-agents](/pt-BR/tools/subagents)              |
| `session_status`                           | Retorno leve no estilo `/status` e substituição de modelo por sessão | [Session Tools](/pt-BR/concepts/session-tool)     |

Para trabalho com imagem, use `image` para análise e `image_generate` para geração ou edição. Se você usar `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem que não seja o padrão, configure antes a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você usar `google/*`, `minimax/*` ou outro provedor de música que não seja o padrão, configure antes a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você usar `qwen/*` ou outro provedor de vídeo que não seja o padrão, configure antes a autenticação/chave de API desse provedor.

Para geração de áudio orientada por workflow, use `music_generate` quando um plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é texto para fala.

`session_status` é a ferramenta leve de status/retorno do grupo de sessões.
Ela responde perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Assim como `/status`, ela pode preencher contadores esparsos de token/cache e o
rótulo do modelo ativo em runtime a partir da entrada de uso mais recente da transcrição.

`gateway` é a ferramenta de runtime exclusiva do proprietário para operações do gateway:

- `config.schema.lookup` para uma subárvore de configuração com escopo de caminho antes de edições
- `config.get` para o snapshot atual da configuração + hash
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa da configuração
- `update.run` para autoatualização explícita + reinicialização

Para alterações parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você quiser substituir intencionalmente toda a configuração.
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Ferramentas fornecidas por plugin

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [LLM Task](/pt-BR/tools/llm-task) — etapa de LLM somente JSON para saída estruturada
- [Music Generation](/tools/music-generation) — ferramenta compartilhada `music_generate` com provedores baseados em workflow
- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diffs
- [OpenProse](/pt-BR/prose) — orquestração de workflow focada em Markdown

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar por meio de `tools.allow` / `tools.deny` na
configuração. A negação sempre prevalece sobre a permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfis de ferramentas

`tools.profile` define uma allowlist base antes da aplicação de `allow`/`deny`.
Substituição por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sem restrição (igual a não definir)                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                      |
| `minimal`   | apenas `session_status`                                                                                                                        |

### Grupos de ferramentas

Use atalhos `group:*` em listas de permissão/negação:

| Grupo              | Ferramentas                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias para `exec`)                                      |
| `group:fs`         | read, write, edit, apply_patch                                                                              |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status  |
| `group:memory`     | memory_search, memory_get                                                                                   |
| `group:web`        | web_search, x_search, web_fetch                                                                             |
| `group:ui`         | browser, canvas                                                                                             |
| `group:automation` | cron, gateway                                                                                               |
| `group:messaging`  | message                                                                                                     |
| `group:nodes`      | nodes                                                                                                       |
| `group:agents`     | agents_list                                                                                                 |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                  |
| `group:openclaw`   | Todas as ferramentas embutidas do OpenClaw (exclui ferramentas de plugin)                                  |

`sessions_history` retorna uma visualização limitada e filtrada por segurança para recall. Ela remove
tags de thinking, scaffolding `<relevant-memories>`, payloads XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
scaffolding rebaixado de chamada de ferramenta, tokens de controle de modelo vazados em ASCII/largura total
e XML malformado de chamada de ferramenta do MiniMax do texto do assistente, depois aplica
redação/truncamento e possíveis placeholders de linha superdimensionada em vez de agir
como um dump bruto da transcrição.

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
