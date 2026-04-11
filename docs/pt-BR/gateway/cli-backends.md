---
read_when:
    - Você quer um fallback confiável quando os provedores de API falham
    - Você está executando a CLI do Codex ou outras CLIs de IA locais e quer reutilizá-las
    - Você quer entender a bridge de loopback MCP para acesso a ferramentas do backend da CLI
summary: 'Backends da CLI: fallback local da CLI de IA com bridge de ferramenta MCP opcional'
title: Backends da CLI
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d108dbea043c260a80d15497639298f71a6b4d800f68d7b39bc129f7667ca608
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends da CLI (runtime de fallback)

O OpenClaw pode executar **CLIs de IA locais** como um **fallback somente de texto** quando os provedores de API estão indisponíveis,
com limite de taxa ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do gateway por meio de uma bridge MCP de loopback.
- **Streaming JSONL** para CLIs que oferecem suporte.
- **Sessões são compatíveis** (assim os turnos seguintes permanecem coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho principal. Use quando você
quiser respostas de texto que “sempre funcionam” sem depender de APIs externas.

Se você quiser um runtime completo de harness com controles de sessão ACP, tarefas em segundo plano,
vinculação a thread/conversa e sessões externas persistentes de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents) em vez disso. Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar a CLI do Codex **sem nenhuma configuração** (o plugin OpenAI empacotado
registra um backend padrão):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se o seu gateway roda em launchd/systemd e o PATH é mínimo, adicione apenas o
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

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação é necessária além da própria CLI.

Se você usar um backend de CLI empacotado como **provedor primário de mensagens** em um
host de gateway, o OpenClaw agora carrega automaticamente o plugin empacotado proprietário quando sua configuração
faz referência explicitamente a esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Como usar como fallback

Adicione um backend de CLI à sua lista de fallbacks para que ele só seja executado quando os modelos primários falharem:

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

- Se você usar `agents.defaults.models` (lista de permissões), também precisará incluir seus modelos de backend de CLI ali.
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
2. **Monta um prompt de sistema** usando o mesmo prompt + contexto de workspace do OpenClaw.
3. **Executa a CLI** com um id de sessão (se houver suporte) para que o histórico permaneça consistente.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão da CLI.

<Note>
O backend empacotado `claude-cli` da Anthropic voltou a ter suporte. A equipe da Anthropic
nos informou que o uso da Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como autorizado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend empacotado `codex-cli` da OpenAI repassa o prompt de sistema do OpenClaw por meio da
substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude como
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada nova sessão da CLI do Codex.

O backend empacotado `claude-cli` da Anthropic recebe o snapshot de Skills do OpenClaw
de duas formas: o catálogo compacto de Skills do OpenClaw no prompt de sistema anexado e
um plugin temporário do Claude Code passado com `--plugin-dir`. O plugin contém
somente as Skills elegíveis para aquele agente/sessão, então o resolvedor nativo de Skills do Claude Code
vê o mesmo conjunto filtrado que o OpenClaw anunciaria no prompt.
Substituições de env/chave de API de Skill ainda são aplicadas pelo OpenClaw ao ambiente do processo filho para a execução.

## Sessões

- Se a CLI oferece suporte a sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se a CLI usa um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e, opcionalmente, `resumeOutput`
  (para retomadas que não usam JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: só envia um id de sessão se um já tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.

Observações sobre serialização:

- `serialize: true` mantém as execuções da mesma faixa em ordem.
- A maioria das CLIs serializa em uma faixa de provedor.
- O OpenClaw descarta a reutilização da sessão de CLI armazenada quando o estado de autenticação do backend muda, incluindo novo login, rotação de token ou mudança de credencial do perfil de autenticação.

## Imagens (repasse)

Se sua CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens em base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como args da CLI. Se `imageArg` estiver ausente, o OpenClaw acrescenta os
caminhos dos arquivos ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam
arquivos locais automaticamente a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para a saída JSON da CLI do Gemini, o OpenClaw lê o texto da resposta de `response` e
  o uso de `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente mais
  identificadores de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último arg da CLI.
- `input: "stdin"` envia o prompt por stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (de propriedade do plugin)

O plugin OpenAI empacotado também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O plugin Google empacotado também registra um padrão para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: a CLI local do Gemini precisa estar instalada e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre o JSON da CLI do Gemini:

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` no OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho `command` absoluto).

## Padrões de propriedade do plugin

Os padrões de backend de CLI agora fazem parte da superfície do plugin:

- Os plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor em referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend continua sendo de propriedade do plugin por meio do hook opcional
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

`input` reescreve o prompt de sistema e o prompt do usuário passados à CLI. `output`
reescreve deltas transmitidos do assistente e o texto final analisado antes que o OpenClaw processe
seus próprios marcadores de controle e a entrega ao canal.

Para CLIs que emitem JSONL compatível com stream-json do Claude Code, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Overlays MCP empacotados

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento empacotado atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`
- `google-gemini-cli`: arquivo de configurações de sistema do Gemini gerado

Quando o MCP empacotado está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP de loopback que expõe ferramentas do gateway ao processo da CLI
- autentica a bridge com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- os mescla com qualquer forma existente de configuração/ajustes MCP do backend
- reescreve a configuração de inicialização usando o modo de integração de propriedade do backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend opta por MCP empacotado para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend da CLI. Os backends só veem ferramentas do gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends fazem streaming em JSONL; outros fazem buffer
  até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões da CLI do Codex** retomam por saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: garanta que `sessionArg` esteja definido e que `sessionMode` não seja
  `none` (a CLI do Codex atualmente não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI oferece suporte a caminhos de arquivo).
