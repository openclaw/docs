---
read_when:
    - Você quer fluxos de trabalho determinísticos de várias etapas com aprovações explícitas
    - Você precisa retomar um fluxo de trabalho sem executar novamente as etapas anteriores
summary: Ambiente de execução de fluxo de trabalho tipado para o OpenClaw com controles de aprovação retomáveis.
title: Lagosta
x-i18n:
    generated_at: "2026-05-04T05:55:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

O Lobster é um shell de workflow que permite ao OpenClaw executar sequências de ferramentas em várias etapas como uma única operação determinística, com pontos de aprovação explícitos.

O Lobster é uma camada de autoria acima do trabalho em segundo plano desacoplado. Para orquestração de fluxos acima de tarefas individuais, consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`). Para o registro de atividades de tarefas, consulte [`openclaw tasks`](/pt-BR/automation/tasks).

## Hook

Seu assistente pode criar as ferramentas que gerenciam a si mesmo. Peça um workflow e, 30 minutos depois, você terá uma CLI com pipelines que rodam como uma única chamada. O Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por quê

Hoje, workflows complexos exigem muitas chamadas de ferramenta de ida e volta. Cada chamada custa tokens, e o LLM precisa orquestrar cada etapa. O Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de muitas**: o OpenClaw executa uma chamada de ferramenta Lobster e recebe um resultado estruturado.
- **Aprovações integradas**: efeitos colaterais (enviar email, publicar comentário) pausam o workflow até serem aprovados explicitamente.
- **Retomável**: workflows pausados retornam um token; aprove e retome sem executar tudo de novo.

## Por que uma DSL em vez de programas simples?

O Lobster é intencionalmente pequeno. O objetivo não é "uma nova linguagem", mas uma especificação de pipeline previsível e amigável para IA, com aprovações de primeira classe e tokens de retomada.

- **Aprovar/retomar é integrado**: um programa normal pode solicitar a intervenção de uma pessoa, mas não consegue _pausar e retomar_ com um token durável sem que você crie esse runtime por conta própria.
- **Determinismo + auditabilidade**: pipelines são dados, então são fáceis de registrar, comparar, reproduzir e revisar.
- **Superfície restrita para IA**: uma gramática pequena + passagem de JSON reduz caminhos de código “criativos” e torna a validação realista.
- **Política de segurança embutida**: timeouts, limites de saída, verificações de sandbox e listas de permissões são aplicados pelo runtime, não por cada script.
- **Ainda programável**: cada etapa pode chamar qualquer CLI ou script. Se quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenClaw executa workflows Lobster **no processo** usando um runner embutido. Nenhum subprocesso de CLI externo é iniciado; o mecanismo de workflow executa dentro do processo do gateway e retorna um envelope JSON diretamente.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie comandos pequenos que falem JSON e depois encadeie-os em uma única chamada Lobster. (Nomes de comandos de exemplo abaixo — substitua pelos seus.)

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

A IA aciona o workflow; o Lobster executa as etapas. Gates de aprovação mantêm efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada para chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas LLM somente em JSON (llm-task)

Para workflows que precisam de uma **etapa LLM estruturada**, habilite a ferramenta opcional de plugin `llm-task` e chame-a a partir do Lobster. Isso mantém o workflow determinístico e, ao mesmo tempo, permite classificar/resumir/rascunhar com um modelo.

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

Use em um pipeline:

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

Consulte [LLM Task](/pt-BR/tools/llm-task) para detalhes e opções de configuração.

## Arquivos de workflow (.lobster)

O Lobster pode executar arquivos de workflow YAML/JSON com campos `name`, `args`, `steps`, `env`, `condition` e `approval`. Em chamadas de ferramenta do OpenClaw, defina `pipeline` como o caminho do arquivo.

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

Workflows Lobster agrupados rodam no processo; nenhum binário `lobster` separado é necessário. O runner embutido é distribuído com o plugin Lobster.

Se você precisar da CLI standalone do Lobster para desenvolvimento ou pipelines externos, instale-a a partir do [repositório Lobster](https://github.com/openclaw/lobster) e garanta que `lobster` esteja no `PATH`.

## Habilitar a ferramenta

O Lobster é uma ferramenta de plugin **opcional** (não habilitada por padrão).

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

Evite usar `tools.allow: ["lobster"]` a menos que pretenda executar em modo restritivo de lista de permissões.

<Note>
Allow lists são opcionais para plugins opcionais. `alsoAllow` habilita apenas as ferramentas dos plugins opcionais nomeados, preservando o conjunto normal de ferramentas principais. Para restringir as ferramentas principais, use `tools.allow` com as ferramentas ou grupos principais desejados.
</Note>

## Exemplo: triagem de email

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

Execute um pipeline no modo de ferramenta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Execute um arquivo de fluxo de trabalho com argumentos:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continue um fluxo de trabalho interrompido após a aprovação.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionais

- `cwd`: Diretório de trabalho relativo para o pipeline (deve permanecer dentro do diretório de trabalho do gateway).
- `timeoutMs`: Aborta o fluxo de trabalho se ele exceder essa duração (padrão: 20000).
- `maxStdoutBytes`: Aborta o fluxo de trabalho se a saída exceder esse tamanho (padrão: 512000).
- `argsJson`: String JSON passada para `lobster run --args-json` (apenas arquivos de fluxo de trabalho).

## Envelope de saída

O Lobster retorna um envelope JSON com um de três status:

- `ok` → concluído com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é obrigatório para retomar
- `cancelled` → negado ou cancelado explicitamente

A ferramenta expõe o envelope tanto em `content` (JSON formatado) quanto em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retomar e continuar os efeitos colaterais
- `approve: false` → cancelar e finalizar o fluxo de trabalho

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON às solicitações de aprovação sem cola personalizada de jq/heredoc. Os tokens de retomada agora são compactos: o Lobster armazena o estado de retomada do fluxo de trabalho em seu diretório de estado e retorna uma pequena chave de token.

## OpenProse

OpenProse combina bem com Lobster: use `/prose` para orquestrar a preparação multiagente e, em seguida, execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar do Lobster, permita a ferramenta `lobster` para subagentes via `tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Apenas local no processo** — os fluxos de trabalho são executados dentro do processo do gateway; não há chamadas de rede pelo próprio plugin.
- **Sem segredos** — o Lobster não gerencia OAuth; ele chama ferramentas do OpenClaw que fazem isso.
- **Ciente de sandbox** — desabilitado quando o contexto da ferramenta está em sandbox.
- **Reforçado** — timeouts e limites de saída aplicados pelo runner embutido.

## Solução de problemas

- **`lobster timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline seja executado no modo de ferramenta e imprima apenas JSON.
- **`lobster failed`** → verifique os logs do gateway para obter os detalhes do erro do runner embutido.

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Criação de ferramentas de Plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: fluxos de trabalho da comunidade

Um exemplo público: uma CLI de “segundo cérebro” + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de caixa de entrada e varreduras de itens obsoletos; o Lobster encadeia esses comandos em fluxos de trabalho como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com barreiras de aprovação. A IA lida com julgamento (categorização) quando disponível e recorre a regras determinísticas quando não.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — agendamento de fluxos de trabalho Lobster
- [Visão geral da automação](/pt-BR/automation) — todos os mecanismos de automação
- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
