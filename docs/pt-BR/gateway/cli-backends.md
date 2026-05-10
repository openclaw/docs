---
read_when:
    - Você quer uma alternativa confiável quando os provedores de API falham
    - Você está executando o Codex CLI ou outras CLIs de IA locais e deseja reutilizá-las
    - Você quer entender a ponte de loopback do MCP para acesso a ferramentas de backend da CLI
summary: 'Backends da CLI: fallback de CLI de IA local com ponte opcional de ferramentas MCP'
title: Backends da CLI
x-i18n:
    generated_at: "2026-05-10T19:32:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw pode executar **CLIs de IA locais** como uma **alternativa somente de texto** quando provedores de API estão fora do ar,
com limite de taxa, ou se comportando mal temporariamente. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do Gateway por meio de uma ponte MCP de loopback.
- **Streaming JSONL** para CLIs que oferecem suporte a isso.
- **Sessões são compatíveis** (para que turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança**, não como o caminho principal. Use quando você
quiser respostas de texto que "sempre funcionam" sem depender de APIs externas.

Se você quer um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de programação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends CLI não são ACP.

<Tip>
  Criando um novo Plugin de backend? Use
  [plugins de backend CLI](/pt-BR/plugins/cli-backend-plugins). Esta página é para usuários
  que estão configurando e operando um backend já registrado.
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

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação necessária além da própria CLI.

Se você usa um backend CLI incluído como o **provedor principal de mensagens** em um
host de Gateway, o OpenClaw agora carrega automaticamente o Plugin incluído proprietário quando sua configuração
referencia explicitamente esse backend em uma ref de modelo ou em
`agents.defaults.cliBackends`.

## Usando como alternativa

Adicione um backend CLI à sua lista de fallback para que ele só rode quando os modelos principais falharem:

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

Notas:

- Se você usa `agents.defaults.models` (lista de permissão), também deve incluir seus modelos de backend CLI ali.
- Se o provedor principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw vai
  tentar o backend CLI em seguida.

## Visão geral da configuração

Todos os backends CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **ID de provedor** (por exemplo, `codex-cli`, `my-cli`).
O ID de provedor se torna o lado esquerdo da sua ref de modelo:

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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
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
3. **Executa a CLI** com um ID de sessão (se compatível) para que o histórico permaneça consistente.
   O backend `claude-cli` incluído mantém um processo Claude stdio ativo por
   sessão do OpenClaw e envia turnos de acompanhamento por stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste IDs de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão da CLI.

<Note>
O backend Anthropic `claude-cli` incluído voltou a ser compatível. A equipe da Anthropic
nos disse que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como sancionado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend OpenAI `codex-cli` incluído passa o prompt de sistema do OpenClaw por meio
da substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag
`--append-system-prompt` no estilo Claude, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada nova sessão do Codex CLI.

O backend Anthropic `claude-cli` incluído recebe o snapshot de Skills do OpenClaw
de duas formas: o catálogo compacto de Skills do OpenClaw no prompt de sistema anexado, e
um Plugin temporário do Claude Code passado com `--plugin-dir`. O Plugin contém
apenas as Skills elegíveis para esse agente/sessão, então o resolvedor nativo de skills do Claude Code
vê o mesmo conjunto filtrado que o OpenClaw anunciaria no
prompt. Substituições de env/chave de API das Skills ainda são aplicadas pelo OpenClaw ao
ambiente do processo filho para a execução.

O Claude CLI também tem seu próprio modo de permissão não interativo. O OpenClaw mapeia isso
para a política de exec existente em vez de adicionar uma configuração específica do Claude: quando a
política de exec solicitada efetiva é YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), o OpenClaw adiciona `--permission-mode bypassPermissions`.
Configurações por agente em `agents.list[].tools.exec` substituem `tools.exec` global para
esse agente. Para forçar um modo Claude diferente, defina args brutos explícitos do backend,
como `--permission-mode default` ou `--permission-mode acceptEdits` em
`agents.defaults.cliBackends.claude-cli.args` e os `resumeArgs` correspondentes.

O backend Anthropic `claude-cli` incluído também mapeia níveis `/think` do OpenClaw
para a flag nativa `--effort` do Claude Code para níveis diferentes de off. `minimal` e
`low` mapeiam para `low`, `adaptive` e `medium` mapeiam para `medium`, e `high`,
`xhigh` e `max` mapeiam diretamente. Outros backends CLI precisam que seu Plugin proprietário
declare um mapeador argv equivalente antes que `/think` possa afetar a CLI gerada.

Antes que o OpenClaw possa usar o backend `claude-cli` incluído, o próprio Claude Code
já deve estar conectado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Use `agents.defaults.cliBackends.claude-cli.command` apenas quando o binário `claude`
ainda não estiver no `PATH`.

## Sessões

- Se a CLI oferece suporte a sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisa ser inserido
  em várias flags.
- Se a CLI usa um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e, opcionalmente, `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um ID de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: só envia um ID de sessão se um já tiver sido armazenado antes.
  - `none`: nunca envia um ID de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que turnos de acompanhamento reutilizem o processo Claude ativo enquanto
  ele estiver ativo. Stdio aquecido agora é o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  sair, o OpenClaw retoma a partir do ID de sessão Claude armazenado. IDs de sessão
  armazenados são verificados contra uma transcrição de projeto legível existente antes de
  retomar, então vínculos fantasmas são limpos com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão do Claude CLI sob `--resume`.
- Sessões live do Claude mantêm guardas de saída JSONL limitados. Os padrões permitem até
  8 MiB e 20.000 linhas JSONL brutas por turno. Turnos do Claude com muitas ferramentas podem aumentá-los
  por backend com
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  e `maxTurnLines`; o OpenClaw limita essas configurações a 64 MiB e 100.000
  linhas.
- Sessões CLI armazenadas são continuidade pertencente ao provedor. A redefinição diária implícita de sessão
  não as corta; `/reset` e políticas explícitas `session.reset` ainda
  cortam.
- Sessões CLI novas normalmente resemeiam apenas a partir do resumo de Compaction do OpenClaw
  mais a cauda pós-Compaction. Para recuperar sessões curtas que são invalidadas
  antes da Compaction, um backend pode optar por isso com
  `reseedFromRawTranscriptWhenUncompacted: true`. O OpenClaw ainda mantém a resemeadura da transcrição
  bruta limitada e restringe a invalidações seguras, como transcrições
  CLI ausentes, mudanças de prompt de sistema/MCP, ou nova tentativa por sessão expirada; mudanças de
  perfil de autenticação ou época de credenciais nunca resemeiam o histórico bruto de transcrição.

Notas de serialização:

- `serialize: true` mantém execuções da mesma lane ordenadas.
- A maioria das CLIs serializa em uma lane de provedor.
- O OpenClaw descarta a reutilização de sessão CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo uma alteração no ID do perfil de autenticação, chave de API estática, token estático, ou identidade de
  conta OAuth quando a CLI expõe uma. A rotação de tokens OAuth de acesso e refresh
  não corta a sessão CLI armazenada. Se uma CLI não expõe um ID de conta OAuth
  estável, o OpenClaw deixa essa CLI impor permissões de retomada.

## Prelúdio de fallback a partir de sessões claude-cli

Quando uma tentativa `claude-cli` falha e passa para um candidato não CLI em
[`agents.defaults.model.fallbacks`](/pt-BR/concepts/model-failover), o OpenClaw semeia
a próxima tentativa com um prelúdio de contexto coletado da transcrição JSONL local
do Claude Code em `~/.claude/projects/`. Sem essa semente, o provedor de fallback
começaria frio porque a transcrição da própria sessão do OpenClaw fica vazia
para execuções `claude-cli`.

- O prelúdio prefere o resumo `/compact` mais recente ou o marcador `compact_boundary`,
  depois anexa os turnos pós-limite mais recentes até um orçamento de caracteres.
  Turnos pré-limite são descartados porque o resumo já os representa.
- Blocos de ferramentas são consolidados em dicas compactas `(tool call: name)` e
  `(tool result: …)` para manter o orçamento de prompt honesto. O resumo é
  rotulado como `(truncated)` se estourar.
- Fallbacks `claude-cli` para `claude-cli` do mesmo provedor dependem do próprio
  `--resume` do Claude e pulam o prelúdio.
- A semente reutiliza a validação de caminho de arquivo de sessão Claude existente, então
  caminhos arbitrários não podem ser lidos.

## Imagens (repasse)

Se a sua CLI aceita caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos são passados como args da CLI. Se `imageArg` estiver ausente, o OpenClaw anexa os
caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam automaticamente
arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + ID de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta em `response` e
  o uso em `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente mais identificadores
  de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último arg da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (pertencentes ao Plugin)

O Plugin OpenAI incluído também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O Plugin do Google incluído também registra um padrão para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: a CLI local do Gemini deve estar instalada e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre JSON da CLI do Gemini:

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Sobrescreva apenas se necessário (comum: caminho absoluto de `command`).

## Padrões pertencentes ao Plugin

Os padrões de backend de CLI agora fazem parte da superfície do Plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda sobrescreve o padrão do Plugin.
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
reescreve deltas transmitidos do assistente e o texto final analisado antes que o OpenClaw trate
seus próprios marcadores de controle e a entrega ao canal.

Para CLIs que emitem JSONL compatível com Claude Code stream-json, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Sobreposições de MCP em pacote

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
aderir a uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: sobrescritas de configuração inline para `mcp_servers`; o servidor de loopback
  do OpenClaw gerado é marcado com o modo de aprovação de ferramenta por servidor do Codex
  para que chamadas MCP não possam travar em prompts de aprovação local
- `google-gemini-cli`: arquivo de configurações de sistema Gemini gerado

Quando bundle MCP está habilitado, o OpenClaw:

- inicia um servidor HTTP MCP de loopback que expõe ferramentas do Gateway ao processo da CLI
- autentica a ponte com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso a ferramentas ao contexto da sessão, conta e canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- mescla esses servidores com qualquer formato existente de configuração/definições MCP do backend
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend adere ao bundle MCP para que execuções em segundo plano permaneçam isoladas.

Runtimes MCP incluídos com escopo de sessão são armazenados em cache para reutilização dentro de uma sessão e, em seguida,
removidos após `mcp.sessionIdleTtlMs` milissegundos de tempo ocioso (padrão de 10
minutos; defina `0` para desabilitar). Execuções incorporadas de uso único, como sondagens de autenticação,
geração de slug e recuperação de Active Memory solicitam limpeza no fim da execução para que filhos
stdio e streams Streamable HTTP/SSE não sobrevivam à execução.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo de backend de CLI. Backends só veem ferramentas do Gateway quando aderem a
  `bundleMcp: true`.
- **Streaming é específico do backend.** Alguns backends transmitem JSONL; outros armazenam em buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões da CLI do Codex** são retomadas por saída de texto (sem JSONL), que é menos
  estruturada do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: certifique-se de que `sessionArg` esteja definido e que `sessionMode` não seja
  `none` (a CLI do Codex atualmente não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI aceita caminhos de arquivo).

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
