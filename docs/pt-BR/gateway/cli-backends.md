---
read_when:
    - Você quer um fallback confiável quando provedores de API falham
    - Você está executando Codex CLI ou outras CLIs locais de IA e quer reutilizá-las
    - Você quer entender a bridge local loopback de MCP para acesso a ferramentas do backend da CLI
summary: 'Backends da CLI: fallback de CLI local de IA com bridge opcional de ferramenta MCP'
title: Backends da CLI
x-i18n:
    generated_at: "2026-04-24T05:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends da CLI (runtime de fallback)

O OpenClaw pode executar **CLIs locais de IA** como um **fallback somente de texto** quando provedores de API estão fora do ar,
limitados por taxa ou temporariamente instáveis. Isso é intencionalmente conservador:

- **Ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do gateway por meio de uma bridge MCP local loopback.
- **Streaming JSONL** para CLIs que oferecem suporte.
- **Sessões são compatíveis** (assim, turnos seguintes permanecem coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho primário. Use quando quiser
respostas de texto “sempre funcionam” sem depender de APIs externas.

Se você quiser um runtime completo com controles de sessão ACP, tarefas em segundo plano,
binding de tópico/conversa e sessões externas persistentes de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends da CLI não são ACP.

## Início rápido amigável para iniciantes

Você pode usar Codex CLI **sem nenhuma configuração** (o Plugin OpenAI incluído
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

É só isso. Sem chaves, sem configuração extra de autenticação além da própria CLI.

Se você usar um backend de CLI incluído como **provedor primário de mensagens** em um
host de gateway, o OpenClaw agora carrega automaticamente o Plugin incluído proprietário quando sua configuração
faz referência explícita a esse backend em uma referência de modelo ou em
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

- Se você usar `agents.defaults.models` (allowlist), também deverá incluir ali os modelos do seu backend de CLI.
- Se o provedor primário falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é identificada por um **ID de provedor** (por exemplo, `codex-cli`, `my-cli`).
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
2. **Constrói um prompt de sistema** usando o mesmo prompt + contexto de workspace do OpenClaw.
3. **Executa a CLI** com um ID de sessão (se compatível) para que o histórico permaneça consistente.
   O backend incluído `claude-cli` mantém um processo stdio do Claude ativo por
   sessão do OpenClaw e envia turnos seguintes por stdin em stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste IDs de sessão** por backend, para que turnos seguintes reutilizem a mesma sessão da CLI.

<Note>
O backend incluído Anthropic `claude-cli` voltou a ser compatível. A equipe da Anthropic
nos informou que o uso do Claude CLI no estilo OpenClaw é permitido novamente, então o OpenClaw trata o uso de
`claude -p` como autorizado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend incluído OpenAI `codex-cli` passa o prompt de sistema do OpenClaw por
meio da substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude como
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada sessão nova do Codex CLI.

O backend incluído Anthropic `claude-cli` recebe o snapshot de Skills do OpenClaw
de duas formas: o catálogo compacto de Skills do OpenClaw no prompt de sistema anexado e
um Plugin Claude Code temporário passado com `--plugin-dir`. O Plugin contém
apenas as Skills elegíveis para aquele agente/sessão, então o resolvedor nativo de Skills do Claude Code vê o mesmo conjunto filtrado que o OpenClaw anunciaria no prompt. Substituições de env/chave de API para Skills ainda são aplicadas pelo OpenClaw ao ambiente do processo filho durante a execução.

O Claude CLI também tem seu próprio modo de permissão não interativo. O OpenClaw o mapeia
para a política de exec existente em vez de adicionar configuração específica do Claude: quando a política efetiva solicitada de exec é YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), o OpenClaw adiciona `--permission-mode bypassPermissions`.
Configurações por agente em `agents.list[].tools.exec` substituem `tools.exec` global para
esse agente. Para forçar um modo diferente do Claude, defina argumentos brutos explícitos do backend,
como `--permission-mode default` ou `--permission-mode acceptEdits` em
`agents.defaults.cliBackends.claude-cli.args` e `resumeArgs` correspondentes.

Antes que o OpenClaw possa usar o backend incluído `claude-cli`, o próprio Claude Code
já deve estar autenticado no mesmo host:

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
- Se a CLI usar um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre enviar um ID de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: enviar um ID de sessão somente se já houver um armazenado.
  - `none`: nunca enviar um ID de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"`
  e `input: "stdin"`, para que turnos seguintes reutilizem o processo Claude ativo enquanto
  ele estiver em execução. stdio aquecido agora é o padrão, inclusive para configurações personalizadas
  que omitem campos de transporte. Se o Gateway reiniciar ou o processo ocioso
  encerrar, o OpenClaw retoma a partir do ID de sessão Claude armazenado. IDs de sessão armazenados são verificados em relação a uma transcrição de projeto existente e legível antes
  da retomada, de modo que bindings fantasmas são limpos com `reason=transcript-missing`
  em vez de iniciar silenciosamente uma nova sessão do Claude CLI com `--resume`.
- Sessões CLI armazenadas são continuidade pertencente ao provedor. A redefinição diária implícita de sessão
  não as encerra; `/reset` e políticas explícitas de `session.reset` ainda encerram.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma faixa em ordem.
- A maioria das CLIs serializa em uma faixa de provedor.
- O OpenClaw descarta a reutilização de sessão CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo mudança no ID do perfil de autenticação, chave de API estática, token estático ou identidade de conta OAuth quando a CLI expõe uma. A rotação de tokens de acesso e refresh OAuth não encerra a sessão CLI armazenada. Se uma CLI não expuser um
  ID estável de conta OAuth, o OpenClaw permite que essa CLI imponha permissões de retomada.

## Imagens (repasse)

Se sua CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como args da CLI. Se `imageArg` estiver ausente, o OpenClaw anexa os
caminhos dos arquivos ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam
automaticamente arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + ID de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  uso de `stats` quando `usage` estiver ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo Codex CLI `--json`) e extrai a mensagem final do agente mais identificadores de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último arg da CLI.
- `input: "stdin"` envia o prompt por stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (pertencentes ao Plugin)

O Plugin incluído OpenAI também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O Plugin incluído Google também registra um padrão para `google-gemini-cli`:

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
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho absoluto de `command`).

## Padrões pertencentes ao Plugin

Os padrões de backend de CLI agora fazem parte da superfície do Plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor em referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do Plugin.
- A limpeza de configuração específica do backend permanece pertencente ao Plugin por meio do hook opcional
  `normalizeConfig`.

Plugins que precisam de pequenos shims de compatibilidade de prompt/mensagem podem declarar
transformações bidirecionais de texto sem substituir um provedor nem um backend de CLI:

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

`input` reescreve o prompt de sistema e o prompt do usuário passados à CLI. `output`
reescreve deltas transmitidos do assistente e o texto final analisado antes que o OpenClaw trate
seus próprios marcadores de controle e a entrega ao canal.

Para CLIs que emitem JSONL compatível com stream-json do Claude Code, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Sobreposições MCP de pacote

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`; o servidor local loopback gerado do
  OpenClaw é marcado com o modo de aprovação de ferramenta por servidor do Codex,
  para que chamadas MCP não travem em prompts locais de aprovação
- `google-gemini-cli`: arquivo gerado de configurações de sistema do Gemini

Quando o bundle MCP está ativado, o OpenClaw:

- inicia um servidor MCP HTTP local loopback que expõe ferramentas do gateway ao processo da CLI
- autentica a bridge com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas ao contexto atual de sessão, conta e canal
- carrega servidores bundle-MCP ativados para o workspace atual
- os mescla com qualquer formato existente de configuração/settings MCP do backend
- reescreve a configuração de inicialização usando o modo de integração pertencente ao backend da extensão proprietária

Se nenhum servidor MCP estiver ativado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta por bundle MCP, para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend da CLI. Backends só veem ferramentas do gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends fazem streaming em JSONL; outros armazenam em buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões do Codex CLI** retomam por saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: verifique se `sessionArg` está definido e se `sessionMode` não é
  `none` (o Codex CLI atualmente não pode retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI oferece suporte a caminhos de arquivo).

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Modelos locais](/pt-BR/gateway/local-models)
