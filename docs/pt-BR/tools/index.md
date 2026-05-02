---
read_when:
    - Você quer entender quais ferramentas o OpenClaw oferece
    - Você precisa configurar, permitir ou negar ferramentas
    - Você está decidindo entre ferramentas integradas, Skills e Plugins
summary: 'Visão geral das ferramentas e plugins do OpenClaw: o que o agente pode fazer e como estendê-lo'
title: Ferramentas e plugins
x-i18n:
    generated_at: "2026-05-02T21:05:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

Tudo o que o agente faz além de gerar texto acontece por meio de **ferramentas**.
Ferramentas são como o agente lê arquivos, executa comandos, navega na web, envia
mensagens e interage com dispositivos.

## Ferramentas, Skills e plugins

O OpenClaw tem três camadas que trabalham juntas:

<Steps>
  <Step title="Ferramentas são o que o agente chama">
    Uma ferramenta é uma função tipada que o agente pode invocar (por exemplo, `exec`, `browser`,
    `web_search`, `message`). O OpenClaw inclui um conjunto de **ferramentas integradas** e
    plugins podem registrar outras.

    O agente vê ferramentas como definições de função estruturadas enviadas à API do modelo.

  </Step>

  <Step title="Skills ensinam ao agente quando e como agir">
    Uma Skill é um arquivo markdown (`SKILL.md`) injetado no prompt do sistema.
    Skills dão ao agente contexto, restrições e orientação passo a passo para
    usar ferramentas de forma eficaz. Skills ficam no seu workspace, em pastas compartilhadas
    ou vêm dentro de plugins.

    [Referência de Skills](/pt-BR/tools/skills) | [Criando Skills](/pt-BR/tools/creating-skills)

  </Step>

  <Step title="Plugins empacotam tudo junto">
    Um plugin é um pacote que pode registrar qualquer combinação de capacidades:
    canais, provedores de modelo, ferramentas, Skills, fala, transcrição em tempo real,
    voz em tempo real, compreensão de mídia, geração de imagens, geração de vídeo,
    busca de páginas na web, pesquisa na web e mais. Alguns plugins são **core** (incluídos com
    o OpenClaw), outros são **externos** (publicados no npm pela comunidade).

    [Instalar e configurar plugins](/pt-BR/tools/plugin) | [Crie o seu próprio](/pt-BR/plugins/building-plugins)

  </Step>
</Steps>

## Ferramentas integradas

Estas ferramentas vêm com o OpenClaw e estão disponíveis sem instalar plugins:

| Ferramenta                                | O que ela faz                                                        | Página                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Executar comandos shell, gerenciar processos em segundo plano         | [Exec](/pt-BR/tools/exec), [Aprovações de Exec](/pt-BR/tools/exec-approvals) |
| `code_execution`                           | Executar análise Python remota em sandbox                            | [Execução de código](/pt-BR/tools/code-execution)                  |
| `browser`                                  | Controlar um navegador Chromium (navegar, clicar, captura de tela)    | [Navegador](/pt-BR/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`    | Pesquisar na web, pesquisar posts do X, buscar conteúdo de páginas    | [Web](/pt-BR/tools/web), [Busca de páginas web](/pt-BR/tools/web-fetch)  |
| `read` / `write` / `edit`                  | E/S de arquivos no workspace                                          |                                                              |
| `apply_patch`                              | Patches de arquivo com múltiplos hunks                                | [Aplicar patch](/pt-BR/tools/apply-patch)                          |
| `message`                                  | Enviar mensagens por todos os canais                                  | [Envio pelo agente](/pt-BR/tools/agent-send)                       |
| `canvas`                                   | Controlar node Canvas (apresentar, avaliar, snapshot)                 |                                                              |
| `nodes`                                    | Descobrir e direcionar dispositivos pareados                          |                                                              |
| `cron` / `gateway`                         | Gerenciar jobs agendados; inspecionar, aplicar patch, reiniciar ou atualizar o Gateway |                                                              |
| `image` / `image_generate`                 | Analisar ou gerar imagens                                             | [Geração de imagens](/pt-BR/tools/image-generation)                |
| `music_generate`                           | Gerar faixas musicais                                                 | [Geração de música](/pt-BR/tools/music-generation)                 |
| `video_generate`                           | Gerar vídeos                                                          | [Geração de vídeo](/pt-BR/tools/video-generation)                  |
| `tts`                                      | Conversão única de texto para fala                                    | [TTS](/pt-BR/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gerenciamento de sessões, status e orquestração de subagentes         | [Subagentes](/pt-BR/tools/subagents)                               |
| `session_status`                           | Retorno leve no estilo `/status` e sobrescrita de modelo da sessão    | [Ferramentas de sessão](/pt-BR/concepts/session-tool)              |

Para trabalho com imagens, use `image` para análise e `image_generate` para geração ou edição. Se você direcionar para `openai/*`, `google/*`, `fal/*` ou outro provedor de imagem não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com música, use `music_generate`. Se você direcionar para `google/*`, `minimax/*` ou outro provedor de música não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para trabalho com vídeo, use `video_generate`. Se você direcionar para `qwen/*` ou outro provedor de vídeo não padrão, configure primeiro a autenticação/chave de API desse provedor.

Para geração de áudio orientada por workflow, use `music_generate` quando um plugin como
ComfyUI registrá-la. Isso é separado de `tts`, que é texto para fala.

`session_status` é a ferramenta leve de status/retorno no grupo de sessões.
Ela responde a perguntas no estilo `/status` sobre a sessão atual e pode
opcionalmente definir uma sobrescrita de modelo por sessão; `model=default` limpa essa
sobrescrita. Assim como `/status`, ela pode preencher contadores esparsos de token/cache e o
rótulo do modelo de runtime ativo a partir da entrada de uso mais recente da transcrição.

`gateway` é a ferramenta de runtime exclusiva do proprietário para operações do Gateway:

- `config.schema.lookup` para uma subárvore de configuração com escopo por caminho antes de edições
- `config.get` para o snapshot + hash da configuração atual
- `config.patch` para atualizações parciais de configuração com reinicialização
- `config.apply` apenas para substituição completa da configuração
- `update.run` para autoatualização explícita + reinicialização

Para mudanças parciais, prefira `config.schema.lookup` e depois `config.patch`. Use
`config.apply` apenas quando você pretende substituir a configuração inteira.
Para documentação de configuração mais ampla, leia [Configuração](/pt-BR/gateway/configuration) e
[Referência de configuração](/pt-BR/gateway/configuration-reference).
A ferramenta também se recusa a alterar `tools.exec.ask` ou `tools.exec.security`;
aliases legados `tools.bash.*` são normalizados para os mesmos caminhos protegidos de exec.

### Ferramentas fornecidas por plugins

Plugins podem registrar ferramentas adicionais. Alguns exemplos:

- [Diffs](/pt-BR/tools/diffs) — visualizador e renderizador de diffs
- [Tarefa LLM](/pt-BR/tools/llm-task) — etapa LLM somente JSON para saída estruturada
- [Lobster](/pt-BR/tools/lobster) — runtime de workflow tipado com aprovações retomáveis
- [Geração de música](/pt-BR/tools/music-generation) — ferramenta compartilhada `music_generate` com provedores baseados em workflow
- [OpenProse](/pt-BR/prose) — orquestração de workflow orientada a markdown
- [Tokenjuice](/pt-BR/tools/tokenjuice) — compacta resultados ruidosos das ferramentas `exec` e `bash`

Ferramentas de plugin ainda são criadas com `api.registerTool(...)` e declaradas na
lista `contracts.tools` do manifesto do plugin. O OpenClaw captura o descritor
validado da ferramenta durante a descoberta e o armazena em cache por origem e contrato do plugin, para que
o planejamento posterior de ferramentas possa ignorar o carregamento do runtime do plugin. A execução da ferramenta ainda carrega
o plugin proprietário e chama a implementação registrada ativa.

## Configuração de ferramentas

### Listas de permissão e negação

Controle quais ferramentas o agente pode chamar via `tools.allow` / `tools.deny` na
configuração. Negação sempre vence permissão.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

O OpenClaw falha fechado quando uma allowlist explícita não resolve para nenhuma ferramenta chamável.
Por exemplo, `tools.allow: ["query_db"]` só funciona se um plugin carregado de fato
registrar `query_db`. Se nenhuma ferramenta integrada, plugin ou MCP empacotado corresponder à
allowlist, a execução para antes da chamada ao modelo em vez de continuar como uma
execução somente texto que poderia alucinar resultados de ferramentas.

### Perfis de ferramentas

`tools.profile` define uma allowlist base antes de `allow`/`deny` ser aplicado.
Sobrescrita por agente: `agents.list[].tools.profile`.

| Perfil      | O que inclui                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Base irrestrita para acesso mais amplo de comando/controle; igual a deixar `tools.profile` indefinido                                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Apenas `session_status`                                                                                                                           |

<Note>
`tools.profile: "messaging"` é intencionalmente restrito para agentes focados em canais.
Ele deixa de fora ferramentas mais amplas de comando/controle, como sistema de arquivos, runtime,
navegador, canvas, nodes, Cron e controle do Gateway. Use `tools.profile: "full"`
como a base irrestrita para acesso mais amplo de comando/controle e depois reduza
o acesso com `tools.allow` / `tools.deny` quando necessário.
</Note>

`coding` inclui ferramentas leves de web (`web_search`, `web_fetch`, `x_search`),
mas não a ferramenta completa de controle de navegador. A automação de navegador pode controlar
sessões reais e perfis autenticados, então adicione-a explicitamente com
`tools.alsoAllow: ["browser"]` ou por agente
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Configurar `tools.exec` ou `tools.fs` sob um perfil restritivo (`messaging`, `minimal`) não amplia implicitamente a allowlist do perfil. Adicione entradas explícitas em `tools.alsoAllow` (por exemplo, `["exec", "process"]` para exec, ou `["read", "write", "edit"]` para fs) quando quiser que um perfil restritivo use essas seções configuradas. O OpenClaw registra um aviso de inicialização quando uma seção de configuração está presente sem uma concessão `alsoAllow` correspondente.
</Note>

Os perfis `coding` e `messaging` também permitem ferramentas MCP de bundle configuradas
sob a chave de plugin `bundle-mcp`. Adicione `tools.deny: ["bundle-mcp"]` quando você
quiser que um perfil mantenha suas ferramentas integradas normais, mas oculte todas as ferramentas MCP configuradas.
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

`sessions_history` retorna uma visualização de recuperação limitada e filtrada por segurança. Ela remove
tags de pensamento, estruturas auxiliares de `<relevant-memories>`, payloads XML
de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta),
estruturas auxiliares rebaixadas de chamadas de ferramenta, tokens de controle
de modelo ASCII/full-width vazados e XML malformado de chamadas de ferramenta do MiniMax
do texto do assistente; em seguida, aplica redação/truncamento e possíveis placeholders
para linhas grandes demais, em vez de atuar como um despejo bruto de transcrição.

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
