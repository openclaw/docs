---
read_when:
    - Você quer uma alternativa confiável quando os provedores de API falham
    - Você está executando CLIs de IA locais e quer reutilizá-las
    - Você quer entender a ponte de local loopback do MCP para acesso às ferramentas de backend da CLI
summary: 'Backends de CLI: fallback de CLI de IA local com ponte opcional de ferramenta MCP'
title: Backends da CLI
x-i18n:
    generated_at: "2026-07-01T05:33:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw pode executar **CLIs de IA locais** como um **fallback somente de texto** quando provedores de API estão fora do ar,
com limite de taxa, ou temporariamente com comportamento instável. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do Gateway por meio de uma ponte MCP de local loopback.
- **Streaming JSONL** para CLIs que oferecem suporte.
- **Sessões são compatíveis** (para que turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança**, em vez de um caminho principal. Use quando você
quiser respostas de texto que "sempre funcionam" sem depender de APIs externas.

Se você quer um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

<Tip>
  Criando um novo Plugin de backend? Use
  [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins). Esta página é para usuários
  configurando e operando um backend já registrado.
</Tip>

## Início rápido para iniciantes

Você pode usar a CLI do Claude Code **sem nenhuma configuração** (o Plugin Anthropic integrado
registra um backend padrão):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` é o ID de agente padrão quando nenhuma lista explícita de agentes está configurada. Se
você usa vários agentes, substitua-o pelo ID de agente que deseja executar.

Se seu Gateway roda sob launchd/systemd e o PATH é mínimo, adicione apenas o
caminho do comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação necessária além da própria CLI.

Se você usa um backend de CLI integrado como o **provedor principal de mensagens** em um
host de Gateway, o OpenClaw agora carrega automaticamente o Plugin integrado proprietário quando sua configuração
referencia explicitamente esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallbacks para que ele só execute quando modelos principais falharem:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Notas:

- Se você usa `agents.defaults.models` (lista de permissões), também precisa incluir ali seus modelos de backend de CLI.
- Se o provedor principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **ID de provedor** (por exemplo, `claude-cli`, `my-cli`).
O ID do provedor se torna o lado esquerdo da sua referência de modelo:

```
<provider>/<model>
```

### Exemplo de configuração

```json5
{
  agents: {
    defaults: {
      cliBackends: {
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

1. **Seleciona um backend** com base no prefixo do provedor (`claude-cli/...`).
2. **Cria um prompt de sistema** usando o mesmo prompt do OpenClaw + contexto do workspace.
3. **Executa a CLI** com um ID de sessão (se compatível) para que o histórico permaneça consistente.
   O backend integrado `claude-cli` mantém um processo stdio do Claude ativo por
   sessão do OpenClaw e envia turnos de acompanhamento por stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste IDs de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão de CLI.

<Note>
O backend Anthropic integrado `claude-cli` é compatível novamente. A equipe da Anthropic
nos informou que o uso da CLI do Claude no estilo OpenClaw é permitido novamente, então o OpenClaw trata
o uso de `claude -p` como sancionado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend Anthropic integrado `claude-cli` prefere o resolvedor de skill nativo do Claude Code
para Skills do OpenClaw. Quando o snapshot atual de Skills inclui pelo menos
uma skill selecionada com um caminho materializado, o OpenClaw passa um Plugin temporário do Claude
Code com `--plugin-dir` e omite o catálogo duplicado de Skills do OpenClaw
do prompt de sistema anexado. Se o snapshot não tiver nenhuma skill de Plugin
materializada, o OpenClaw mantém o catálogo do prompt como fallback. Sobrescritas de env/chave de API
de Skills ainda são aplicadas pelo OpenClaw ao ambiente do processo filho para a
execução.

A CLI do Claude também tem seu próprio modo de permissão não interativo. O OpenClaw mapeia isso
para a política de execução existente em vez de adicionar configuração de política específica do Claude.
Para sessões Claude ao vivo gerenciadas pelo OpenClaw, a política efetiva de execução do OpenClaw é
autoritativa: YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`) inicia o Claude com
`--permission-mode bypassPermissions`, enquanto a política efetiva de execução restritiva
inicia o Claude com `--permission-mode default`. Configurações por agente em
`agents.list[].tools.exec` substituem `tools.exec` global para esse
agente. Argumentos brutos do backend Claude ainda podem incluir `--permission-mode`, mas inicializações
ao vivo do Claude normalizam essa flag para corresponder à política efetiva de execução do OpenClaw.

O backend Anthropic integrado `claude-cli` também mapeia níveis de `/think` do OpenClaw
para a flag nativa `--effort` do Claude Code para níveis que não sejam off. `minimal` e
`low` mapeiam para `low`, `adaptive` e `medium` mapeiam para `medium`, e `high`,
`xhigh` e `max` mapeiam diretamente. Outros backends de CLI precisam que seu Plugin proprietário
declare um mapeador argv equivalente antes que `/think` possa afetar a CLI gerada.

Antes que o OpenClaw possa usar o backend integrado `claude-cli`, o próprio Claude Code
já deve estar autenticado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalações em Docker precisam que o Claude Code esteja instalado e autenticado dentro da home persistida
do contêiner, não apenas no host. Consulte
[Backend de CLI do Claude no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).

Use `agents.defaults.cliBackends.claude-cli.command` apenas quando o binário `claude`
ainda não estiver no `PATH`.

## Sessões

- Se a CLI oferece suporte a sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se a CLI usa um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um ID de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: só envia um ID de sessão se um já tiver sido armazenado antes.
  - `none`: nunca envia um ID de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que turnos de acompanhamento reutilizem o processo Claude ao vivo enquanto
  ele estiver ativo. stdio aquecido agora é o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  sair, o OpenClaw retoma a partir do ID de sessão armazenado do Claude. IDs de sessão
  armazenados são verificados contra uma transcrição de projeto existente e legível antes da
  retomada, então vínculos fantasma são limpos com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão da CLI do Claude sob `--resume`.
- Sessões Claude ao vivo mantêm guardas limitados de saída JSONL. Os padrões permitem até
  8 MiB e 20.000 linhas JSONL brutas por turno. Turnos do Claude com muitas ferramentas podem aumentá-los
  por backend com
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  e `maxTurnLines`; o OpenClaw limita essas configurações a 64 MiB e 100.000
  linhas.
- Sessões de CLI armazenadas são continuidade de propriedade do provedor. A redefinição diária implícita de sessão
  não as corta; `/reset` e políticas explícitas `session.reset` ainda
  cortam.
- Sessões de CLI novas normalmente replantam apenas a partir do resumo de Compaction do OpenClaw
  mais a cauda pós-Compaction. Para recuperar sessões curtas que são invalidadas
  antes da Compaction, um backend pode optar por isso com
  `reseedFromRawTranscriptWhenUncompacted: true`. O OpenClaw ainda mantém o replantio de
  transcrição bruta limitado e o restringe a invalidações seguras, como transcrições
  de CLI ausentes, mudanças de prompt de sistema/MCP, ou nova tentativa por sessão expirada; mudanças de
  perfil de autenticação ou época de credencial nunca replantam histórico de transcrição bruta.

Notas de serialização:

- `serialize: true` mantém execuções da mesma faixa ordenadas.
- A maioria das CLIs serializa em uma faixa de provedor.
- O OpenClaw descarta a reutilização de sessão de CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo mudança de ID de perfil de autenticação, chave de API estática, token estático, ou identidade de conta
  OAuth quando a CLI expõe uma. A rotação de tokens OAuth de acesso e atualização não corta a sessão de CLI armazenada. Se uma CLI não expuser um
  ID de conta OAuth estável, o OpenClaw deixa essa CLI impor permissões de retomada.

## Prelúdio de fallback de sessões claude-cli

Quando uma tentativa `claude-cli` falha para um candidato não CLI em
[`agents.defaults.model.fallbacks`](/pt-BR/concepts/model-failover), o OpenClaw semeia
a próxima tentativa com um prelúdio de contexto colhido da transcrição JSONL local
do Claude Code em `~/.claude/projects/`. Sem essa semente, o provedor de fallback
começaria frio porque a própria transcrição de sessão do OpenClaw fica vazia
para execuções `claude-cli`.

- O prelúdio prefere o resumo `/compact` mais recente ou o marcador `compact_boundary`,
  depois anexa os turnos pós-limite mais recentes até um orçamento de caracteres.
  Turnos pré-limite são descartados porque o resumo já os representa.
- Blocos de ferramenta são consolidados em dicas compactas `(tool call: name)` e
  `(tool result: …)` para manter o orçamento de prompt honesto. O resumo é
  rotulado como `(truncated)` se exceder o limite.
- Fallbacks `claude-cli` para `claude-cli` do mesmo provedor dependem do próprio
  `--resume` do Claude e pulam o prelúdio.
- A semente reutiliza a validação existente de caminho de arquivo de sessão do Claude, para que
  caminhos arbitrários não possam ser lidos.

## Imagens (repasse)

Se sua CLI aceita caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos são passados como argumentos da CLI. Se `imageArg` estiver ausente, o OpenClaw anexa os
caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam automaticamente
arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + ID de sessão.
- Para saída JSON da CLI Gemini, o OpenClaw lê o texto de resposta de `response` e o uso
  de `stats` quando `usage` está ausente ou vazio. O padrão integrado da CLI Gemini
  usa `stream-json`, mas sobrescritas antigas `--output-format json` ainda usam o
  analisador JSON.
- `output: "jsonl"` analisa streams JSONL e extrai a mensagem final do agente mais identificadores
  de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (pertencentes ao Plugin)

Os padrões de backend CLI incluídos ficam com o Plugin proprietário. Por exemplo,
Anthropic é proprietário de `claude-cli` e Google é proprietário de `google-gemini-cli`. Execuções de
agente do OpenAI Codex usam o harness de app-server do Codex por meio de `openai/*`; o OpenClaw não
registra mais um backend `codex-cli` incluído.

O Plugin Anthropic incluído registra um padrão para `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

O Plugin Google incluído também registra um padrão para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: a CLI local do Gemini deve estar instalada e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre a saída da CLI do Gemini:

- O parser padrão de `stream-json` lê eventos `message` do assistente, eventos de ferramenta,
  uso final de `result` e eventos fatais de erro do Gemini.
- Se você substituir os argumentos do Gemini para `--output-format json`, o OpenClaw normaliza esse
  backend de volta para `output: "json"` e lê o texto da resposta no campo `response` do JSON.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua somente se necessário (comum: caminho absoluto de `command`).

## Padrões pertencentes ao Plugin

Os padrões de backend CLI agora fazem parte da superfície do Plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas refs de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do Plugin.
- A limpeza de configuração específica do backend permanece pertencente ao Plugin por meio do hook opcional
  `normalizeConfig`.

Plugins que precisam de pequenos shims de compatibilidade de prompt/mensagem podem declarar
transformações de texto bidirecionais sem substituir um provedor ou backend CLI:

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
reescreve o texto transmitido do assistente e o texto final analisado antes que o OpenClaw processe
seus próprios marcadores de controle e a entrega no canal. Para chamadas de modelo apoiadas por provedor,
`output` também restaura valores de string dentro de argumentos estruturados de chamada de ferramenta após
o reparo do stream e antes da execução da ferramenta. Fragmentos JSON brutos do provedor permanecem
inalterados; consumidores devem usar o payload parcial, final ou de resultado estruturado.

Para CLIs que emitem eventos JSONL específicos do provedor, defina `jsonlDialect` na configuração desse
backend. Os dialetos compatíveis são `claude-stream-json` para streams compatíveis com Claude
Code e `gemini-stream-json` para eventos `stream-json` da CLI do Gemini.

## Propriedade da Compaction nativa

Alguns backends CLI executam um agente que compacta sua **própria** transcrição, então o OpenClaw não deve
executar seu sumarizador de salvaguarda sobre eles - fazer isso entra em conflito com a própria
Compaction do backend e pode fazer o turno falhar de forma definitiva.

`claude-cli` não tem endpoint de harness - o Claude Code compacta internamente - então ele declara
`ownsNativeCompaction: true`, e o OpenClaw retorna uma operação sem efeito do caminho de Compaction.
Sessões de harness nativo, como Codex, continuam roteando para seu endpoint de Compaction do harness.

Como o backend é proprietário da Compaction, a antiga solução provisória de definir
`contextTokens: 1_000_000` apenas para impedir que a salvaguarda do OpenClaw fosse acionada em uma
sessão `claude-cli` **não é mais necessária** - a opção de exclusão a substitui.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` apenas para um backend que realmente é proprietário da sua Compaction: ele
deve limitar de forma confiável sua própria transcrição à medida que se aproxima da janela de contexto e persistir uma
sessão retomável (por exemplo, `--resume` / `--session-id`); caso contrário, uma sessão adiada pode
permanecer acima do orçamento. Sessões correspondentes a `agentHarnessId` ainda são roteadas para o endpoint do harness.

## Sobreposições MCP incluídas

Backends CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `google-gemini-cli`: arquivo de configurações do sistema Gemini gerado

Quando o MCP incluído está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP de local loopback que expõe ferramentas do Gateway ao processo da CLI
- autentica a ponte com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- restringe o acesso às ferramentas ao contexto da sessão, conta e canal atuais
- carrega servidores MCP incluídos habilitados para o workspace atual
- mescla-os com qualquer formato de configuração/definições MCP existente do backend
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta pelo MCP incluído, para que execuções em segundo plano permaneçam isoladas.

Runtimes MCP incluídos com escopo de sessão são armazenados em cache para reutilização dentro de uma sessão e depois
removidos após `mcp.sessionIdleTtlMs` milissegundos de tempo ocioso (padrão de 10
minutos; defina `0` para desabilitar). Execuções incorporadas de uso único, como sondagens de autenticação,
geração de slug e solicitações de recuperação da Active Memory fazem limpeza no fim da execução para que filhos stdio
e streams Streamable HTTP/SSE não sobrevivam à execução.

## Limite do histórico de reseed

Quando uma nova sessão CLI é semeada a partir de uma transcrição anterior do OpenClaw (por
exemplo, após uma nova tentativa de `session_expired`), o bloco
`<conversation_history>` renderizado é limitado para impedir que prompts de reseed
explodam. O padrão é `12288` caracteres (cerca de 3000 tokens).

Backends da CLI do Claude usam automaticamente um limite maior derivado do tier de contexto
resolvido do Claude. Execuções padrão de 200 mil tokens do Claude mantêm uma fatia maior da transcrição,
e execuções de 1 milhão de tokens do Claude mantêm uma fatia ainda maior, enquanto outros backends CLI
mantêm o padrão conservador.

- O limite governa apenas o bloco de histórico anterior do prompt de reseed. Limites de saída
  de sessão ativa são ajustados separadamente em `reliability.outputLimits`
  (veja [Sessões](#sessions)).

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend CLI. Backends só veem ferramentas do Gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends transmitem JSONL; outros mantêm em buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: garanta que `sessionArg` esteja definido e que `sessionMode` não seja
  `none`.
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI aceita caminhos de arquivo).

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
