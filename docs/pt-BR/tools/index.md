---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e plugins
summary: 'Visão geral de ferramentas e plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e plugins
x-i18n:
    generated_at: "2026-04-24T06:17:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
Ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

O OpenClaw tem três camadas que funcionam juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas integradas** e
    plugins podem registrar outras adicionais.

    O agente vê ferramentas como definições estruturadas de função enviadas à API do modelo.

  </Step>

  <Step title="Skills ensinam o agente quando e como">
    Uma Skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas de forma eficaz. Skills vivem no seu workspace, em pastas
    compartilhadas ou podem vir dentro de plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criar Skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um Plugin é um pacote que pode registrar qualquer combinação de recursos:
    canais, providers de modelo, ferramentas, Skills, fala, transcrição em
    tempo real, voz em tempo real, entendimento de mídia, geração de imagem,
    geração de vídeo, busca web, pesquisa na web e mais. Alguns plugins são **core** (incluídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar plugins](/pt-BR/tools/plugin) | [Crie o seu](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas vêm com o OpenClaw e estão disponíveis sem instalar nenhum Plugin:

| Ferramenta                                 | O que faz                                                            | Página                                                       |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Executa comandos de shell, gerencia processos em segundo plano       | [Exec](/pt-BR/tools/exec), [Aprovações de Exec](/pt-BR/tools/exec-approvals) |
| `code_execution`                           | Executa análise remota de Python em sandbox                          | [Code Execution](/pt-BR/tools/code-execution)                      |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, screenshot)         | [Navegador](/pt-BR/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts no X, busca conteúdo de páginas      | [Web](/pt-BR/tools/web), [Web Fetch](/pt-BR/tools/web-fetch)             |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                         |                                                              |
| `apply_patch`                              | Patches de arquivo com múltiplos blocos                              | [Apply Patch](/pt-BR/tools/apply-patch)                            |
| `message`                                  | Envia mensagens para todos os canais                                 | [Agent Send](/pt-BR/tools/agent-send)                              |
| `canvas`                                   | Controla o Canvas do node (present, eval, snapshot)                  |                                                              |
| `nodes`                                    | Descobre e seleciona dispositivos pareados                           |                                                              |
| `cron` / `gateway`                         | Gerencia tarefas agendadas; inspeciona, corrige, reinicia ou atualiza o gateway |                                                              |
| `image` / `image_generate`                 | Analisa ou gera imagens                                              | [Geração de imagem](/pt-BR/tools/image-generation)                 |
| `music_generate`                           | Gera faixas de música                                                | [Geração de música](/pt-BR/tools/music-generation)                 |
| `video_generate`                           | Gera vídeos                                                          | [Geração de vídeo](/pt-BR/tools/video-generation)                  |
| `tts`                                      | Conversão pontual de texto para fala                                 | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessão, status e orquestração de subagentes         | [Subagentes](/pt-BR/tools/subagents)                               |
| `session_status`                           | Retorno leve no estilo `/status` e substituição de modelo por sessão | [Ferramentas de sessão](/pt-BR/concepts/session-tool)              |

Para trabalho com imagem, use `image` para análise e `image_generate` para geração ou edição. Se você usar `openai/*`, `google/*`, `fal/*` ou outro provider de imagem não padrão, configure primeiro a autenticação/chave de API desse provider.

Para trabalho com música, use `music_generate`. Se você usar `google/*`, `minimax/*` ou outro provider de música não padrão, configure primeiro a autenticação/chave de API desse provider.

Para trabalho com vídeo, use `video_generate`. Se você usar `qwen/*` ou outro provider de vídeo não padrão, configure primeiro a autenticação/chave de API desse provider.

Para geração de áudio orientada por workflow, use `music_generate` quando um plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é texto para fala.

`session_status` é a ferramenta leve de status/retorno no grupo de sessões.
Ela responde a perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Como `/status`, ela pode preencher contadores esparsos de tokens/cache e o
rótulo ativo do modelo em runtime a partir da entrada de uso mais recente da transcrição.

`gateway` é a ferramenta de runtime exclusiva do proprietário para operações de gateway:

- `config.schema.lookup` para uma subárvore de schema de configuração com escopo de caminho antes de editar
- `config.get` para o snapshot atual de configuração + hash
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa da configuração
- `update.run` para autoatualização explícita + reinicialização

Para mudanças parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando quiser substituir intencionalmente toda a configuração.
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diff
- [LLM Task](/pt-BR/tools/llm-task) — etapa de LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [Geração de música](/pt-BR/tools/music-generation) — ferramenta compartilhada `music_generate` com providers apoiados por workflow
- [OpenProse](/pt-BR/prose) — orquestração de workflow orientada a Markdown
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos de ferramentas `exec` e `bash`

## Configuração de ferramentas

### Allowlists e deny lists

Controle quais ferramentas o agente pode chamar via `tools.allow` / `tools.deny` na
configuração. A negação sempre prevalece sobre a permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfis de ferramenta

`tools.profile` define uma allowlist base antes de `allow`/`deny` ser aplicado.
Substituição por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Sem restrição (igual a não definido)                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`   | Apenas `session_status`                                                                                                                          |

Os perfis `coding` e `messaging` também permitem ferramentas MCP configuradas de bundle
sob a chave de plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando
quiser que um perfil mantenha suas ferramentas integradas normais, mas oculte todas as ferramentas MCP configuradas.
O perfil `minimal` não inclui ferramentas MCP de bundle.

### Grupos de ferramenta

Use abreviações `group:*` em allowlists/deny lists:

| Grupo              | Ferramentas                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias de `exec`)                                     |
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
| `group:openclaw`   | Todas as ferramentas integradas do OpenClaw (exclui ferramentas de plugins)                              |

`sessions_history` retorna uma visualização limitada e filtrada com segurança para recordação. Ele remove
tags de raciocínio, estruturas `<relevant-memories>`, payloads XML em texto simples de chamada de ferramenta
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
estruturas degradadas de chamada de ferramenta, tokens vazados de controle de modelo em ASCII/largura total,
e XML malformado de chamada de ferramenta do MiniMax do texto do assistente, então aplica
redação/truncamento e possíveis placeholders para linhas grandes demais em vez de agir
como um despejo bruto de transcrição.

### Restrições específicas por provider

Use `tools.byProvider` para restringir ferramentas para providers específicos sem
mudar padrões globais:

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
