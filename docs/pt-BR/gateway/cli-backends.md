---
read_when:
    - Você quer um fallback confiável quando provedores de API falham
    - Você está executando o Codex CLI ou outros CLIs locais de IA e quer reutilizá-los
    - Você quer entender a bridge de loopback MCP para acesso a ferramentas em backend de CLI
summary: 'Backends de CLI: fallback local de CLI de IA com bridge opcional de ferramentas MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-07T05:27:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f061357f420455ad6ffaabe7fe28f1fb1b1769d73a4eb2e6f45c6eb3c2e36667
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de fallback)

O OpenClaw pode executar **CLIs locais de IA** como um **fallback somente de texto** quando provedores de API estão fora do ar,
limitados por taxa ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do gateway por uma bridge MCP de loopback.
- **Streaming JSONL** para CLIs que oferecem suporte a isso.
- **Sessões são suportadas** (para que turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser repassadas** se o CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho principal. Use quando você
quiser respostas de texto do tipo “sempre funciona” sem depender de APIs externas.

Se você quiser um runtime de harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de programação, use
[ACP Agents](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido amigável para iniciantes

Você pode usar o Codex CLI **sem nenhuma configuração** (o plugin OpenAI incluído
registra um backend padrão):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se o seu gateway for executado sob launchd/systemd e o PATH for mínimo, adicione apenas o
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

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação além do próprio CLI.

Se você usar um backend de CLI incluído como o **provedor principal de mensagens** em um
host de gateway, o OpenClaw agora carrega automaticamente o plugin incluído proprietário quando sua configuração
faz referência explicitamente a esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele execute apenas quando os modelos principais falharem:

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

- Se você usar `agents.defaults.models` (allowlist), também deverá incluir ali os modelos do seu backend de CLI.
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
2. **Constrói um prompt de sistema** usando o mesmo prompt + contexto de workspace do OpenClaw.
3. **Executa o CLI** com um id de sessão (se suportado) para que o histórico permaneça consistente.
4. **Faz o parse da saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão do CLI.

<Note>
O backend `claude-cli` do Anthropic incluído é suportado novamente. A equipe do Anthropic
nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como autorizado para esta integração, a menos que o Anthropic publique
uma nova política.
</Note>

## Sessões

- Se o CLI oferecer suporte a sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em vários flags.
- Se o CLI usar um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas sem JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: envia um id de sessão apenas se um tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma faixa ordenadas.
- A maioria dos CLIs serializa em uma faixa de provedor.
- O OpenClaw descarta a reutilização da sessão de CLI armazenada quando o estado de autenticação do backend muda, incluindo novo login, rotação de token ou alteração da credencial do perfil de autenticação.

## Imagens (pass-through)

Se o seu CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens em base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como args do CLI. Se `imageArg` estiver ausente, o OpenClaw acrescenta os
caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam
automaticamente arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta fazer parse do JSON e extrair texto + id de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  o uso de `stats` quando `usage` estiver ausente ou vazio.
- `output: "jsonl"` faz o parse de streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente mais identificadores de sessão
  quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último arg do CLI.
- `input: "stdin"` envia o prompt por stdin.
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
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: o Gemini CLI local precisa estar instalado e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre JSON do Gemini CLI:

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado em `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada a partir de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (caso comum: caminho absoluto em `command`).

## Padrões de propriedade do plugin

Os padrões de backend de CLI agora fazem parte da superfície de plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend continua sendo de propriedade do plugin por meio do hook opcional
  `normalizeConfig`.

## Overlays bundle MCP

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por um overlay de configuração MCP gerado com `bundleMcp: true`.

Comportamento incluído atual:

- `codex-cli`: sem overlay bundle MCP
- `google-gemini-cli`: sem overlay bundle MCP

Quando bundle MCP está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP de loopback que expõe ferramentas do gateway ao processo do CLI
- autentica a bridge com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- os mescla com qualquer `--mcp-config` existente do backend
- reescreve os args do CLI para passar `--strict-mcp-config --mcp-config <generated-file>`

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta por bundle MCP, para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend de CLI. Os backends só veem ferramentas do gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends fazem streaming em JSONL; outros acumulam
  até a saída.
- **Saídas estruturadas** dependem do formato JSON do CLI.
- **Sessões do Codex CLI** retomam via saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrado**: defina `command` com um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo do CLI.
- **Sem continuidade de sessão**: verifique se `sessionArg` está definido e se `sessionMode` não é
  `none` (o Codex CLI atualmente não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e confirme que o CLI oferece suporte a caminhos de arquivo).
