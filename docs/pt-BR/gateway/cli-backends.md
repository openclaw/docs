---
read_when:
    - Você quer uma alternativa confiável quando os provedores de API falham
    - Você está executando CLIs de IA locais e quer reutilizá-las
    - Você quer entender a ponte local loopback MCP para acesso a ferramentas de backend pela CLI
summary: 'Backends de CLI: fallback local de CLI de IA com ponte opcional de ferramenta MCP'
title: Backends da CLI
x-i18n:
    generated_at: "2026-06-27T17:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw pode executar **CLIs de IA locais** como um **fallback somente texto** quando provedores de API estiverem indisponíveis,
com limite de taxa, ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do Gateway por meio de uma ponte MCP de local loopback.
- **Streaming JSONL** para CLIs que o suportam.
- **Sessões são suportadas** (para que turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança**, não como um caminho principal. Use quando você
quiser respostas em texto que "sempre funcionam" sem depender de APIs externas.

Se você quer um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões persistentes externas de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

<Tip>
  Criando um novo Plugin de backend? Use
  [Plugins de backend de CLI](/pt-BR/plugins/cli-backend-plugins). Esta página é para usuários
  configurando e operando um backend já registrado.
</Tip>

## Início rápido para iniciantes

Você pode usar a Claude Code CLI **sem nenhuma configuração** (o Plugin Anthropic incluído
registra um backend padrão):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` é o id de agente padrão quando nenhuma lista explícita de agentes está configurada. Se
você usa vários agentes, substitua-o pelo id do agente que deseja executar.

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

É isso. Não são necessárias chaves nem configuração extra de autenticação além da própria CLI.

Se você usa um backend de CLI incluído como **provedor principal de mensagens** em um
host de Gateway, o OpenClaw agora carrega automaticamente o Plugin incluído proprietário quando sua configuração
referencia explicitamente esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele só execute quando os modelos principais falharem:

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

Observações:

- Se você usa `agents.defaults.models` (lista de permissões), também deve incluir seus modelos de backend de CLI ali.
- Se o provedor principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **id de provedor** (por exemplo, `claude-cli`, `my-cli`).
O id de provedor se torna o lado esquerdo da sua referência de modelo:

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

1. **Seleciona um backend** com base no prefixo de provedor (`claude-cli/...`).
2. **Constrói um prompt do sistema** usando o mesmo prompt do OpenClaw + contexto do workspace.
3. **Executa a CLI** com um id de sessão (se suportado) para que o histórico permaneça consistente.
   O backend `claude-cli` incluído mantém um processo stdio do Claude ativo por
   sessão do OpenClaw e envia turnos de acompanhamento por stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão de CLI.

<Note>
O backend Anthropic `claude-cli` incluído voltou a ser suportado. A equipe da Anthropic
nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata o
uso de `claude -p` como sancionado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend Anthropic `claude-cli` incluído prefere o resolvedor nativo de Skills do Claude Code
para Skills do OpenClaw. Quando o snapshot atual de Skills inclui pelo menos
uma skill selecionada com um caminho materializado, o OpenClaw passa um Plugin temporário do Claude
Code com `--plugin-dir` e omite o catálogo duplicado de Skills do OpenClaw
do prompt do sistema anexado. Se o snapshot não tiver nenhuma skill de Plugin materializada,
o OpenClaw mantém o catálogo do prompt como fallback. Substituições de env/chave de API de skill
ainda são aplicadas pelo OpenClaw ao ambiente do processo filho para a
execução.

A Claude CLI também tem seu próprio modo de permissão não interativo. O OpenClaw mapeia isso
para a política de exec existente em vez de adicionar uma configuração de política específica do Claude.
Para sessões live do Claude gerenciadas pelo OpenClaw, a política de exec efetiva do OpenClaw é
autoritativa: YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`) inicia o Claude com
`--permission-mode bypassPermissions`, enquanto uma política de exec efetiva restritiva
inicia o Claude com `--permission-mode default`. Configurações por agente
`agents.list[].tools.exec` substituem `tools.exec` global para esse
agente. Argumentos brutos do backend Claude ainda podem incluir `--permission-mode`, mas inicializações live
do Claude normalizam essa flag para corresponder à política de exec efetiva do OpenClaw.

O backend Anthropic `claude-cli` incluído também mapeia níveis `/think` do OpenClaw
para a flag nativa `--effort` do Claude Code para níveis que não sejam off. `minimal` e
`low` mapeiam para `low`, `adaptive` e `medium` mapeiam para `medium`, e `high`,
`xhigh` e `max` mapeiam diretamente. Outros backends de CLI precisam que seu Plugin proprietário
declare um mapeador de argv equivalente antes que `/think` possa afetar a CLI gerada.

Antes que o OpenClaw possa usar o backend `claude-cli` incluído, o próprio Claude Code
já deve estar autenticado no mesmo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalações Docker precisam do Claude Code instalado e autenticado dentro do home persistido
do contêiner, não apenas no host. Consulte
[Backend Claude CLI no Docker](/pt-BR/install/docker#claude-cli-backend-in-docker).

Use `agents.defaults.cliBackends.claude-cli.command` somente quando o binário `claude`
ainda não estiver em `PATH`.

## Sessões

- Se a CLI suporta sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se a CLI usa um **subcomando resume** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: só envia um id de sessão se um tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` para que turnos de acompanhamento reutilizem o processo live do Claude enquanto
  ele estiver ativo. stdio aquecido agora é o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  sair, o OpenClaw retoma a partir do id de sessão do Claude armazenado. IDs de sessão
  armazenados são verificados contra uma transcrição de projeto legível existente antes de
  retomar, então vínculos fantasma são limpos com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão de Claude CLI sob `--resume`.
- Sessões live do Claude mantêm proteções limitadas de saída JSONL. Os padrões permitem até
  8 MiB e 20.000 linhas JSONL brutas por turno. Turnos do Claude com muitas ferramentas podem aumentá-los
  por backend com
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  e `maxTurnLines`; o OpenClaw limita essas configurações a 64 MiB e 100.000
  linhas.
- Sessões de CLI armazenadas são continuidade pertencente ao provedor. A redefinição diária implícita de sessão
  não as corta; `/reset` e políticas explícitas `session.reset` ainda
  o fazem.
- Sessões de CLI novas normalmente ressemeiam apenas a partir do resumo de Compaction do OpenClaw
  mais a cauda pós-Compaction. Para recuperar sessões curtas que são invalidadas
  antes da Compaction, um backend pode optar por isso com
  `reseedFromRawTranscriptWhenUncompacted: true`. O OpenClaw ainda mantém o ressemeio por transcrição
  bruta limitado e o limita a invalidações seguras, como transcrições de CLI ausentes,
  alterações de prompt do sistema/MCP ou nova tentativa por sessão expirada; alterações de perfil de autenticação
  ou época de credenciais nunca ressemeiam o histórico bruto de transcrição.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma faixa ordenadas.
- A maioria das CLIs serializa em uma faixa de provedor.
- O OpenClaw descarta a reutilização de sessão de CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo uma alteração de id de perfil de autenticação, chave de API estática, token estático ou identidade de conta OAuth
  quando a CLI expõe uma. Rotação de tokens de acesso e atualização OAuth não corta a sessão de CLI armazenada. Se uma CLI não expõe um
  id de conta OAuth estável, o OpenClaw deixa essa CLI impor permissões de retomada.

## Prelúdio de fallback de sessões claude-cli

Quando uma tentativa `claude-cli` faz failover para um candidato não CLI em
[`agents.defaults.model.fallbacks`](/pt-BR/concepts/model-failover), o OpenClaw semeia
a próxima tentativa com um prelúdio de contexto coletado da transcrição JSONL local do Claude Code
em `~/.claude/projects/`. Sem essa semente, o provedor de fallback
começaria frio porque a transcrição de sessão do próprio OpenClaw fica vazia
para execuções `claude-cli`.

- O prelúdio prefere o resumo `/compact` mais recente ou o marcador `compact_boundary`,
  depois anexa os turnos pós-limite mais recentes até um orçamento de caracteres.
  Turnos pré-limite são descartados porque o resumo já os representa.
- Blocos de ferramenta são coalescidos em dicas compactas `(tool call: name)` e
  `(tool result: …)` para manter o orçamento do prompt honesto. O resumo é
  rotulado como `(truncated)` se transbordar.
- Fallbacks do mesmo provedor de `claude-cli` para `claude-cli` dependem do próprio
  `--resume` do Claude e ignoram o prelúdio.
- A semente reutiliza a validação existente de caminho de arquivo de sessão do Claude, portanto
  caminhos arbitrários não podem ser lidos.

## Imagens (repasse)

Se sua CLI aceita caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como args da CLI. Se `imageArg` estiver ausente, o OpenClaw anexa os
caminhos dos arquivos ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam automaticamente
arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON da Gemini CLI, o OpenClaw lê o texto de resposta de `response` e o uso
  de `stats` quando `usage` está ausente ou vazio. O padrão incluído da Gemini CLI
  usa `stream-json`, mas substituições antigas `--output-format json` ainda usam o
  analisador JSON.
- `output: "jsonl"` analisa streams JSONL e extrai a mensagem final do agente mais identificadores
  de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (pertencentes ao plugin)

Os padrões dos backends de CLI incluídos ficam com o plugin proprietário. Por exemplo,
Anthropic é proprietária de `claude-cli` e Google é proprietária de `google-gemini-cli`. Execuções de agentes do OpenAI Codex usam o harness app-server do Codex por meio de `openai/*`; o OpenClaw não
registra mais um backend `codex-cli` incluído.

O plugin Anthropic incluído registra um padrão para `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

O plugin Google incluído também registra um padrão para `google-gemini-cli`:

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

Observações sobre a saída da Gemini CLI:

- O parser `stream-json` padrão lê eventos `message` do assistente, eventos de ferramenta,
  uso final de `result` e eventos fatais de erro do Gemini.
- Se você substituir os argumentos do Gemini para `--output-format json`, o OpenClaw normaliza esse
  backend de volta para `output: "json"` e lê o texto da resposta do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua somente se necessário (comum: caminho absoluto de `command`).

## Padrões pertencentes ao plugin

Os padrões de backend de CLI agora fazem parte da superfície do plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend permanece pertencente ao plugin por meio do hook opcional
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
reescreve os deltas transmitidos do assistente e o texto final analisado antes que o OpenClaw processe
seus próprios marcadores de controle e a entrega ao canal.

Para CLIs que emitem eventos JSONL específicos do provedor, defina `jsonlDialect` na configuração
desse backend. Os dialetos compatíveis são `claude-stream-json` para fluxos compatíveis com Claude
Code e `gemini-stream-json` para eventos `stream-json` da Gemini CLI.

## Propriedade da Compaction nativa

Alguns backends de CLI executam um agente que compacta seu **próprio** transcrito, então o OpenClaw não deve
executar seu sumarizador de salvaguarda contra eles - fazer isso entra em conflito com a compaction do próprio backend
e pode fazer o turno falhar de forma definitiva.

`claude-cli` não tem endpoint de harness - o Claude Code compacta internamente - então ele declara
`ownsNativeCompaction: true`, e o OpenClaw retorna uma operação sem efeito do caminho de compaction.
Sessões de harness nativo, como Codex, continuam roteando para o endpoint de compaction do harness.

Como o backend é proprietário da compaction, a antiga solução paliativa de definir
`contextTokens: 1_000_000` apenas para impedir que a salvaguarda do OpenClaw fosse acionada em uma
sessão claude-cli **não é mais necessária** - a opção de exclusão a substitui.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Declare `ownsNativeCompaction` somente para um backend que realmente seja proprietário de sua compaction: ele
deve limitar de forma confiável seu próprio transcrito conforme se aproxima da janela de contexto e persistir uma
sessão retomável (por exemplo, `--resume` / `--session-id`); caso contrário, uma sessão adiada pode
permanecer acima do orçamento. Sessões `agentHarnessId` correspondentes ainda roteiam para o endpoint do harness.

## Sobreposições de bundle MCP

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
aderir a uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `google-gemini-cli`: arquivo de configurações de sistema do Gemini gerado

Quando bundle MCP está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP de loopback que expõe ferramentas do gateway ao processo da CLI
- autentica a ponte com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso a ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- mescla-os com qualquer formato existente de configuração/definições MCP do backend
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend adere a bundle MCP, para que execuções em segundo plano permaneçam isoladas.

Runtimes MCP incluídos com escopo de sessão são armazenados em cache para reutilização dentro de uma sessão e então
coletados após `mcp.sessionIdleTtlMs` milissegundos de tempo ocioso (padrão de 10
minutos; defina `0` para desabilitar). Execuções incorporadas únicas, como sondagens de autenticação,
geração de slug e Active Memory recall, solicitam limpeza no fim da execução para que filhos stdio
e fluxos Streamable HTTP/SSE não sobrevivam à execução.

## Limite de histórico de repropagação

Quando uma nova sessão de CLI é inicializada a partir de um transcrito anterior do OpenClaw (por
exemplo, depois de uma nova tentativa por `session_expired`), o bloco
`<conversation_history>` renderizado é limitado para impedir que prompts de repropagação
explodam. O padrão é `12288` caracteres (cerca de 3000 tokens).

Backends Claude CLI usam automaticamente um limite maior derivado da camada de contexto
Claude resolvida. Execuções Claude padrão de 200K tokens mantêm uma fatia maior do transcrito,
e execuções Claude de 1M tokens mantêm uma fatia ainda maior, enquanto outros backends de CLI
mantêm o padrão conservador.

- O limite governa apenas o bloco de histórico anterior do prompt de repropagação. Limites de
  saída de sessão ao vivo são ajustados separadamente em `reliability.outputLimits`
  (veja [Sessões](#sessions)).

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend de CLI. Backends só veem ferramentas do gateway quando aderem a
  `bundleMcp: true`.
- **Streaming é específico do backend.** Alguns backends transmitem JSONL; outros armazenam em buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: garanta que `sessionArg` esteja definido e que `sessionMode` não seja
  `none`.
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI aceita caminhos de arquivo).

## Relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
