---
read_when:
    - Você quer fluxos de trabalho de várias etapas determinísticos com aprovações explícitas
    - Você precisa retomar um fluxo de trabalho sem executar novamente as etapas anteriores
summary: Runtime tipado de fluxo de trabalho para OpenClaw com pontos de aprovação retomáveis.
title: Lagosta
x-i18n:
    generated_at: "2026-05-06T09:16:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster é um shell de workflow que permite ao OpenClaw executar sequências de ferramentas em várias etapas como uma única operação determinística, com pontos de verificação de aprovação explícitos.

Lobster é uma camada de autoria acima do trabalho em segundo plano desacoplado. Para orquestração de fluxos acima de tarefas individuais, consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`). Para o registro de atividade de tarefas, consulte [`openclaw tasks`](/pt-BR/automation/tasks).

## Gancho

Seu assistente pode criar as ferramentas que gerenciam ele mesmo. Peça um workflow e, 30 minutos depois, você terá uma CLI mais pipelines que rodam como uma única chamada. Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por quê

Hoje, workflows complexos exigem muitas chamadas de ferramenta de ida e volta. Cada chamada custa tokens, e o LLM precisa orquestrar cada etapa. Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de muitas**: OpenClaw executa uma chamada de ferramenta Lobster e obtém um resultado estruturado.
- **Aprovações integradas**: Efeitos colaterais (enviar e-mail, publicar comentário) pausam o workflow até serem explicitamente aprovados.
- **Retomável**: Workflows pausados retornam um token; aprove e retome sem reexecutar tudo.

## Por que uma DSL em vez de programas simples?

Lobster é intencionalmente pequeno. O objetivo não é "uma nova linguagem", é uma especificação de pipeline previsível e amigável para IA, com aprovações e tokens de retomada de primeira classe.

- **Aprovar/retomar é integrado**: Um programa normal pode pedir confirmação a uma pessoa, mas não consegue _pausar e retomar_ com um token durável sem que você mesmo crie esse runtime.
- **Determinismo + auditabilidade**: Pipelines são dados, então são fáceis de registrar, comparar, reproduzir e revisar.
- **Superfície restrita para IA**: Uma gramática pequena + encadeamento JSON reduz caminhos de código "criativos" e torna a validação realista.
- **Política de segurança incorporada**: Timeouts, limites de saída, verificações de sandbox e listas de permissões são aplicados pelo runtime, não por cada script.
- **Ainda programável**: Cada etapa pode chamar qualquer CLI ou script. Se quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

OpenClaw executa workflows Lobster **no processo** usando um executor embutido. Nenhum subprocesso de CLI externo é iniciado; o mecanismo de workflow executa dentro do processo do Gateway e retorna um envelope JSON diretamente.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie comandos pequenos que falam JSON e depois encadeie-os em uma única chamada Lobster. (Nomes de comando de exemplo abaixo - troque pelos seus.)

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

A IA aciona o workflow; Lobster executa as etapas. Portões de aprovação mantêm os efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada para chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas LLM somente JSON (llm-task)

Para workflows que precisam de uma **etapa LLM estruturada**, habilite a ferramenta de plugin opcional
`llm-task` e chame-a a partir do Lobster. Isso mantém o workflow
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

Use-a em um pipeline:

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

Consulte [Tarefa LLM](/pt-BR/tools/llm-task) para detalhes e opções de configuração.

## Arquivos de workflow (.lobster)

Lobster pode executar arquivos de workflow YAML/JSON com campos `name`, `args`, `steps`, `env`, `condition` e `approval`. Em chamadas de ferramenta do OpenClaw, defina `pipeline` como o caminho do arquivo.

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
- `condition` (ou `when`) pode condicionar etapas com base em `$step.approved`.

## Instalar Lobster

Workflows Lobster incluídos executam no processo; nenhum binário `lobster` separado é necessário. O executor embutido é distribuído com o plugin Lobster.

Se você precisar da CLI Lobster independente para desenvolvimento ou pipelines externos, instale-a pelo [repositório do Lobster](https://github.com/openclaw/lobster) e garanta que `lobster` esteja no `PATH`.

## Habilitar a ferramenta

Lobster é uma ferramenta de Plugin **opcional** (não habilitada por padrão).

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

Evite usar `tools.allow: ["lobster"]`, a menos que pretenda executar em modo restritivo de lista de permissões.

<Note>
Listas de permissões são opt-in para plugins opcionais. `alsoAllow` habilita apenas as ferramentas de plugin opcionais nomeadas, preservando o conjunto normal de ferramentas principais. Para restringir ferramentas principais, use `tools.allow` com as ferramentas ou grupos principais que você quer.
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

Um workflow. Determinístico. Seguro.

## Parâmetros da ferramenta

### `run`

Execute um pipeline em modo de ferramenta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Execute um arquivo de workflow com argumentos:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continue um workflow pausado após aprovação.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionais

- `cwd`: Diretório de trabalho relativo para o pipeline (deve permanecer dentro do diretório de trabalho do gateway).
- `timeoutMs`: Aborta o workflow se ele exceder esta duração (padrão: 20000).
- `maxStdoutBytes`: Aborta o workflow se a saída exceder este tamanho (padrão: 512000).
- `argsJson`: String JSON passada para `lobster run --args-json` (somente arquivos de workflow).

## Envelope de saída

Lobster retorna um envelope JSON com um de três status:

- `ok` → finalizado com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é obrigatório para retomar
- `cancelled` → explicitamente negado ou cancelado

A ferramenta expõe o envelope tanto em `content` (JSON formatado) quanto em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retomar e continuar os efeitos colaterais
- `approve: false` → cancelar e finalizar o workflow

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON a solicitações de aprovação sem cola personalizada de jq/heredoc. Tokens de retomada agora são compactos: Lobster armazena o estado de retomada do workflow em seu diretório de estado e retorna uma pequena chave de token.

## OpenProse

OpenProse combina bem com Lobster: use `/prose` para orquestrar preparação multiagente e depois execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar do Lobster, permita a ferramenta `lobster` para subagentes via `tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Somente local no processo** - workflows executam dentro do processo do Gateway; sem chamadas de rede pelo próprio plugin.
- **Sem segredos** - Lobster não gerencia OAuth; ele chama ferramentas do OpenClaw que fazem isso.
- **Ciente de sandbox** - desabilitado quando o contexto da ferramenta está em sandbox.
- **Robusto** - timeouts e limites de saída aplicados pelo executor embutido.

## Solução de problemas

- **`lobster timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline execute em modo de ferramenta e imprima somente JSON.
- **`lobster failed`** → verifique os logs do Gateway para detalhes do erro do executor embutido.

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Autoria de ferramentas de Plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: workflows da comunidade

Um exemplo público: uma CLI de "segundo cérebro" + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de caixa de entrada e varreduras de itens obsoletos; Lobster encadeia esses comandos em workflows como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com portões de aprovação. A IA lida com julgamento (categorização) quando disponível e recorre a regras determinísticas quando não.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automação e tarefas](/pt-BR/automation) - agendamento de workflows Lobster
- [Visão geral de automação](/pt-BR/automation) - todos os mecanismos de automação
- [Visão geral de ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
