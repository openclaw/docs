---
read_when:
    - Você quer fluxos de trabalho determinísticos de várias etapas com aprovações explícitas
    - Você precisa retomar um fluxo de trabalho sem executar novamente as etapas anteriores
summary: Runtime de fluxo de trabalho tipado para OpenClaw com pontos de aprovação retomáveis.
title: Lagosta
x-i18n:
    generated_at: "2026-05-12T01:00:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Lobster é um shell de fluxo de trabalho que permite ao OpenClaw executar sequências de ferramentas com várias etapas como uma única operação determinística, com pontos de aprovação explícitos.

Lobster é uma camada de autoria acima do trabalho em segundo plano desvinculado. Para orquestração de fluxos acima de tarefas individuais, consulte [TaskFlow](/pt-BR/automation/taskflow) (`openclaw tasks flow`). Para o registro de atividades de tarefas, consulte [`openclaw tasks`](/pt-BR/automation/tasks).

## Gancho

Seu assistente pode criar as ferramentas que gerenciam a si mesmas. Peça um fluxo de trabalho e, 30 minutos depois, você tem uma CLI mais pipelines que rodam como uma única chamada. Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por quê

Hoje, fluxos de trabalho complexos exigem muitas chamadas de ferramentas de ida e volta. Cada chamada custa tokens, e o LLM precisa orquestrar cada etapa. Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de muitas**: o OpenClaw executa uma chamada de ferramenta Lobster e recebe um resultado estruturado.
- **Aprovações integradas**: efeitos colaterais (enviar e-mail, publicar comentário) interrompem o fluxo de trabalho até que sejam explicitamente aprovados.
- **Retomável**: fluxos de trabalho interrompidos retornam um token; aprove e retome sem executar tudo novamente.

## Por que uma DSL em vez de programas simples?

Lobster é intencionalmente pequeno. O objetivo não é "uma nova linguagem", mas uma especificação de pipeline previsível e amigável para IA, com aprovações e tokens de retomada de primeira classe.

- **Aprovar/retomar é integrado**: um programa normal pode solicitar uma ação humana, mas não consegue _pausar e retomar_ com um token durável sem que você invente esse runtime por conta própria.
- **Determinismo + auditabilidade**: pipelines são dados, então são fáceis de registrar, diferenciar, reproduzir e revisar.
- **Superfície restrita para IA**: uma gramática pequena + encaminhamento JSON reduz caminhos de código "criativos" e torna a validação realista.
- **Política de segurança embutida**: timeouts, limites de saída, verificações de sandbox e listas de permissão são aplicados pelo runtime, não por cada script.
- **Ainda programável**: cada etapa pode chamar qualquer CLI ou script. Se você quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenClaw executa fluxos de trabalho Lobster **in-process** usando um executor incorporado. Nenhum subprocesso de CLI externo é iniciado; o mecanismo de fluxo de trabalho executa dentro do processo do Gateway e retorna um envelope JSON diretamente.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie comandos pequenos que falam JSON e então encadeie-os em uma única chamada Lobster. (Nomes de comandos de exemplo abaixo - substitua pelos seus.)

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

Exemplo: mapear itens de entrada para chamadas de ferramentas:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas LLM somente JSON (llm-task)

Para fluxos de trabalho que precisam de uma **etapa LLM estruturada**, habilite a ferramenta opcional do plugin
`llm-task` e chame-a a partir do Lobster. Isso mantém o fluxo de trabalho
determinístico, ao mesmo tempo em que permite classificar/resumir/rascunhar com um modelo.

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

### Limitação importante: Lobster incorporado vs `openclaw.invoke`

O plugin Lobster incluído executa fluxos de trabalho **in-process** dentro do Gateway. Nesse modo incorporado, `openclaw.invoke` **não** herda automaticamente uma URL/contexto de autenticação do Gateway para chamadas aninhadas de ferramentas da CLI do OpenClaw.

Isso significa que este padrão **não é confiável atualmente no executor incorporado**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Use o exemplo abaixo somente ao executar a **CLI Lobster independente** em um ambiente em que `openclaw.invoke` já esteja configurado com o contexto correto de Gateway/autenticação.

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

Se você estiver usando o plugin Lobster incorporado hoje, prefira:

- uma chamada direta da ferramenta `llm-task` fora do Lobster, ou
- etapas que não usem `openclaw.invoke` dentro do pipeline Lobster até que uma ponte incorporada compatível seja adicionada.

Consulte [LLM Task](/pt-BR/tools/llm-task) para detalhes e opções de configuração.

## Arquivos de fluxo de trabalho (.lobster)

Lobster pode executar arquivos de fluxo de trabalho YAML/JSON com campos `name`, `args`, `steps`, `env`, `condition` e `approval`. Em chamadas de ferramentas do OpenClaw, defina `pipeline` como o caminho do arquivo.

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

Fluxos de trabalho Lobster incluídos rodam in-process; nenhum binário `lobster` separado é necessário. O executor incorporado é distribuído com o plugin Lobster.

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

Evite usar `tools.allow: ["lobster"]`, a menos que você pretenda executar em modo restritivo de lista de permissão.

<Note>
Listas de permissão são opt-in para plugins opcionais. `alsoAllow` habilita somente as ferramentas de plugin opcionais nomeadas, preservando o conjunto normal de ferramentas principais. Para restringir ferramentas principais, use `tools.allow` com as ferramentas ou grupos principais que você deseja.
</Note>

## Exemplo: triagem de e-mails

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

Executa um arquivo de fluxo de trabalho com argumentos:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continua um fluxo de trabalho interrompido após aprovação.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionais

- `cwd`: diretório de trabalho relativo para o pipeline (deve permanecer dentro do diretório de trabalho do Gateway).
- `timeoutMs`: aborta o fluxo de trabalho se exceder esta duração (padrão: 20000).
- `maxStdoutBytes`: aborta o fluxo de trabalho se a saída exceder este tamanho (padrão: 512000).
- `argsJson`: string JSON passada para `lobster run --args-json` (somente arquivos de fluxo de trabalho).

## Envelope de saída

Lobster retorna um envelope JSON com um de três status:

- `ok` → concluído com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é obrigatório para retomar
- `cancelled` → explicitamente negado ou cancelado

A ferramenta expõe o envelope tanto em `content` (JSON formatado) quanto em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retoma e continua os efeitos colaterais
- `approve: false` → cancela e finaliza o fluxo de trabalho

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON a solicitações de aprovação sem cola customizada de jq/heredoc. Tokens de retomada agora são compactos: Lobster armazena o estado de retomada do fluxo de trabalho no diretório de estado dele e devolve uma pequena chave de token.

## OpenProse

OpenProse combina bem com Lobster: use `/prose` para orquestrar a preparação multiagente e, em seguida, execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar do Lobster, permita a ferramenta `lobster` para subagentes via `tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Somente in-process local** - fluxos de trabalho executam dentro do processo do Gateway; nenhuma chamada de rede vem do próprio plugin.
- **Sem segredos** - Lobster não gerencia OAuth; ele chama ferramentas do OpenClaw que fazem isso.
- **Ciente de sandbox** - desabilitado quando o contexto da ferramenta está em sandbox.
- **Reforçado** - timeouts e limites de saída aplicados pelo executor incorporado.

## Solução de problemas

- **`lobster timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline rode em modo de ferramenta e imprima somente JSON.
- **`lobster failed`** → verifique os logs do Gateway para detalhes do erro do executor incorporado.

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Autoria de ferramentas de plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: fluxos de trabalho da comunidade

Um exemplo público: uma CLI de "segundo cérebro" + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de caixa de entrada e varreduras de itens desatualizados; Lobster encadeia esses comandos em fluxos de trabalho como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com portões de aprovação. A IA lida com julgamento (categorização) quando disponível e recorre a regras determinísticas quando não.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automação](/pt-BR/automation) - agendamento de fluxos de trabalho Lobster
- [Visão geral de automação](/pt-BR/automation) - todos os mecanismos de automação
- [Visão geral de ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
