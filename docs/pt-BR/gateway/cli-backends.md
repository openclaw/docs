---
read_when:
    - Você quer um fallback confiável quando provedores de API falham
    - Você está executando o Codex CLI ou outras CLIs locais de IA e quer reutilizá-las
    - Você quer entender a bridge MCP de loopback local para acesso a ferramentas no backend de CLI
summary: 'Backends de CLI: fallback para CLI local de IA com bridge opcional de ferramenta MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-25T13:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

O OpenClaw pode executar **CLIs locais de IA** como um **fallback somente texto** quando provedores de API estão fora do ar,
limitados por taxa ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **Ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do gateway por meio de uma bridge MCP de loopback local.
- **Streaming JSONL** para CLIs que oferecem suporte.
- **Sessões são compatíveis** (assim os turnos seguintes permanecem coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho principal. Use quando você
quiser respostas em texto do tipo “sempre funciona” sem depender de APIs externas.

Se você quiser um runtime harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de programação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar o Codex CLI **sem nenhuma configuração** (o Plugin OpenAI incluído
registra um backend padrão):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Se seu gateway for executado sob launchd/systemd e o PATH for mínimo, adicione apenas o
caminho do comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação além da própria CLI.

Se você usa um backend de CLI incluído como **provedor principal de mensagens** em um
host de gateway, o OpenClaw agora carrega automaticamente o Plugin incluído proprietário quando sua configuração
faz referência explícita a esse backend em um model ref ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele só seja executado quando os modelos principais falharem:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Observações:

- Se você usa `agents.defaults.models` (lista de permissões), também deve incluir seus modelos de backend de CLI ali.
- Se o provedor principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **id de provedor** (por exemplo, `codex-cli`, `my-cli`).
O id do provedor se torna o lado esquerdo do seu model ref:

```
<provider>/<model>
```

### Exemplo de configuração

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Para CLIs com uma flag dedicada de arquivo de prompt:
          // systemPromptFileArg: "--system-file",
          // CLIs no estilo Codex podem apontar para um arquivo de prompt em vez disso:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Como funciona

1. **Seleciona um backend** com base no prefixo do provedor (`codex-cli/...`).
2. **Constrói um prompt de sistema** usando o mesmo prompt + contexto de workspace do OpenClaw.
3. **Executa a CLI** com um id de sessão (se compatível) para que o histórico permaneça consistente.
   O backend incluído `claude-cli` mantém um processo Claude stdio ativo por
   sessão do OpenClaw e envia turnos seguintes por stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que os turnos seguintes reutilizem a mesma sessão de CLI.

<Note>
O backend incluído Anthropic `claude-cli` voltou a ser compatível. A equipe da Anthropic
nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como autorizado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend incluído OpenAI `codex-cli` passa o prompt de sistema do OpenClaw por meio da
substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um arquivo
temporário para cada nova sessão do Codex CLI.

O backend incluído Anthropic `claude-cli` recebe o snapshot de Skills do OpenClaw
de duas formas: o catálogo compacto de Skills do OpenClaw no prompt de sistema anexado e
um Plugin temporário do Claude Code passado com `--plugin-dir`. O Plugin contém
apenas as Skills elegíveis para aquele agente/sessão, então o resolvedor nativo de Skills do Claude Code
vê o mesmo conjunto filtrado que o OpenClaw anunciaria no prompt.
Substituições de env/chave de API de Skill continuam sendo aplicadas pelo OpenClaw ao ambiente
do processo filho para a execução.

O Claude CLI também tem seu próprio modo não interativo de permissões. O OpenClaw o mapeia
para a política de execução existente em vez de adicionar configuração específica do Claude: quando a
política efetiva de execução solicitada for YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), o OpenClaw adiciona `--permission-mode bypassPermissions`.
Configurações por agente em `agents.list[].tools.exec` substituem `tools.exec` global para
aquele agente. Para forçar um modo diferente do Claude, defina args brutos explícitos do backend
como `--permission-mode default` ou `--permission-mode acceptEdits` em
`agents.defaults.cliBackends.claude-cli.args` e os correspondentes `resumeArgs`.

Antes que o OpenClaw possa usar o backend incluído `claude-cli`, o próprio Claude Code
já deve estar autenticado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Use `agents.defaults.cliBackends.claude-cli.command` somente quando o binário `claude`
ainda não estiver no `PATH`.

## Sessões

- Se a CLI oferece suporte a sessões, defina `sessionArg` (por exemplo `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se a CLI usa um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se não houver nenhum armazenado).
  - `existing`: envia um id de sessão somente se um tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"`, de modo que turnos seguintes reutilizem o processo Claude ativo enquanto
  ele estiver ativo. O stdio aquecido agora é o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  for encerrado, o OpenClaw retoma a partir do id de sessão Claude armazenado. IDs de sessão armazenados
  são verificados em relação a uma transcrição de projeto existente e legível antes da
  retomada, de modo que vinculações fantasma sejam removidas com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão do Claude CLI em `--resume`.
- Sessões CLI armazenadas pertencem à continuidade controlada pelo provedor. A redefinição diária implícita
  não as interrompe; `/reset` e políticas explícitas `session.reset` ainda interrompem.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma trilha em ordem.
- A maioria das CLIs serializa em uma trilha por provedor.
- O OpenClaw descarta a reutilização de sessão CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo mudança de id de perfil de autenticação, chave de API estática, token estático ou identidade
  de conta OAuth quando a CLI expõe uma. Rotação de token de acesso e
  refresh token OAuth não interrompe a sessão CLI armazenada. Se uma CLI não expõe um
  id de conta OAuth estável, o OpenClaw deixa que essa CLI imponha permissões de retomada.

## Imagens (repasse)

Se sua CLI aceita caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como args da CLI. Se `imageArg` estiver ausente, o OpenClaw acrescenta os
caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam
arquivos locais automaticamente a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta em `response` e
  uso em `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente, além de identificadores de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último arg da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (de propriedade do Plugin)

O Plugin OpenAI incluído também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O Plugin Google incluído também registra um padrão para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: o Gemini CLI local deve estar instalado e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre JSON do Gemini CLI:

- O texto de resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` no OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho absoluto de `command`).

## Padrões de propriedade do Plugin

Os padrões de backend de CLI agora fazem parte da superfície de Plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor em model refs.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do Plugin.
- A limpeza de configuração específica do backend continua sendo de propriedade do Plugin por meio do hook
  opcional `normalizeConfig`.

Plugins que precisam de pequenos shims de compatibilidade de prompt/mensagem podem declarar
transformações de texto bidirecionais sem substituir um provedor ou backend de CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` reescreve o prompt de sistema e o prompt do usuário passados para a CLI. `output`
reescreve deltas em streaming do assistente e o texto final analisado antes de o OpenClaw tratar
seus próprios marcadores de controle e a entrega ao canal.

Para CLIs que emitem JSONL compatível com stream-json do Claude Code, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Overlays MCP incluídos

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
fazer opt-in para um overlay de configuração MCP gerado com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`; o
  servidor de loopback do OpenClaw gerado é marcado com o modo de aprovação de ferramenta por servidor do Codex
  para que chamadas MCP não travem em prompts locais de aprovação
- `google-gemini-cli`: arquivo gerado de configurações de sistema do Gemini

Quando bundle MCP está habilitado, o OpenClaw:

- inicia um servidor HTTP MCP de loopback local que expõe ferramentas do gateway ao processo da CLI
- autentica a bridge com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas ao contexto atual de sessão, conta e canal
- carrega servidores bundle-MCP habilitados para o workspace atual
- mescla esses servidores com qualquer forma existente de configuração/ajustes MCP do backend
- reescreve a configuração de inicialização usando o modo de integração controlado pelo backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend faz opt-in para bundle MCP, para que execuções em segundo plano permaneçam isoladas.

Runtimes MCP incluídos com escopo de sessão são colocados em cache para reutilização dentro de uma sessão e depois
removidos após `mcp.sessionIdleTtlMs` milissegundos de inatividade (padrão: 10
minutos; defina `0` para desabilitar). Execuções únicas incorporadas, como sondagens de autenticação,
geração de slug e recuperação de Active Memory, solicitam limpeza ao final da execução para que processos
filhos stdio e streams Streamable HTTP/SSE não sobrevivam à execução.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend de CLI. Backends só veem ferramentas do gateway quando fazem opt-in para
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends transmitem JSONL; outros fazem buffer
  até o encerramento.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões do Codex CLI** retomam via saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. Sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: verifique se `sessionArg` está definido e se `sessionMode` não é
  `none` (atualmente o Codex CLI não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI oferece suporte a caminhos de arquivo).

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
