---
read_when:
    - You want deterministic multi-step workflows with explicit approvals
    - Você precisa retomar um fluxo de trabalho sem executar novamente as etapas anteriores
summary: Runtime de workflow tipado para o OpenClaw com gates de aprovação retomáveis.
title: Lobster
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:17:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster é um shell de workflow que permite ao OpenClaw executar sequências de ferramentas de várias etapas como uma única operação determinística com checkpoints explícitos de aprovação.

O Lobster é uma camada de autoria acima de trabalho desacoplado em segundo plano. Para orquestração de fluxo acima de tarefas individuais, consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`). Para o registro de atividade de tarefas, consulte [`openclaw tasks`](/pt-BR/automation/tasks).

## Gancho

Seu assistente pode criar as ferramentas que gerenciam a si mesmo. Peça um workflow e, 30 minutos depois, você tem uma CLI mais pipelines que executam como uma única chamada. O Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por quê

Hoje, workflows complexos exigem muitas chamadas de ferramenta de ida e volta. Cada chamada custa tokens, e a LLM precisa orquestrar cada etapa. O Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de muitas**: o OpenClaw executa uma chamada única de ferramenta Lobster e recebe um resultado estruturado.
- **Aprovações integradas**: efeitos colaterais (enviar e-mail, postar comentário) interrompem o workflow até que haja aprovação explícita.
- **Retomável**: workflows interrompidos retornam um token; aprove e retome sem executar tudo de novo.

## Por que uma DSL em vez de programas comuns?

O Lobster é intencionalmente pequeno. O objetivo não é “uma nova linguagem”, mas uma especificação de pipeline previsível e amigável para IA, com aprovações e tokens de retomada de primeira classe.

- **Approve/resume é integrado**: um programa normal pode solicitar intervenção humana, mas não consegue _pausar e retomar_ com um token durável sem que você invente esse runtime por conta própria.
- **Determinismo + auditabilidade**: pipelines são dados, então são fáceis de registrar, comparar, reproduzir e revisar.
- **Superfície restrita para IA**: uma gramática pequena + pipes JSON reduzem caminhos de código “criativos” e tornam a validação realista.
- **Política de segurança incorporada**: timeouts, limites de saída, verificações de sandbox e allowlists são aplicados pelo runtime, não por cada script.
- **Ainda programável**: cada etapa pode chamar qualquer CLI ou script. Se você quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenClaw executa workflows do Lobster **em processo** usando um runner embutido. Nenhum subprocesso externo de CLI é iniciado; o engine de workflow executa dentro do processo do gateway e retorna diretamente um envelope JSON.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie pequenos comandos que falem JSON e depois encadeie-os em uma única chamada do Lobster. (Os nomes de comando abaixo são exemplos — troque pelos seus.)

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

A IA aciona o workflow; o Lobster executa as etapas. Gates de aprovação mantêm os efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada em chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas de LLM somente JSON (llm-task)

Para workflows que precisam de uma **etapa estruturada de LLM**, ative a ferramenta opcional de Plugin
`llm-task` e chame-a a partir do Lobster. Isso mantém o workflow
determinístico enquanto ainda permite classificar/resumir/redigir com um modelo.

Ative a ferramenta:

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
        "tools": { "allow": ["llm-task"] }
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

Consulte [LLM Task](/pt-BR/tools/llm-task) para ver detalhes e opções de configuração.

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
- `condition` (ou `when`) pode restringir etapas com base em `$step.approved`.

## Instalar o Lobster

Workflows Lobster incluídos são executados em processo; nenhum binário separado `lobster` é necessário. O runner embutido vem junto com o Plugin Lobster.

Se você precisar da CLI independente do Lobster para desenvolvimento ou pipelines externos, instale-a a partir do [repositório do Lobster](https://github.com/openclaw/lobster) e garanta que `lobster` esteja em `PATH`.

## Ativar a ferramenta

O Lobster é uma ferramenta de Plugin **opcional** (não ativada por padrão).

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

Evite usar `tools.allow: ["lobster"]`, a menos que você pretenda executar em modo restritivo de allowlist.

Observação: allowlists são opt-in para Plugins opcionais. Se sua allowlist nomear apenas
ferramentas de Plugin (como `lobster`), o OpenClaw mantém as ferramentas centrais ativadas. Para restringir ferramentas centrais,
inclua também na allowlist as ferramentas ou grupos centrais que você deseja.

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

Usuário aprova → retoma:

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

Executa um pipeline em modo de ferramenta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Executa um arquivo de workflow com args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continua um workflow interrompido após aprovação.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionais

- `cwd`: diretório de trabalho relativo do pipeline (deve permanecer dentro do diretório de trabalho do gateway).
- `timeoutMs`: aborta o workflow se exceder essa duração (padrão: 20000).
- `maxStdoutBytes`: aborta o workflow se a saída exceder esse tamanho (padrão: 512000).
- `argsJson`: string JSON passada para `lobster run --args-json` (somente arquivos de workflow).

## Envelope de saída

O Lobster retorna um envelope JSON com um destes três status:

- `ok` → terminou com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é necessário para retomar
- `cancelled` → negado ou cancelado explicitamente

A ferramenta expõe o envelope em `content` (JSON formatado) e em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retoma e continua os efeitos colaterais
- `approve: false` → cancela e finaliza o workflow

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON a solicitações de aprovação sem precisar de glue personalizado com jq/heredoc. Os tokens de retomada agora são compactos: o Lobster armazena o estado de retomada do workflow em seu diretório de estado e devolve uma pequena chave de token.

## OpenProse

O OpenProse combina bem com o Lobster: use `/prose` para orquestrar preparação com vários agentes e depois execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar de Lobster, permita a ferramenta `lobster` para subagentes via `tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Somente local em processo** — workflows são executados dentro do processo do gateway; nenhuma chamada de rede parte do próprio Plugin.
- **Sem segredos** — o Lobster não gerencia OAuth; ele chama ferramentas do OpenClaw que fazem isso.
- **Compatível com sandbox** — desativado quando o contexto da ferramenta está em sandbox.
- **Endurecido** — timeouts e limites de saída são aplicados pelo runner embutido.

## Solução de problemas

- **`lobster timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline execute em modo de ferramenta e imprima apenas JSON.
- **`lobster failed`** → verifique os logs do gateway para os detalhes de erro do runner embutido.

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Criação de ferramentas de Plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: workflows da comunidade

Um exemplo público: uma CLI de “second brain” + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de inbox e varreduras de itens obsoletos; o Lobster encadeia esses comandos em workflows como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com gates de aprovação. A IA lida com julgamento (categorização) quando disponível e recorre a regras determinísticas quando não.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automation & Tasks](/pt-BR/automation) — agendamento de workflows Lobster
- [Visão geral de automação](/pt-BR/automation) — todos os mecanismos de automação
- [Visão geral de ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
