---
read_when:
    - Você quer um fallback confiável quando provedores de API falham
    - Você está executando o Codex CLI ou outras CLIs locais de IA e quer reutilizá-las
    - Você quer entender a bridge MCP loopback para acesso a ferramentas do backend de CLI
summary: 'Backends de CLI: fallback de CLI local de IA com bridge opcional de ferramenta MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-23T14:02:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de fallback)

O OpenClaw pode executar **CLIs locais de IA** como um **fallback somente de texto** quando provedores de API estão fora do ar,
com rate limit ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do Gateway por meio de uma bridge MCP loopback.
- **Streaming JSONL** para CLIs que o suportam.
- **Sessões são compatíveis** (para que turnos de continuação permaneçam coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho principal. Use quando você
quiser respostas de texto “sempre funcionam” sem depender de APIs externas.

Se você quiser um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar o Codex CLI **sem nenhuma configuração** (o plugin OpenAI integrado
registra um backend padrão):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
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

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação além da própria CLI.

Se você usar um backend de CLI integrado como **provedor principal de mensagens** em um
host de Gateway, o OpenClaw agora carrega automaticamente o plugin integrado responsável quando sua configuração
faz referência explícita a esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele só rode quando os modelos primários falharem:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Observações:

- Se você usar `agents.defaults.models` (lista de permissões), também deverá incluir ali os modelos do backend de CLI.
- Se o provedor primário falhar (autenticação, rate limits, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **id de provedor** (por exemplo `codex-cli`, `my-cli`).
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
          // CLIs no estilo Codex podem apontar para um arquivo de prompt:
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
2. **Monta um prompt de sistema** usando o mesmo prompt + contexto de espaço de trabalho do OpenClaw.
3. **Executa a CLI** com um id de sessão (se compatível) para que o histórico permaneça consistente.
   O backend integrado `claude-cli` mantém um processo stdio do Claude vivo por
   sessão OpenClaw e envia turnos de continuação pelo stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que continuações reutilizem a mesma sessão da CLI.

<Note>
O backend integrado Anthropic `claude-cli` voltou a ser compatível. A equipe da Anthropic
nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como autorizado para essa integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend integrado OpenAI `codex-cli` passa o prompt de sistema do OpenClaw via
substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada nova sessão do Codex CLI.

O backend integrado Anthropic `claude-cli` recebe o snapshot de Skills do OpenClaw
de duas formas: o catálogo compacto de Skills do OpenClaw no prompt de sistema anexado e
um plugin temporário do Claude Code passado com `--plugin-dir`. O plugin contém
apenas as Skills elegíveis para aquele agent/sessão, de modo que o resolvedor nativo de Skills do Claude Code
vê o mesmo conjunto filtrado que o OpenClaw anunciaria no prompt. Substituições de env/chave de API
de Skill ainda são aplicadas pelo OpenClaw ao ambiente do processo filho durante a execução.

## Sessões

- Se a CLI for compatível com sessões, defina `sessionArg` (por exemplo `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se a CLI usar um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: envia um id de sessão somente se um já tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.
- `claude-cli` usa como padrão `liveSession: "claude-stdio"`, `output: "jsonl"`
  e `input: "stdin"` para que turnos de continuação reutilizem o processo Claude ativo enquanto
  ele estiver ativo. stdio aquecido agora é o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  encerrar, o OpenClaw retoma a partir do id de sessão Claude armazenado. Ids de sessão
  armazenados são verificados em relação a uma transcrição de projeto existente e legível antes da
  retomada, de modo que vinculações fantasmas são limpas com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão do Claude CLI sob `--resume`.
- Sessões de CLI armazenadas são continuidade controlada pelo provedor. A redefinição implícita
  diária de sessão não as interrompe; `/reset` e políticas explícitas de `session.reset` ainda interrompem.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma lane em ordem.
- A maioria das CLIs serializa em uma lane de provedor.
- O OpenClaw abandona a reutilização da sessão de CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo mudança de id de perfil de autenticação, chave de API estática, token estático ou identidade
  de conta OAuth quando a CLI a expõe. Rotação de token de acesso e refresh OAuth
  não interrompe a sessão de CLI armazenada. Se uma CLI não expõe um id de conta OAuth estável,
  o OpenClaw deixa essa CLI impor permissões de retomada.

## Imagens (pass-through)

Se a sua CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como argumentos da CLI. Se `imageArg` estiver ausente, o OpenClaw acrescenta os
caminhos dos arquivos ao prompt (injeção de caminho), o que basta para CLIs que carregam
arquivos locais automaticamente a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON da Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  o uso de `stats` quando `usage` estiver ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo Codex CLI `--json`) e extrai a mensagem final do agent mais identificadores de sessão
  quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (controlados por plugin)

O plugin OpenAI integrado também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O plugin Google integrado também registra um padrão para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: a Gemini CLI local deve estar instalada e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre JSON da Gemini CLI:

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` estiver ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho `command` absoluto).

## Padrões controlados por plugin

Os padrões de backend de CLI agora fazem parte da superfície de plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor em referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend continua sendo responsabilidade do plugin por meio do hook opcional
  `normalizeConfig`.

Plugins que precisam de pequenos shims de compatibilidade de prompt/mensagem podem declarar
transformações bidirecionais de texto sem substituir um provedor ou backend de CLI:

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
reescreve deltas em streaming do assistente e o texto final analisado antes que o OpenClaw trate seus
próprios marcadores de controle e a entrega por canal.

Para CLIs que emitem JSONL compatível com stream-json do Claude Code, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Overlays MCP de bundle

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por um overlay de configuração MCP gerado com `bundleMcp: true`.

Comportamento integrado atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`
- `google-gemini-cli`: arquivo gerado de configurações de sistema do Gemini

Quando o bundle MCP está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP loopback que expõe ferramentas do Gateway ao processo da CLI
- autentica a bridge com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas ao contexto atual de sessão, conta e canal
- carrega os servidores MCP de bundle habilitados para o espaço de trabalho atual
- os mescla com qualquer formato existente de configuração/settings MCP do backend
- reescreve a configuração de inicialização usando o modo de integração controlado pelo backend da extensão responsável

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta por bundle MCP para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramentas do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend de CLI. Backends só veem ferramentas do Gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends fazem streaming em JSONL; outros fazem buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões do Codex CLI** são retomadas via saída em texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: confirme que `sessionArg` está definido e que `sessionMode` não é
  `none` (o Codex CLI atualmente não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e confirme que a CLI oferece suporte a caminhos de arquivo).
