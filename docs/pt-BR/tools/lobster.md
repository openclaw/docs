---
read_when:
    - Você quer fluxos de trabalho determinísticos de várias etapas com aprovações explícitas
    - Você precisa retomar um fluxo de trabalho sem executar novamente as etapas anteriores
summary: Ambiente de execução tipado de fluxos de trabalho para OpenClaw com etapas de aprovação retomáveis.
title: Lagosta
x-i18n:
    generated_at: "2026-05-07T13:25:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster é um shell de fluxo de trabalho que permite que o OpenClaw execute sequências de ferramentas com várias etapas como uma única operação determinística, com pontos de aprovação explícitos.

Lobster é uma camada de autoria acima do trabalho em segundo plano desanexado. Para orquestração de fluxo acima de tarefas individuais, consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`). Para o registro de atividades de tarefas, consulte [`openclaw tasks`](/pt-BR/automation/tasks).

## Gancho

Seu assistente pode criar as ferramentas que gerenciam a si próprio. Peça um fluxo de trabalho e, 30 minutos depois, você terá uma CLI com pipelines que rodam como uma única chamada. Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por quê

Hoje, fluxos de trabalho complexos exigem muitas chamadas de ferramenta de ida e volta. Cada chamada custa tokens, e o LLM precisa orquestrar cada etapa. Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de muitas**: o OpenClaw executa uma chamada de ferramenta Lobster e recebe um resultado estruturado.
- **Aprovações integradas**: efeitos colaterais (enviar e-mail, publicar comentário) interrompem o fluxo de trabalho até que sejam aprovados explicitamente.
- **Retomável**: fluxos de trabalho interrompidos retornam um token; aprove e retome sem executar tudo novamente.

## Por que uma DSL em vez de programas comuns?

Lobster é intencionalmente pequeno. O objetivo não é "uma nova linguagem", é uma especificação de pipeline previsível e amigável para IA, com aprovações de primeira classe e tokens de retomada.

- **Aprovar/retomar é integrado**: um programa normal pode solicitar uma ação humana, mas não consegue _pausar e retomar_ com um token durável sem que você crie esse runtime por conta própria.
- **Determinismo + auditabilidade**: pipelines são dados, portanto são fáceis de registrar, comparar, repetir e revisar.
- **Superfície restrita para IA**: uma gramática minúscula + encadeamento JSON reduzem caminhos de código "criativos" e tornam a validação realista.
- **Política de segurança embutida**: timeouts, limites de saída, verificações de sandbox e allowlists são impostos pelo runtime, não por cada script.
- **Ainda programável**: cada etapa pode chamar qualquer CLI ou script. Se você quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenClaw executa fluxos de trabalho Lobster **no processo** usando um executor embutido. Nenhum subprocesso de CLI externo é iniciado; o mecanismo de fluxo de trabalho executa dentro do processo do gateway e retorna um envelope JSON diretamente.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: CLI pequeno + pipes JSON + aprovações

Crie comandos pequenos que falam JSON e depois encadeie-os em uma única chamada Lobster. (Nomes de comandos de exemplo abaixo - substitua pelos seus.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Se o pipeline solicitar aprovação, retome com o token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

A IA aciona o fluxo de trabalho; Lobster executa as etapas. Portões de aprovação mantêm os efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada para chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas de LLM somente JSON (llm-task)

Para fluxos de trabalho que precisam de uma **etapa estruturada de LLM**, habilite a ferramenta de plugin opcional
`llm-task` e chame-a a partir do Lobster. Isso mantém o fluxo de trabalho
determinístico, ainda permitindo classificar/resumir/rascunhar com um modelo.

Habilite a ferramenta:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### Limitação importante: Lobster embutido vs `openclaw.invoke`

O plugin Lobster incluído executa fluxos de trabalho **no processo** dentro do gateway. Nesse modo embutido, `openclaw.invoke` **não** herda automaticamente uma URL/contexto de autenticação do gateway para chamadas de ferramenta aninhadas da CLI do OpenClaw.

Isso significa que este padrão **não é confiável atualmente no executor embutido**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Use o exemplo abaixo somente ao executar a **CLI Lobster independente** em um ambiente em que `openclaw.invoke` já esteja configurado com o contexto correto de gateway/autenticação.

Use-o em um pipeline da CLI Lobster independente:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Se você estiver usando o plugin Lobster embutido hoje, prefira:

- uma chamada direta à ferramenta `llm-task` fora do Lobster, ou
- etapas sem `openclaw.invoke` dentro do pipeline Lobster até que uma ponte embutida compatível seja adicionada.

Consulte [Tarefa de LLM](/pt-BR/tools/llm-task) para detalhes e opções de configuração.

## Arquivos de fluxo de trabalho (.lobster)

Lobster pode executar arquivos de fluxo de trabalho YAML/JSON com os campos `name`, `args`, `steps`, `env`, `condition` e `approval`. Em chamadas de ferramenta do OpenClaw, defina `pipeline` como o caminho do arquivo.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Observações:

- `stdin: $step.stdout` e `stdin: $step.json` passam a saída de uma etapa anterior.
- `condition` (ou `when`) pode condicionar etapas a `$step.approved`.

## Instalar o Lobster

Fluxos de trabalho Lobster incluídos são executados no processo; nenhum binário `lobster` separado é necessário. O executor embutido vem com o plugin Lobster.

Se você precisar da CLI Lobster independente para desenvolvimento ou pipelines externos, instale-a a partir do [repositório Lobster](https://github.com/openclaw/lobster) e garanta que `lobster` esteja no `PATH`.

## Habilitar a ferramenta

Lobster é uma ferramenta de plugin **opcional** (não habilitada por padrão).

Recomendado (aditivo, seguro):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Ou por agente:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Evite usar `tools.allow: ["lobster"]` a menos que você pretenda executar em modo de allowlist restritivo.

<Note>
Allowlists são opcionais para plugins opcionais. `alsoAllow` habilita apenas as ferramentas de plugin opcionais nomeadas, preservando o conjunto normal de ferramentas principais. Para restringir ferramentas principais, use `tools.allow` com as ferramentas ou grupos principais desejados.
</Note>

## Exemplo: triagem de e-mail

Sem Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Com Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Retorna um envelope JSON (truncado):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

O usuário aprova → retomar:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Um fluxo de trabalho. Determinístico. Seguro.

## Parâmetros da ferramenta

### `run`

Executar um pipeline em modo de ferramenta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Executar um arquivo de fluxo de trabalho com argumentos:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continuar um fluxo de trabalho interrompido após aprovação.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionais

- `cwd`: diretório de trabalho relativo para o pipeline (deve permanecer dentro do diretório de trabalho do gateway).
- `timeoutMs`: aborta o fluxo de trabalho se ele exceder essa duração (padrão: 20000).
- `maxStdoutBytes`: aborta o fluxo de trabalho se a saída exceder esse tamanho (padrão: 512000).
- `argsJson`: string JSON passada para `lobster run --args-json` (somente arquivos de fluxo de trabalho).

## Envelope de saída

Lobster retorna um envelope JSON com um de três status:

- `ok` → concluído com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é necessário para retomar
- `cancelled` → negado ou cancelado explicitamente

A ferramenta expõe o envelope tanto em `content` (JSON formatado) quanto em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retomar e continuar os efeitos colaterais
- `approve: false` → cancelar e finalizar o fluxo de trabalho

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON a solicitações de aprovação sem cola customizada com jq/heredoc. Tokens de retomada agora são compactos: Lobster armazena o estado de retomada do fluxo de trabalho em seu diretório de estado e devolve uma pequena chave de token.

## OpenProse

OpenProse combina bem com Lobster: use `/prose` para orquestrar a preparação multiagente e depois execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar do Lobster, permita a ferramenta `lobster` para subagentes via `tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Somente local no processo** - fluxos de trabalho executam dentro do processo do gateway; sem chamadas de rede a partir do próprio plugin.
- **Sem segredos** - Lobster não gerencia OAuth; ele chama ferramentas OpenClaw que fazem isso.
- **Ciente de sandbox** - desabilitado quando o contexto da ferramenta está em sandbox.
- **Endurecido** - timeouts e limites de saída impostos pelo executor embutido.

## Solução de problemas

- **`lobster timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline execute em modo de ferramenta e imprima somente JSON.
- **`lobster failed`** → verifique os logs do gateway para obter detalhes do erro do executor embutido.

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Autoria de ferramenta de plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: fluxos de trabalho da comunidade

Um exemplo público: uma CLI de "segundo cérebro" + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de caixa de entrada e varreduras de itens obsoletos; Lobster encadeia esses comandos em fluxos de trabalho como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com portões de aprovação. A IA lida com julgamento (categorização) quando disponível e recorre a regras determinísticas quando não.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionados

- [Automação e tarefas](/pt-BR/automation) - agendamento de fluxos de trabalho Lobster
- [Visão geral da automação](/pt-BR/automation) - todos os mecanismos de automação
- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
