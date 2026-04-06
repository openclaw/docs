---
read_when:
    - Você quer workflows determinísticos de várias etapas com aprovações explícitas
    - Você precisa retomar um workflow sem executar novamente as etapas anteriores
summary: Runtime tipado de workflow para OpenClaw com pontos de aprovação retomáveis.
title: Lobster
x-i18n:
    generated_at: "2026-04-06T03:13:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1014945d104ef8fdca0d30be89e35136def1b274c6403b06de29e8502b8124b
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster é um shell de workflow que permite ao OpenClaw executar sequências de ferramentas de várias etapas como uma única operação determinística, com pontos de aprovação explícitos.

Lobster é uma camada de autoria acima do trabalho em segundo plano desacoplado. Para orquestração de fluxo acima de tarefas individuais, consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`). Para o registro de atividade das tarefas, consulte [`openclaw tasks`](/pt-BR/automation/tasks).

## Hook

Seu assistente pode criar as ferramentas que gerenciam a si mesmo. Peça um workflow e, 30 minutos depois, você terá uma CLI mais pipelines que executam como uma única chamada. Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por quê

Hoje, workflows complexos exigem muitas chamadas de ferramenta de ida e volta. Cada chamada custa tokens, e o LLM precisa orquestrar cada etapa. Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de várias**: OpenClaw executa uma chamada de ferramenta Lobster e recebe um resultado estruturado.
- **Aprovações embutidas**: efeitos colaterais (enviar email, publicar comentário) interrompem o workflow até serem explicitamente aprovados.
- **Retomável**: workflows interrompidos retornam um token; aprove e retome sem executar tudo de novo.

## Por que uma DSL em vez de programas comuns?

Lobster é intencionalmente pequeno. O objetivo não é "uma nova linguagem", e sim uma especificação de pipeline previsível e amigável para IA, com aprovações de primeira classe e tokens de retomada.

- **Aprovar/retomar já vem embutido**: um programa normal pode pedir confirmação a um humano, mas não consegue _pausar e retomar_ com um token durável sem que você invente esse runtime por conta própria.
- **Determinismo + auditabilidade**: pipelines são dados, então são fáceis de registrar, comparar, reproduzir e revisar.
- **Superfície restrita para IA**: uma gramática pequena + encadeamento JSON reduz caminhos de código “criativos” e torna a validação realista.
- **Política de segurança incorporada**: timeouts, limites de saída, verificações de sandbox e allowlists são aplicados pelo runtime, não por cada script.
- **Ainda programável**: cada etapa pode chamar qualquer CLI ou script. Se você quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenClaw executa workflows Lobster **in-process** usando um runner embutido. Nenhum subprocesso CLI externo é iniciado; o mecanismo de workflow executa dentro do processo do gateway e retorna diretamente um envelope JSON.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie comandos pequenos que falem JSON e depois encadeie-os em uma única chamada Lobster. (Nomes de comando de exemplo abaixo — substitua pelos seus.)

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

A IA aciona o workflow; Lobster executa as etapas. Os pontos de aprovação mantêm os efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada em chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas LLM somente JSON (llm-task)

Para workflows que precisam de uma **etapa LLM estruturada**, habilite a ferramenta opcional de plugin
`llm-task` e chame-a a partir do Lobster. Isso mantém o workflow
determinístico, mas ainda permite classificar/resumir/redigir com um modelo.

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

Consulte [LLM Task](/pt-BR/tools/llm-task) para detalhes e opções de configuração.

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
- `condition` (ou `when`) pode controlar etapas com base em `$step.approved`.

## Instalar Lobster

Workflows Lobster empacotados são executados in-process; nenhum binário `lobster` separado é necessário. O runner embutido acompanha o plugin Lobster.

Se você precisar da CLI Lobster independente para desenvolvimento ou pipelines externos, instale-a a partir do [repositório do Lobster](https://github.com/openclaw/lobster) e garanta que `lobster` esteja no `PATH`.

## Habilitar a ferramenta

Lobster é uma **ferramenta de plugin opcional** (não habilitada por padrão).

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

Evite usar `tools.allow: ["lobster"]`, a menos que você pretenda executar no modo restritivo de allowlist.

Observação: allowlists são opt-in para plugins opcionais. Se sua allowlist nomear apenas
ferramentas de plugin (como `lobster`), o OpenClaw manterá as ferramentas do núcleo habilitadas. Para restringir ferramentas do núcleo,
inclua também na allowlist as ferramentas ou grupos do núcleo que você quiser.

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

Um workflow. Determinístico. Seguro.

## Parâmetros da ferramenta

### `run`

Executa um pipeline no modo de ferramenta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Executar um arquivo de workflow com argumentos:

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

- `cwd`: diretório de trabalho relativo para o pipeline (deve permanecer dentro do diretório de trabalho do gateway).
- `timeoutMs`: aborta o workflow se ele exceder essa duração (padrão: 20000).
- `maxStdoutBytes`: aborta o workflow se a saída exceder esse tamanho (padrão: 512000).
- `argsJson`: string JSON passada para `lobster run --args-json` (somente arquivos de workflow).

## Envelope de saída

Lobster retorna um envelope JSON com um de três status:

- `ok` → concluído com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é necessário para retomar
- `cancelled` → negado explicitamente ou cancelado

A ferramenta expõe o envelope em `content` (JSON formatado) e `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retoma e continua os efeitos colaterais
- `approve: false` → cancela e finaliza o workflow

Use `approve --preview-from-stdin --limit N` para anexar uma pré-visualização JSON a solicitações de aprovação sem cola customizada de jq/heredoc. Os tokens de retomada agora são compactos: Lobster armazena o estado de retomada do workflow em seu diretório de estado e devolve uma pequena chave de token.

## OpenProse

OpenProse combina bem com Lobster: use `/prose` para orquestrar preparação multiagente e depois execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar de Lobster, permita a ferramenta `lobster` para subagentes via `tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Apenas local in-process** — os workflows executam dentro do processo do gateway; nenhum chamado de rede vem do próprio plugin.
- **Sem segredos** — Lobster não gerencia OAuth; ele chama ferramentas do OpenClaw que fazem isso.
- **Compatível com sandbox** — desabilitado quando o contexto da ferramenta está em sandbox.
- **Endurecido** — timeouts e limites de saída são aplicados pelo runner embutido.

## Solução de problemas

- **`lobster timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline execute no modo de ferramenta e imprima apenas JSON.
- **`lobster failed`** → verifique os logs do gateway para detalhes de erro do runner embutido.

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Autoria de ferramentas de plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: workflows da comunidade

Um exemplo público: uma CLI de “second brain” + pipelines Lobster que gerenciam três cofres Markdown (pessoal, do parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de caixa de entrada e varreduras de itens antigos; Lobster encadeia esses comandos em workflows como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com pontos de aprovação. A IA faz o julgamento (categorização) quando disponível e recorre a regras determinísticas quando não.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automation & Tasks](/pt-BR/automation) — agendamento de workflows Lobster
- [Visão geral da automação](/pt-BR/automation) — todos os mecanismos de automação
- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
