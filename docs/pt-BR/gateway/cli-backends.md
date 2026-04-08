---
read_when:
    - Você quer um fallback confiável quando os provedores de API falham
    - Você está executando Codex CLI ou outros CLIs de IA locais e quer reutilizá-los
    - Você quer entender a ponte MCP de loopback para acesso a ferramentas em backends de CLI
summary: 'Backends de CLI: fallback de CLI de IA local com ponte de ferramenta MCP opcional'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-08T02:14:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0e8c41f5f5a8e34466f6b765e5c08585ef1788fa9e9d953257324bcc6cbc414
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de fallback)

O OpenClaw pode executar **CLIs de IA locais** como um **fallback somente de texto** quando os provedores de API estão fora do ar,
com limite de taxa, ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do gateway por meio de uma ponte MCP de loopback.
- **Streaming JSONL** para CLIs que o suportam.
- **Sessões são suportadas** (para que os turnos de continuação permaneçam coerentes).
- **Imagens podem ser repassadas** se o CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho principal. Use quando você
quiser respostas de texto que “sempre funcionam” sem depender de APIs externas.

Se você quiser um runtime harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de codificação, use
[ACP Agents](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar o Codex CLI **sem nenhuma configuração** (o plugin OpenAI incluído
registra um backend padrão):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se o seu gateway for executado em launchd/systemd e o PATH for mínimo, adicione apenas o
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

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação além da do próprio CLI.

Se você usar um backend de CLI incluído como o **provedor principal de mensagens** em um
host de gateway, o OpenClaw agora carrega automaticamente o plugin incluído proprietário quando sua configuração
faz referência explicitamente a esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele só seja executado quando os modelos principais falharem:

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

- Se você usar `agents.defaults.models` (lista de permissão), também deverá incluir ali os modelos do seu backend de CLI.
- Se o provedor principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw
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
2. **Monta um prompt de sistema** usando o mesmo prompt + contexto de workspace do OpenClaw.
3. **Executa o CLI** com um id de sessão (se suportado) para que o histórico permaneça consistente.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que turnos de continuação reutilizem a mesma sessão do CLI.

<Note>
O backend `claude-cli` incluído da Anthropic voltou a ser suportado. A equipe da Anthropic
nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata o uso de
`claude -p` como autorizado para essa integração, a menos que a Anthropic publique
uma nova política.
</Note>

## Sessões

- Se o CLI suportar sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se o CLI usar um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e, opcionalmente, `resumeOutput`
  (para retomadas que não usam JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: envia um id de sessão apenas se um tiver sido armazenado anteriormente.
  - `none`: nunca envia um id de sessão.

Observações sobre serialização:

- `serialize: true` mantém as execuções da mesma trilha em ordem.
- A maioria dos CLIs serializa em uma trilha de provedor.
- O OpenClaw descarta a reutilização de sessões de CLI armazenadas quando o estado de autenticação do backend muda, inclusive em novo login, rotação de token ou alteração da credencial do perfil de autenticação.

## Imagens (repasse)

Se o seu CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens em base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como argumentos do CLI. Se `imageArg` estiver ausente, o OpenClaw acrescentará os
caminhos dos arquivos ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam automaticamente
arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta em `response` e
  o uso em `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente, além de identificadores de sessão
  quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento do CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (de propriedade do plugin)

O plugin OpenAI incluído também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O plugin Google incluído também registra um padrão para `google-gemini-cli`:

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

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho `command` absoluto).

## Padrões de propriedade do plugin

Os padrões de backend de CLI agora fazem parte da superfície do plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend continua sendo de propriedade do plugin por meio do hook opcional
  `normalizeConfig`.

## Sobreposições de MCP incluídas

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`
- `google-gemini-cli`: arquivo de configurações de sistema do Gemini gerado

Quando o MCP incluído está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP de loopback que expõe ferramentas do gateway ao processo do CLI
- autentica a ponte com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- os mescla com qualquer formato existente de configuração/definições MCP do backend
- reescreve a configuração de inicialização usando o modo de integração de propriedade do backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta pelo MCP incluído para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend de CLI. Os backends só veem ferramentas do gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends fazem streaming em JSONL; outros armazenam em buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON do CLI.
- **As sessões do Codex CLI** são retomadas por saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrado**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo do CLI.
- **Sem continuidade de sessão**: verifique se `sessionArg` está definido e se `sessionMode` não é
  `none` (atualmente o Codex CLI não pode retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se o CLI suporta caminhos de arquivo).
