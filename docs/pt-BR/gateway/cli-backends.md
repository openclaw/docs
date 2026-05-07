---
read_when:
    - Você quer uma alternativa confiável quando os provedores de API falham
    - Você está executando o Codex CLI ou outras CLIs locais de IA e quer reutilizá-las
    - Você quer entender a ponte de retorno local do MCP para acesso a ferramentas do back-end da CLI
summary: 'Backends de CLI: fallback local da CLI de IA com ponte opcional de ferramentas MCP'
title: Backends da CLI
x-i18n:
    generated_at: "2026-05-07T13:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw pode executar **CLIs de IA locais** como um **fallback somente texto** quando provedores de API estiverem fora do ar,
com limite de taxa ou se comportando temporariamente mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do Gateway por meio de uma ponte MCP de loopback.
- **Streaming JSONL** para CLIs compatíveis.
- **Sessões são compatíveis** (para que interações de acompanhamento permaneçam coerentes).
- **Imagens podem ser encaminhadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança**, não como um caminho principal. Use quando você
quiser respostas de texto que "sempre funcionam" sem depender de APIs externas.

Se você quiser um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

<Tip>
  Criando um novo Plugin de backend? Use
  [plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins). Esta página é para usuários
  que configuram e operam um backend já registrado.
</Tip>

## Início rápido para iniciantes

Você pode usar o Codex CLI **sem nenhuma configuração** (o Plugin OpenAI incluído
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

É isso. Nenhuma chave, nenhuma configuração extra de autenticação além da própria CLI.

Se você usa um backend de CLI incluído como **provedor principal de mensagens** em um
host Gateway, o OpenClaw agora carrega automaticamente o Plugin incluído proprietário quando sua configuração
faz referência explicitamente a esse backend em uma ref de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele só rode quando os modelos principais falharem:

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

- Se você usa `agents.defaults.models` (lista de permissões), também precisa incluir os modelos do seu backend de CLI ali.
- Se o provedor principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é identificada por um **id de provedor** (por exemplo, `codex-cli`, `my-cli`).
O id de provedor se torna o lado esquerdo da sua ref de modelo:

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
2. **Cria um prompt de sistema** usando o mesmo prompt do OpenClaw + contexto do workspace.
3. **Executa a CLI** com um id de sessão (se compatível) para que o histórico permaneça consistente.
   O backend `claude-cli` incluído mantém um processo Claude stdio ativo por
   sessão do OpenClaw e envia interações de acompanhamento por stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão de CLI.

<Note>
O backend Anthropic `claude-cli` incluído voltou a ser compatível. Funcionários da Anthropic
nos disseram que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como sancionado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend OpenAI `codex-cli` incluído passa o prompt de sistema do OpenClaw por meio
da substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada nova sessão do Codex CLI.

O backend Anthropic `claude-cli` incluído recebe o snapshot de Skills do OpenClaw
de duas formas: o catálogo compacto de Skills do OpenClaw no prompt de sistema anexado, e
um Plugin temporário do Claude Code passado com `--plugin-dir`. O Plugin contém
apenas as Skills elegíveis para aquele agente/sessão, então o resolvedor nativo de Skills
do Claude Code vê o mesmo conjunto filtrado que o OpenClaw anunciaria de outra forma no
prompt. Substituições de env/chave de API de Skills ainda são aplicadas pelo OpenClaw ao
ambiente do processo filho para a execução.

O Claude CLI também tem seu próprio modo de permissões não interativo. O OpenClaw mapeia isso
para a política de exec existente, em vez de adicionar configuração específica do Claude: quando a
política de exec solicitada efetiva é YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), o OpenClaw adiciona `--permission-mode bypassPermissions`.
Configurações por agente em `agents.list[].tools.exec` substituem `tools.exec` global para
esse agente. Para forçar um modo diferente do Claude, defina args brutos explícitos do backend,
como `--permission-mode default` ou `--permission-mode acceptEdits` em
`agents.defaults.cliBackends.claude-cli.args` e `resumeArgs` correspondentes.

O backend Anthropic `claude-cli` incluído também mapeia níveis `/think` do OpenClaw
para a flag nativa `--effort` do Claude Code para níveis diferentes de off. `minimal` e
`low` mapeiam para `low`, `adaptive` e `medium` mapeiam para `medium`, e `high`,
`xhigh` e `max` mapeiam diretamente. Outros backends de CLI precisam que seu Plugin proprietário
declare um mapeador de argv equivalente antes que `/think` possa afetar a CLI gerada.

Antes que o OpenClaw possa usar o backend `claude-cli` incluído, o próprio Claude Code
já precisa estar autenticado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Use `agents.defaults.cliBackends.claude-cli.command` apenas quando o binário `claude`
ainda não estiver no `PATH`.

## Sessões

- Se a CLI for compatível com sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se a CLI usa um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: só envia um id de sessão se um tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.
- `claude-cli` usa como padrão `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que interações de acompanhamento reutilizem o processo Claude ativo enquanto
  ele estiver ativo. Stdio aquecido é agora o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  sair, o OpenClaw retoma a partir do id de sessão Claude armazenado. Ids de sessão
  armazenados são verificados contra uma transcrição de projeto legível existente antes de
  retomar, então vinculações fantasma são limpas com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão do Claude CLI sob `--resume`.
- Sessões Claude ao vivo mantêm proteções limitadas de saída JSONL. Os padrões permitem até
  8 MiB e 20.000 linhas JSONL brutas por interação. Interações Claude com muitas ferramentas podem aumentar
  esses limites por backend com
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  e `maxTurnLines`; o OpenClaw limita essas configurações a 64 MiB e 100.000
  linhas.
- Sessões de CLI armazenadas são continuidade de propriedade do provedor. A redefinição diária implícita de sessão
  não as corta; `/reset` e políticas explícitas `session.reset` ainda
  cortam.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma lane ordenadas.
- A maioria das CLIs serializa em uma lane de provedor.
- O OpenClaw descarta a reutilização de sessão de CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo uma mudança no id do perfil de autenticação, chave de API estática, token estático ou identidade de conta OAuth
  quando a CLI expõe uma. A rotação de tokens OAuth de acesso e atualização
  não corta a sessão de CLI armazenada. Se uma CLI não expõe um
  id estável de conta OAuth, o OpenClaw deixa essa CLI aplicar as permissões de retomada.

## Prelúdio de fallback de sessões claude-cli

Quando uma tentativa de `claude-cli` faz failover para uma candidata não CLI em
[`agents.defaults.model.fallbacks`](/pt-BR/concepts/model-failover), o OpenClaw semeia
a próxima tentativa com um prelúdio de contexto coletado da transcrição JSONL local
do Claude Code em `~/.claude/projects/`. Sem essa semente, o provedor de fallback
começaria frio porque a transcrição de sessão do próprio OpenClaw fica vazia
para execuções `claude-cli`.

- O prelúdio prefere o resumo `/compact` mais recente ou o marcador `compact_boundary`,
  depois anexa as interações pós-fronteira mais recentes até um orçamento de caracteres.
  Interações pré-fronteira são descartadas porque o resumo já as representa.
- Blocos de ferramenta são condensados em dicas compactas `(tool call: name)` e
  `(tool result: …)` para manter o orçamento de prompt honesto. O resumo é
  rotulado como `(truncated)` se estourar o limite.
- Fallbacks do mesmo provedor de `claude-cli` para `claude-cli` dependem do próprio
  `--resume` do Claude e ignoram o prelúdio.
- A semente reutiliza a validação existente de caminho de arquivo de sessão do Claude, então
  caminhos arbitrários não podem ser lidos.

## Imagens (pass-through)

Se sua CLI aceita caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como args da CLI. Se `imageArg` estiver ausente, o OpenClaw anexa os
caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam automaticamente
arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  o uso de `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente mais identificadores
  de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último arg da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (propriedade do Plugin)

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

Pré-requisito: a CLI Gemini local deve estar instalada e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Notas sobre JSON da CLI Gemini:

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Sobrescreva apenas se necessário (comum: caminho absoluto de `command`).

## Padrões pertencentes ao Plugin

Os padrões de backend da CLI agora fazem parte da superfície do Plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas refs de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda sobrescreve o padrão do Plugin.
- A limpeza de configuração específica do backend permanece pertencente ao Plugin por meio do hook opcional
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
reescreve deltas do assistente transmitidos em streaming e o texto final analisado antes que o OpenClaw manipule
seus próprios marcadores de controle e a entrega ao canal.

Para CLIs que emitem JSONL compatível com Claude Code stream-json, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Sobreposições MCP agrupadas

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento agrupado atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: sobrescritas de configuração inline para `mcp_servers`; o servidor
  local loopback gerado do OpenClaw é marcado com o modo de aprovação de ferramenta por servidor do Codex
  para que chamadas MCP não possam travar em prompts de aprovação local
- `google-gemini-cli`: arquivo de configurações do sistema Gemini gerado

Quando MCP agrupado está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP de loopback que expõe ferramentas do Gateway ao processo da CLI
- autentica a ponte com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso a ferramentas ao contexto da sessão, conta e canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- mescla-os com qualquer formato existente de configuração/definições MCP do backend
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta por MCP agrupado, para que execuções em segundo plano permaneçam isoladas.

Runtimes MCP agrupados com escopo de sessão são armazenados em cache para reutilização dentro de uma sessão e depois
coletados após `mcp.sessionIdleTtlMs` milissegundos de tempo ocioso (padrão de 10
minutos; defina `0` para desabilitar). Execuções incorporadas de uso único, como probes de autenticação,
geração de slug e solicitações de recuperação da Active Memory, fazem limpeza no fim da execução para que filhos
stdio e streams Streamable HTTP/SSE não sobrevivam à execução.

## Limitações

- **Sem chamadas diretas de ferramentas do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo de backend da CLI. Backends só veem ferramentas do Gateway quando optam por
  `bundleMcp: true`.
- **Streaming é específico do backend.** Alguns backends transmitem JSONL em streaming; outros armazenam em buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões da CLI Codex** retomam via saída de texto (sem JSONL), que é menos
  estruturada do que a execução inicial com `--json`. Sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: garanta que `sessionArg` esteja definido e `sessionMode` não seja
  `none` (a CLI Codex atualmente não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI aceita caminhos de arquivo).

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
