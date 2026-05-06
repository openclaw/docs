---
read_when:
    - Você quer uma alternativa confiável quando os provedores de API falham
    - Você está executando o Codex CLI ou outras CLIs locais de IA e quer reutilizá-las
    - Você quer entender a ponte de loopback do MCP para acesso às ferramentas de back-end da CLI
summary: 'Backends de CLI: alternativa de CLI de IA local com ponte opcional de ferramentas MCP'
title: Back-ends da CLI
x-i18n:
    generated_at: "2026-05-06T05:54:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw pode executar **CLIs de IA locais** como um **fallback somente texto** quando provedores de API estão fora do ar,
com limite de taxa, ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do Gateway via uma ponte MCP de loopback.
- **Streaming JSONL** para CLIs que o suportam.
- **Sessões são compatíveis** (para que turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança**, não como um caminho primário. Use quando você
quiser respostas de texto que "sempre funcionam" sem depender de APIs externas.

Se você quiser um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar Codex CLI **sem nenhuma configuração** (o Plugin OpenAI incluído
registra um backend padrão):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Se o seu Gateway roda sob launchd/systemd e o PATH é mínimo, adicione apenas o
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

É isso. Sem chaves, sem configuração extra de autenticação além da própria CLI.

Se você usa um backend de CLI incluído como **provedor primário de mensagens** em um
host de Gateway, o OpenClaw agora carrega automaticamente o Plugin incluído proprietário quando sua configuração
referencia explicitamente esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele seja executado apenas quando os modelos primários falharem:

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

- Se você usar `agents.defaults.models` (lista de permissões), também deverá incluir seus modelos de backend de CLI ali.
- Se o provedor primário falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **id de provedor** (por exemplo, `codex-cli`, `my-cli`).
O id do provedor se torna o lado esquerdo da sua referência de modelo:

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
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
2. **Monta um prompt de sistema** usando o mesmo prompt do OpenClaw + contexto do workspace.
3. **Executa a CLI** com um id de sessão (se compatível), para que o histórico permaneça consistente.
   O backend `claude-cli` incluído mantém um processo Claude stdio ativo por
   sessão do OpenClaw e envia turnos de acompanhamento por stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão de CLI.

<Note>
O backend Anthropic `claude-cli` incluído voltou a ser compatível. A equipe da Anthropic
nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como sancionado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend OpenAI `codex-cli` incluído passa o prompt de sistema do OpenClaw por meio
da substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada nova sessão do Codex CLI.

O backend Anthropic `claude-cli` incluído recebe o snapshot de skills do OpenClaw
de duas formas: o catálogo compacto de skills do OpenClaw no prompt de sistema anexado, e
um Plugin temporário do Claude Code passado com `--plugin-dir`. O Plugin contém
apenas as skills elegíveis para aquele agente/sessão, então o resolvedor nativo de skills do Claude Code
vê o mesmo conjunto filtrado que o OpenClaw anunciaria de outra forma no
prompt. Substituições de env/chave de API de Skill ainda são aplicadas pelo OpenClaw ao
ambiente do processo filho para a execução.

Claude CLI também tem seu próprio modo de permissão não interativo. O OpenClaw mapeia isso
para a política de exec existente em vez de adicionar configuração específica do Claude: quando a
política de exec solicitada efetiva é YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), o OpenClaw adiciona `--permission-mode bypassPermissions`.
Configurações por agente em `agents.list[].tools.exec` substituem `tools.exec` global para
esse agente. Para forçar um modo Claude diferente, defina argumentos brutos explícitos de backend
como `--permission-mode default` ou `--permission-mode acceptEdits` em
`agents.defaults.cliBackends.claude-cli.args` e `resumeArgs` correspondentes.

O backend Anthropic `claude-cli` incluído também mapeia níveis `/think` do OpenClaw
para a flag nativa `--effort` do Claude Code para níveis que não sejam off. `minimal` e
`low` mapeiam para `low`, `adaptive` e `medium` mapeiam para `medium`, e `high`,
`xhigh` e `max` mapeiam diretamente. Outros backends de CLI precisam que seu Plugin proprietário
declare um mapeador argv equivalente antes que `/think` possa afetar a CLI gerada.

Antes que o OpenClaw possa usar o backend `claude-cli` incluído, o próprio Claude Code
já deve estar logado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Use `agents.defaults.cliBackends.claude-cli.command` apenas quando o binário `claude`
ainda não estiver em `PATH`.

## Sessões

- Se a CLI for compatível com sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em múltiplas flags.
- Se a CLI usa um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e, opcionalmente, `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: envia um id de sessão apenas se algum tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"`, para que turnos de acompanhamento reutilizem o processo Claude ativo enquanto
  ele estiver ativo. Stdio aquecido agora é o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  sair, o OpenClaw retoma a partir do id de sessão Claude armazenado. Os ids de sessão
  armazenados são verificados contra uma transcrição de projeto legível existente antes de
  retomar, então vínculos fantasma são removidos com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão Claude CLI sob `--resume`.
- Sessões Claude ao vivo mantêm guardas limitados de saída JSONL. Os padrões permitem até
  8 MiB e 20.000 linhas JSONL brutas por turno. Turnos Claude com uso intenso de ferramentas podem aumentar
  esses limites por backend com
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  e `maxTurnLines`; o OpenClaw limita essas configurações a 64 MiB e 100.000
  linhas.
- Sessões de CLI armazenadas são continuidade de propriedade do provedor. A redefinição diária implícita de sessão
  não as corta; `/reset` e políticas explícitas de `session.reset` ainda
  cortam.

Observações de serialização:

- `serialize: true` mantém execuções da mesma faixa ordenadas.
- A maioria das CLIs serializa em uma faixa de provedor.
- O OpenClaw descarta a reutilização de sessão de CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo uma mudança de id de perfil de autenticação, chave de API estática, token estático ou identidade de conta OAuth
  quando a CLI expõe uma. A rotação de tokens de acesso e atualização OAuth não corta a sessão de CLI armazenada. Se uma CLI não expõe um
  id de conta OAuth estável, o OpenClaw deixa essa CLI impor permissões de retomada.

## Prelúdio de fallback a partir de sessões claude-cli

Quando uma tentativa `claude-cli` faz failover para um candidato não CLI em
[`agents.defaults.model.fallbacks`](/pt-BR/concepts/model-failover), o OpenClaw semeia
a próxima tentativa com um prelúdio de contexto coletado da transcrição JSONL local
do Claude Code em `~/.claude/projects/`. Sem essa semente, o provedor de fallback
começaria frio porque a transcrição de sessão do próprio OpenClaw está vazia
para execuções `claude-cli`.

- O prelúdio prefere o resumo `/compact` mais recente ou o marcador `compact_boundary`,
  depois anexa os turnos pós-limite mais recentes até um orçamento de caracteres.
  Turnos pré-limite são descartados porque o resumo já os representa.
- Blocos de ferramentas são coalescidos em dicas compactas `(tool call: name)` e
  `(tool result: …)` para manter o orçamento do prompt honesto. O resumo é
  rotulado como `(truncated)` se exceder o limite.
- Fallbacks do mesmo provedor de `claude-cli` para `claude-cli` dependem do próprio
  `--resume` do Claude e pulam o prelúdio.
- A semente reutiliza a validação de caminho de arquivo de sessão Claude existente, então
  caminhos arbitrários não podem ser lidos.

## Imagens (repassagem)

Se sua CLI aceita caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como argumentos da CLI. Se `imageArg` estiver ausente, o OpenClaw anexará os
caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam automaticamente
arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  uso de `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente mais identificadores
  de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento da CLI.
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

Pré-requisito: a Gemini CLI local deve estar instalada e disponível como
`gemini` em `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre JSON do Gemini CLI:

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho absoluto de `command`).

## Padrões pertencentes ao Plugin

Os padrões de backend da CLI agora fazem parte da superfície do Plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas refs de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do Plugin.
- A limpeza de configuração específica do backend continua pertencendo ao Plugin por meio do hook opcional
  `normalizeConfig`.

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

`input` reescreve o prompt do sistema e o prompt do usuário passados para a CLI. `output`
reescreve deltas transmitidos do assistente e o texto final analisado antes que o OpenClaw lide com
seus próprios marcadores de controle e entrega de canal.

Para CLIs que emitem JSONL compatível com o stream-json do Claude Code, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Sobreposições de MCP empacotado

Backends de CLI **não** recebem chamadas de ferramentas do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento empacotado atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`; o servidor
  local loopback gerado do OpenClaw é marcado com o modo de aprovação de ferramentas por servidor do Codex
  para que chamadas MCP não fiquem paradas em prompts de aprovação local
- `google-gemini-cli`: arquivo de configurações do sistema do Gemini gerado

Quando o MCP empacotado está habilitado, o OpenClaw:

- inicia um servidor HTTP MCP de loopback que expõe ferramentas de gateway ao processo da CLI
- autentica a ponte com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso a ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- combina-os com qualquer formato de configuração/definições MCP existente do backend
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta pelo MCP empacotado, para que execuções em segundo plano permaneçam isoladas.

Runtimes MCP empacotados com escopo de sessão são armazenados em cache para reutilização dentro de uma sessão e então
coletados após `mcp.sessionIdleTtlMs` milissegundos de tempo ocioso (padrão de 10
minutos; defina `0` para desabilitar). Execuções incorporadas de uso único, como sondagens de autenticação,
geração de slug e recuperação de active-memory solicitam limpeza ao final da execução para que
processos filhos stdio e streams HTTP/SSE Streamable não sobrevivam à execução.

## Limitações

- **Sem chamadas diretas de ferramentas do OpenClaw.** O OpenClaw não injeta chamadas de ferramentas no
  protocolo do backend de CLI. Backends só veem ferramentas de gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends transmitem JSONL; outros armazenam em buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões da Codex CLI** são retomadas por meio de saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: garanta que `sessionArg` esteja definido e que `sessionMode` não seja
  `none` (atualmente, a Codex CLI não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI oferece suporte a caminhos de arquivo).

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
