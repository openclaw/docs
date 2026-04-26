---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e plugins
summary: 'Visão geral de ferramentas e plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e plugins
x-i18n:
    generated_at: "2026-04-26T11:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
As ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

O OpenClaw tem três camadas que funcionam juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas integradas** e
    plugins podem registrar outras adicionais.

    O agente vê as ferramentas como definições estruturadas de função enviadas para a API do modelo.

  </Step>

  <Step title="Skills ensinam ao agente quando e como">
    Uma Skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas de forma eficaz. Skills ficam no seu workspace, em pastas compartilhadas
    ou vêm dentro de plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criando Skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um plugin é um pacote que pode registrar qualquer combinação de recursos:
    canais, provedores de modelo, ferramentas, Skills, fala, transcrição em tempo real,
    voz em tempo real, compreensão de mídia, geração de imagem, geração de vídeo,
    busca na web, pesquisa na web e mais. Alguns plugins são **core** (incluídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar plugins](/pt-BR/tools/plugin) | [Criar o seu](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas vêm com o OpenClaw e estão disponíveis sem instalar nenhum plugin:

| Ferramenta                                 | O que ela faz                                                        | Página                                                       |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Executa comandos de shell, gerencia processos em segundo plano       | [Exec](/pt-BR/tools/exec), [Aprovações do Exec](/pt-BR/tools/exec-approvals) |
| `code_execution`                           | Executa análise remota em Python em sandbox                          | [Code Execution](/pt-BR/tools/code-execution)                      |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, screenshot)         | [Browser](/pt-BR/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts no X, busca conteúdo de páginas      | [Web](/pt-BR/tools/web), [Web Fetch](/pt-BR/tools/web-fetch)             |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                         |                                                              |
| `apply_patch`                              | Patches de arquivo com vários hunks                                  | [Apply Patch](/pt-BR/tools/apply-patch)                            |
| `message`                                  | Envia mensagens em todos os canais                                   | [Agent Send](/pt-BR/tools/agent-send)                              |
| `canvas`                                   | Controla o Canvas do Node (present, eval, snapshot)                  |                                                              |
| `nodes`                                    | Descobre e direciona dispositivos pareados                           |                                                              |
| `cron` / `gateway`                         | Gerencia trabalhos agendados; inspeciona, corrige, reinicia ou atualiza o Gateway |                                                              |
| `image` / `image_generate`                 | Analisa ou gera imagens                                              | [Geração de imagem](/pt-BR/tools/image-generation)                 |
| `music_generate`                           | Gera faixas musicais                                                 | [Geração de música](/pt-BR/tools/music-generation)                 |
| `video_generate`                           | Gera vídeos                                                          | [Geração de vídeo](/pt-BR/tools/video-generation)                  |
| `tts`                                      | Conversão pontual de texto para fala                                 | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessão, status e orquestração de subagentes         | [Subagentes](/pt-BR/tools/subagents)                               |
| `session_status`                           | Leitura leve no estilo `/status` e substituição do modelo da sessão  | [Ferramentas de sessão](/pt-BR/concepts/session-tool)              |

Para trabalho com imagens, use `image` para análise e `image_generate` para geração ou edição. Se você usar `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você usar `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você usar `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por fluxo de trabalho, use `music_generate` quando um plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é texto para fala.

`session_status` é a ferramenta leve de status/leitura no grupo de sessões.
Ela responde perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Assim como `/status`, ela pode preencher contadores esparsos de token/cache e o
rótulo do modelo de runtime ativo a partir da entrada de uso mais recente da transcrição.

`gateway` é a ferramenta de runtime apenas para o proprietário para operações do Gateway:

- `config.schema.lookup` para uma subárvore de configuração com escopo de caminho antes de edições
- `config.get` para o snapshot atual da configuração + hash
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa da configuração
- `update.run` para autoatualização explícita + reinicialização

Para alterações parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você pretender substituir toda a configuração.
Para documentação mais ampla de configuração, leia [Configuration](/pt-BR/gateway/configuration) e
[Configuration reference](/pt-BR/gateway/configuration-reference).
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diff
- [LLM Task](/pt-BR/tools/llm-task) — etapa de LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de fluxo de trabalho tipado com aprovações retomáveis
- [Geração de música](/pt-BR/tools/music-generation) — ferramenta compartilhada `music_generate` com provedores baseados em fluxo de trabalho
- [OpenProse](/pt-BR/prose) — orquestração de fluxo de trabalho markdown-first
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos das ferramentas `exec` e `bash`

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar por meio de `tools.allow` / `tools.deny` na
configuração. A negação sempre tem prioridade sobre a permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

O OpenClaw falha de forma fechada quando uma lista de permissão explícita é resolvida sem ferramentas chamáveis.
Por exemplo, `tools.allow: ["query_db"]` só funciona se um plugin carregado realmente
registrar `query_db`. Se nenhuma ferramenta integrada, de plugin ou MCP integrado corresponder à
lista de permissão, a execução para antes da chamada do modelo em vez de continuar como
uma execução somente de texto que poderia alucinar resultados de ferramentas.

### Perfis de ferramentas

`tools.profile` define uma lista de permissão base antes da aplicação de `allow`/`deny`.
Substituição por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sem restrição (igual a não definido)                                                                                                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Apenas `session_status`                                                                                                                           |

`coding` inclui ferramentas leves de web (`web_search`, `web_fetch`, `x_search`)
mas não a ferramenta completa de controle do navegador. A automação do navegador pode controlar sessões reais e perfis autenticados, então adicione-a explicitamente com
`tools.alsoAllow: ["browser"]` ou uma substituição por agente em
`agents.list[].tools.alsoAllow: ["browser"]`.

Os perfis `coding` e `messaging` também permitem ferramentas MCP do bundle configuradas
sob a chave de plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando
quiser que um perfil mantenha suas ferramentas integradas normais, mas oculte todas as ferramentas MCP configuradas.
O perfil `minimal` não inclui ferramentas MCP do bundle.

### Grupos de ferramentas

Use abreviações `group:*` em listas de permissão/negação:

| Grupo              | Ferramentas                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias para `exec`)                                   |
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
| `group:openclaw`   | Todas as ferramentas integradas do OpenClaw (exclui ferramentas de plugin)                               |

`sessions_history` retorna uma visão de recuperação limitada e filtrada por segurança. Ela remove
tags de raciocínio, o scaffolding de `<relevant-memories>`, payloads XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
scaffolding rebaixado de chamada de ferramenta, tokens de controle de modelo vazados em ASCII/largura total
e XML malformado de chamada de ferramenta do MiniMax do texto do assistente, depois aplica
redação/truncamento e possíveis placeholders de linha superdimensionada em vez de agir
como um dump bruto da transcrição.

### Restrições específicas do provedor

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
