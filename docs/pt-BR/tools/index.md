---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e Plugins
summary: 'Visão geral de ferramentas e Plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e Plugins
x-i18n:
    generated_at: "2026-04-25T13:57:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
Ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e Plugins

O OpenClaw tem três camadas que funcionam juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo `exec`, `browser`,
    `web_search`, `message`). O OpenClaw vem com um conjunto de **ferramentas integradas** e
    Plugins podem registrar ferramentas adicionais.

    O agente vê ferramentas como definições estruturadas de função enviadas para a API do modelo.

  </Step>

  <Step title="Skills ensinam o agente quando e como">
    Uma skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas de forma eficaz. Skills ficam no seu workspace, em pastas compartilhadas
    ou vêm dentro de Plugins.

    [Skills reference](/pt-BR/tools/skills) | [Creating skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um Plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, provedores de modelo, ferramentas, Skills, fala, transcrição em tempo real,
    voz em tempo real, compreensão de mídia, geração de imagens, geração de vídeos,
    busca web, pesquisa web e mais. Alguns Plugins são **core** (distribuídos com
    OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Install and configure plugins](/pt-BR/tools/plugin) | [Build your own](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas vêm com o OpenClaw e estão disponíveis sem instalar nenhum Plugin:

| Ferramenta                                 | O que faz                                                            | Página                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Executa comandos de shell, gerencia processos em segundo plano        | [Exec](/pt-BR/tools/exec), [Exec Approvals](/pt-BR/tools/exec-approvals) |
| `code_execution`                           | Executa análise remota em Python com sandbox                          | [Code Execution](/pt-BR/tools/code-execution)                      |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, screenshot)          | [Browser](/pt-BR/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts no X, busca conteúdo de páginas       | [Web](/pt-BR/tools/web), [Web Fetch](/pt-BR/tools/web-fetch)             |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                          |                                                              |
| `apply_patch`                              | Patches de arquivo com vários hunks                                   | [Apply Patch](/pt-BR/tools/apply-patch)                            |
| `message`                                  | Envia mensagens por todos os canais                                   | [Agent Send](/pt-BR/tools/agent-send)                              |
| `canvas`                                   | Controla o Canvas de node (present, eval, snapshot)                   |                                                              |
| `nodes`                                    | Descobre e direciona dispositivos pareados                            |                                                              |
| `cron` / `gateway`                         | Gerencia trabalhos agendados; inspeciona, corrige, reinicia ou atualiza o gateway |                                                              |
| `image` / `image_generate`                 | Analisa ou gera imagens                                               | [Image Generation](/pt-BR/tools/image-generation)                  |
| `music_generate`                           | Gera faixas musicais                                                  | [Music Generation](/pt-BR/tools/music-generation)                  |
| `video_generate`                           | Gera vídeos                                                           | [Video Generation](/pt-BR/tools/video-generation)                  |
| `tts`                                      | Conversão pontual de text-to-speech                                   | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessão, status e orquestração de subagentes          | [Sub-agents](/pt-BR/tools/subagents)                               |
| `session_status`                           | Leitura leve no estilo `/status` e substituição do modelo da sessão   | [Session Tools](/pt-BR/concepts/session-tool)                      |

Para trabalho com imagens, use `image` para análise e `image_generate` para geração ou edição. Se você direcionar para `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você direcionar para `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você direcionar para `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por fluxo de trabalho, use `music_generate` quando um Plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é text-to-speech.

`session_status` é a ferramenta leve de status/leitura no grupo de sessões.
Ela responde perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Assim como `/status`, ela pode preencher valores ausentes de contadores de token/cache e o
rótulo do modelo de runtime ativo a partir da entrada de uso mais recente da transcrição.

`gateway` é a ferramenta de runtime apenas para proprietário para operações do gateway:

- `config.schema.lookup` para uma subárvore de configuração limitada a um caminho antes de edições
- `config.get` para o snapshot atual da configuração + hash
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa da configuração
- `update.run` para autoatualização explícita + reinicialização

Para mudanças parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando quiser intencionalmente substituir toda a configuração.
A ferramenta também se recusa a mudar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Ferramentas fornecidas por Plugin

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diff
- [LLM Task](/pt-BR/tools/llm-task) — etapa LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de fluxo de trabalho tipado com aprovações retomáveis
- [Music Generation](/pt-BR/tools/music-generation) — ferramenta compartilhada `music_generate` com provedores baseados em fluxo de trabalho
- [OpenProse](/pt-BR/prose) — orquestração de fluxo de trabalho markdown-first
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos das ferramentas `exec` e `bash`

## Configuração de ferramentas

### Listas de permitir e negar

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

O OpenClaw falha de forma fechada quando uma allowlist explícita é resolvida para nenhuma ferramenta chamável.
Por exemplo, `tools.allow: ["query_db"]` só funciona se um Plugin carregado realmente
registrar `query_db`. Se nenhuma ferramenta integrada, de Plugin ou MCP empacotada corresponder à
allowlist, a execução para antes da chamada ao modelo em vez de continuar como uma execução apenas de texto que poderia alucinar resultados de ferramentas.

### Perfis de ferramentas

`tools.profile` define uma allowlist base antes que `allow`/`deny` seja aplicado.
Substituição por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sem restrição (igual a não definido)                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                     |
| `minimal`   | apenas `session_status`                                                                                                                        |

Os perfis `coding` e `messaging` também permitem ferramentas MCP de bundle configuradas
sob a chave de Plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando
quiser que um perfil mantenha suas ferramentas integradas normais, mas oculte todas as ferramentas MCP configuradas.
O perfil `minimal` não inclui ferramentas MCP de bundle.

### Grupos de ferramentas

Use abreviações `group:*` em listas de permitir/negar:

| Grupo              | Ferramentas                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias para `exec`)                                       |
| `group:fs`         | read, write, edit, apply_patch                                                                                |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status    |
| `group:memory`     | memory_search, memory_get                                                                                     |
| `group:web`        | web_search, x_search, web_fetch                                                                               |
| `group:ui`         | browser, canvas                                                                                               |
| `group:automation` | cron, gateway                                                                                                 |
| `group:messaging`  | message                                                                                                       |
| `group:nodes`      | nodes                                                                                                         |
| `group:agents`     | agents_list                                                                                                   |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                    |
| `group:openclaw`   | Todas as ferramentas integradas do OpenClaw (exclui ferramentas de Plugin)                                   |

`sessions_history` retorna uma visão de recall limitada e filtrada por segurança. Ela remove
tags de thinking, scaffolding `<relevant-memories>`, payloads XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
scaffolding degradado de chamada de ferramenta, tokens de controle de modelo
vazados em ASCII/full-width e XML malformado de chamada de ferramenta MiniMax do texto do assistente, então aplica
redação/truncamento e possíveis placeholders de linha superdimensionada em vez de atuar
como um dump bruto de transcrição.

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
