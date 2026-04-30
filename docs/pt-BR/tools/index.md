---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e plugins
summary: 'Visão geral das ferramentas e dos plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e plugins
x-i18n:
    generated_at: "2026-04-30T10:11:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

Tudo que o agente faz além de gerar texto acontece por meio de **ferramentas**.
Ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

O OpenClaw tem três camadas que trabalham juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas integradas** e
    plugins podem registrar outras.

    O agente vê ferramentas como definições de função estruturadas enviadas para a API do modelo.

  </Step>

  <Step title="Skills ensinam ao agente quando e como">
    Uma skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas de forma eficaz. Skills ficam no seu workspace, em pastas compartilhadas
    ou são incluídas dentro de plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criando skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, provedores de modelo, ferramentas, skills, fala, transcrição em tempo real,
    voz em tempo real, compreensão de mídia, geração de imagem, geração de vídeo,
    busca web, pesquisa web e mais. Alguns plugins são **centrais** (incluídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instale e configure plugins](/pt-BR/tools/plugin) | [Crie o seu](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas são incluídas com o OpenClaw e estão disponíveis sem instalar nenhum plugin:

| Ferramenta                                | O que faz                                                             | Página                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Executa comandos shell, gerencia processos em segundo plano           | [Exec](/pt-BR/tools/exec), [Aprovações de Exec](/pt-BR/tools/exec-approvals) |
| `code_execution`                           | Executa análise Python remota em sandbox                              | [Execução de Código](/pt-BR/tools/code-execution)                  |
| `browser`                                  | Controla um navegador Chromium (navegar, clicar, capturar tela)       | [Navegador](/pt-BR/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`    | Pesquisa na web, pesquisa posts do X, busca conteúdo de páginas       | [Web](/pt-BR/tools/web), [Busca Web](/pt-BR/tools/web-fetch)             |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                          |                                                              |
| `apply_patch`                              | Patches de arquivo com múltiplos hunks                                | [Aplicar Patch](/pt-BR/tools/apply-patch)                          |
| `message`                                  | Envia mensagens por todos os canais                                   | [Envio do Agente](/pt-BR/tools/agent-send)                         |
| `canvas`                                   | Controla Canvas de Node (apresentar, avaliar, snapshot)               |                                                              |
| `nodes`                                    | Descobre e direciona dispositivos pareados                            |                                                              |
| `cron` / `gateway`                         | Gerencia tarefas agendadas; inspeciona, aplica patch, reinicia ou atualiza o Gateway |                                                              |
| `image` / `image_generate`                 | Analisa ou gera imagens                                               | [Geração de Imagem](/pt-BR/tools/image-generation)                 |
| `music_generate`                           | Gera faixas de música                                                 | [Geração de Música](/pt-BR/tools/music-generation)                 |
| `video_generate`                           | Gera vídeos                                                           | [Geração de Vídeo](/pt-BR/tools/video-generation)                  |
| `tts`                                      | Conversão pontual de texto em fala                                    | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessões, status e orquestração de subagentes         | [Subagentes](/pt-BR/tools/subagents)                               |
| `session_status`                           | Retorno leve no estilo `/status` e substituição de modelo da sessão   | [Ferramentas de Sessão](/pt-BR/concepts/session-tool)              |

Para trabalho com imagens, use `image` para análise e `image_generate` para geração ou edição. Se você direcionar para `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você direcionar para `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você direcionar para `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por workflow, use `music_generate` quando um plugin como
ComfyUI o registrar. Isso é separado de `tts`, que é texto em fala.

`session_status` é a ferramenta leve de status/retorno no grupo de sessões.
Ela responde a perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma substituição de modelo por sessão; `model=default` limpa essa
substituição. Como `/status`, ela pode preencher retrospectivamente contadores esparsos de tokens/cache e o
rótulo do modelo de runtime ativo a partir da entrada mais recente de uso do transcript.

`gateway` é a ferramenta de runtime exclusiva do proprietário para operações de Gateway:

- `config.schema.lookup` para uma subárvore de configuração delimitada por caminho antes de edições
- `config.get` para o snapshot + hash da configuração atual
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa de configuração
- `update.run` para autoatualização explícita + reinicialização

Para alterações parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você pretende substituir a configuração inteira.
Para documentação de configuração mais ampla, leia [Configuração](/pt-BR/gateway/configuration) e
[Referência de configuração](/pt-BR/gateway/configuration-reference).
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos exec protegidos.

### Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diffs
- [LLM Task](/pt-BR/tools/llm-task) — etapa LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [Geração de Música](/pt-BR/tools/music-generation) — ferramenta `music_generate` compartilhada com provedores baseados em workflow
- [OpenProse](/pt-BR/prose) — orquestração de workflow com markdown em primeiro lugar
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos das ferramentas `exec` e `bash`

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar por meio de `tools.allow` / `tools.deny` na
configuração. Negação sempre prevalece sobre permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

O OpenClaw falha fechado quando uma allowlist explícita não resolve para nenhuma ferramenta chamável.
Por exemplo, `tools.allow: ["query_db"]` só funciona se um plugin carregado realmente
registrar `query_db`. Se nenhuma ferramenta integrada, plugin ou MCP empacotada corresponder à
allowlist, a execução para antes da chamada ao modelo em vez de continuar como uma
execução somente texto que poderia alucinar resultados de ferramentas.

### Perfis de ferramentas

`tools.profile` define uma allowlist base antes de `allow`/`deny` ser aplicado.
Substituição por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Base irrestrita para acesso mais amplo de comando/controle; igual a deixar `tools.profile` sem definição                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Apenas `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` é intencionalmente restrito para agentes focados em canais.
Ele deixa de fora ferramentas mais amplas de comando/controle, como sistema de arquivos, runtime,
navegador, canvas, nós, Cron e controle de Gateway. Use `tools.profile: "full"`
como a base irrestrita para acesso mais amplo de comando/controle e depois reduza o
acesso com `tools.allow` / `tools.deny` quando necessário.
</Note>

`coding` inclui ferramentas web leves (`web_search`, `web_fetch`, `x_search`),
mas não a ferramenta completa de controle de navegador. Automação de navegador pode controlar
sessões reais e perfis conectados, então adicione-a explicitamente com
`tools.alsoAllow: ["browser"]` ou por agente com
`agents.list[].tools.alsoAllow: ["browser"]`.

Os perfis `coding` e `messaging` também permitem ferramentas MCP empacotadas configuradas
sob a chave de plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando você
quiser que um perfil mantenha suas ferramentas integradas normais, mas oculte todas as ferramentas MCP configuradas.
O perfil `minimal` não inclui ferramentas MCP empacotadas.

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
| `group:runtime`    | exec, process, code_execution (`bash` é aceito como alias para `exec`)                                    |
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

`sessions_history` retorna uma visualização de recuperação limitada e filtrada por segurança. Ele remove
tags de raciocínio, estruturas de apoio `<relevant-memories>`, payloads XML
de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos de chamadas de ferramenta truncados),
estruturas de apoio de chamadas de ferramenta rebaixadas, tokens vazados de controle de modelo
ASCII/largura total e XML de chamada de ferramenta MiniMax malformado do texto do assistente; em seguida, aplica
redação/truncamento e possíveis placeholders para linhas grandes demais, em vez de atuar
como um despejo bruto da transcrição.

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
