---
read_when:
    - Você quer fluxos de trabalho determinísticos com várias etapas e aprovações explícitas
    - Você precisa retomar um fluxo de trabalho sem executar novamente as etapas anteriores
summary: Runtime de fluxo de trabalho tipado para o OpenClaw com etapas de aprovação retomáveis.
title: Lagosta
x-i18n:
    generated_at: "2026-07-12T00:27:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

O Lobster executa pipelines de ferramentas com várias etapas como uma única chamada de ferramenta determinística, com
pontos de verificação de aprovação explícitos e tokens de retomada. Ele fica uma camada acima
do trabalho em segundo plano desacoplado: para orquestrar fluxos entre muitas tarefas desacopladas,
consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`); para o
registro de atividades das tarefas, consulte [Tarefas em segundo plano](/pt-BR/automation/tasks).

## Por quê

Sem o Lobster, um trabalho com várias etapas exige muitas chamadas de ferramenta de ida e volta, com o
modelo orquestrando cada etapa. O Lobster transfere essa orquestração para um
runtime tipado:

- **Uma chamada em vez de várias**: uma única chamada da ferramenta Lobster retorna um resultado
  estruturado para todo o pipeline.
- **Aprovações integradas**: efeitos colaterais (enviar, publicar, excluir) interrompem o fluxo de trabalho
  até que sejam explicitamente aprovados.
- **Retomável**: um fluxo de trabalho interrompido retorna um token; aprove e retome sem
  executar novamente as etapas anteriores.

O Lobster é uma DSL pequena e restrita, não uma linguagem de script de uso geral:
aprovar/retomar é uma primitiva durável e integrada; pipelines são dados (fáceis de
registrar, comparar, reproduzir e revisar); a gramática reduzida limita caminhos de código "criativos", para que
a validação permaneça realista; tempos limite, limites de saída, verificações de sandbox e
listas de permissões são impostos pelo runtime, não por cada script. Cada etapa ainda pode
chamar qualquer CLI ou script — gere arquivos `.lobster` com outras ferramentas caso
queira uma linguagem de autoria mais avançada.

Sem o Lobster, uma triagem recorrente de e-mails se parece com:

```text
Usuário: "Verifique meus e-mails e redija respostas"
→ openclaw chama gmail.list
→ O LLM resume
→ Usuário: "redija respostas para os itens nº 2 e nº 5"
→ O LLM redige
→ Usuário: "envie o item nº 2"
→ openclaw chama gmail.send
(repete diariamente, sem memória do que foi triado)
```

Com o Lobster, o mesmo trabalho é uma única chamada que é interrompida para aprovação e depois retomada:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

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

## Como funciona

O OpenClaw executa fluxos de trabalho do Lobster **no mesmo processo** usando o pacote incluído
`@clawdbot/lobster` como executor incorporado. Nenhum subprocesso externo `lobster`
é iniciado; a chamada da ferramenta retorna diretamente um envelope JSON. Se o
pipeline for interrompido para aprovação, o envelope incluirá um token de retomada (ou um
ID de aprovação curto) para que você possa continuar depois.

## Ativar

O Lobster é uma ferramenta de Plugin **opcional**, não ativada por padrão. Ela é fornecida
como parte do pacote, portanto nenhuma etapa de instalação separada é necessária — basta permitir a ferramenta:

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

<Note>
`alsoAllow` adiciona `lobster` ao perfil de ferramentas ativo sem
restringir outras ferramentas principais. Use `tools.allow` somente se quiser um modo restritivo
de lista de permissões.
</Note>

A ferramenta é totalmente desativada em contextos de ferramentas em sandbox.

Se você precisar da CLI autônoma do Lobster para desenvolvimento ou pipelines externos
(fora do executor incorporado do Gateway), instale-a pelo
[repositório do Lobster](https://github.com/openclaw/lobster) e adicione `lobster` ao
`PATH`.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie pequenos comandos que se comuniquem por JSON e, em seguida, encadeie-os em uma única chamada do Lobster.
(Os nomes de comandos abaixo são exemplos — substitua-os pelos seus.)

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

Exemplo: mapeie itens de entrada para chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas de LLM somente com JSON (llm-task)

Para uma **etapa estruturada de LLM** dentro de um fluxo de trabalho, ative a ferramenta de Plugin opcional
`llm-task` e chame-a pelo Lobster:

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

### Limitação importante: Lobster incorporado em comparação com `openclaw.invoke`

O Plugin Lobster incluído executa fluxos de trabalho **no mesmo processo** dentro do Gateway.
Nesse modo incorporado, `openclaw.invoke` **não** herda automaticamente uma
URL do Gateway nem o contexto de autenticação para chamadas aninhadas de ferramentas da CLI do OpenClaw.

Isso significa que este padrão **não é confiável atualmente no executor incorporado**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Use o exemplo abaixo somente ao executar a **CLI autônoma do Lobster** em um
ambiente no qual `openclaw.invoke` já esteja configurado com o contexto correto
do Gateway e de autenticação.

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

Se você usa atualmente o Plugin Lobster incorporado, prefira:

- uma chamada direta da ferramenta `llm-task` fora do Lobster; ou
- etapas que não usem `openclaw.invoke` dentro do pipeline do Lobster até que uma ponte
  incorporada compatível seja adicionada.

Consulte [Tarefa de LLM](/pt-BR/tools/llm-task) para obter detalhes e opções de configuração.

## Arquivos de fluxo de trabalho (.lobster)

O Lobster pode executar arquivos de fluxo de trabalho YAML/JSON com os campos `name`, `args`, `steps`, `env`,
`condition` e `approval`. Defina `pipeline` como o caminho do arquivo na chamada da
ferramenta.

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

## Parâmetros da ferramenta

### `run`

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

| Campo            | Padrão         | Observações                                                                                                                   |
| ---------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | obrigatório    | String de pipeline embutida ou um caminho terminado em `.lobster`/`.yaml`/`.yml`/`.json` para um arquivo de fluxo de trabalho. |
| `cwd`            | cwd do Gateway | Diretório de trabalho relativo; deve ser resolvido dentro do diretório de trabalho do Gateway (caminhos absolutos são rejeitados). |
| `timeoutMs`      | `20000`        | Interrompe a execução se o limite for excedido.                                                                               |
| `maxStdoutBytes` | `512000`       | Interrompe a execução se o stdout ou stderr capturado exceder esse tamanho.                                                    |
| `argsJson`       | -              | String JSON de argumentos para um arquivo de fluxo de trabalho (ignorada em pipelines embutidos).                             |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` aceita `token` (o token de retomada completo de `requiresApproval`)
ou `approvalId` (o ID curto do mesmo objeto) — use aquele que a execução
interrompida retornou. `approve` é obrigatório.

### Modo gerenciado do Task Flow

Fornecer `flowControllerId` e `flowGoal` em `run` (ou `flowId` e
`flowExpectedRevision` em `resume`) encaminha a chamada pela API gerenciada de
[Task Flow](/pt-BR/automation/taskflow) do runtime do Plugin, em vez de retornar
um envelope simples: o OpenClaw cria ou retoma um registro de fluxo durável, aplica o
envelope do Lobster a ele (`waiting` durante a aprovação, `succeeded`/`failed` na
conclusão) e retorna `{ ok, envelope, flow, mutation }`. Esse modo exige
um runtime do Task Flow vinculado e destina-se a código de Plugin/controlador que precisa
de um estado de fluxo durável entre reinicializações do Gateway, não ao uso ad hoc comum por agentes.

## Envelope de saída

O Lobster retorna um envelope JSON com um de três status:

- `ok` — concluído com sucesso
- `needs_approval` — pausado; `requiresApproval` contém um `resumeToken` e um
  `approvalId` curto, e qualquer um deles pode retomar a execução
- `cancelled` — explicitamente negado ou cancelado

A ferramenta disponibiliza o envelope tanto em `content` (JSON formatado) quanto em `details`
(objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, examine a solicitação e decida:

- `approve: true` — retomar e continuar os efeitos colaterais
- `approve: false` — cancelar e finalizar o fluxo de trabalho

Use `approve --preview-from-stdin --limit N` para anexar uma visualização JSON às
solicitações de aprovação sem código de integração personalizado com jq/heredoc. O estado de retomada é armazenado como
pequenos arquivos JSON no diretório de estado do Lobster (`~/.lobster/state` por
padrão; substitua com `LOBSTER_STATE_DIR`); o próprio token codifica apenas um
ponteiro para esse estado, não o estado completo do pipeline.

## OpenProse

O OpenProse combina bem com o Lobster: use `/prose` para orquestrar a
preparação de vários agentes e, em seguida, execute um pipeline do Lobster para aprovações determinísticas. Se um programa
Prose precisar do Lobster, permita a ferramenta `lobster` para subagentes por meio de
`tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Somente local e no mesmo processo** — os fluxos de trabalho são executados dentro do processo do Gateway; não há
  chamadas de rede feitas pelo próprio Plugin.
- **Sem segredos** — o Lobster não gerencia OAuth; ele chama ferramentas do OpenClaw que
  fazem isso.
- **Ciente do sandbox** — desativado quando o contexto da ferramenta está em sandbox.
- **Reforçado** — tempos limite e limites de saída são impostos pelo executor incorporado.

## Solução de problemas

| Erro                                                          | Causa / correção                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | O pipeline excedeu `timeoutMs`. Aumente-o ou divida o pipeline.                                    |
| `lobster stdout exceeded maxStdoutBytes` (ou `stderr`)        | A saída capturada excedeu o limite. Aumente `maxStdoutBytes` ou reduza a saída.                     |
| `run --args-json must be valid JSON`                          | Não foi possível analisar `argsJson` (em execuções de arquivos de fluxo de trabalho). Corrija a string JSON. |
| `lobster runtime failed` (ou outra mensagem `runtime_error`)  | O runtime incorporado retornou um envelope de erro. Verifique os logs do Gateway para obter detalhes. |

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Criação de ferramentas de Plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: fluxos de trabalho da comunidade

Um exemplo público: uma CLI de "segundo cérebro" + pipelines do Lobster que gerenciam três cofres de Markdown (pessoal, do parceiro e compartilhado). A CLI gera JSON para estatísticas, listagens da caixa de entrada e verificações de itens desatualizados; o Lobster encadeia esses comandos em fluxos de trabalho como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com etapas de aprovação. A IA cuida das decisões que exigem discernimento (categorização) quando disponível e, quando não está, recorre a regras determinísticas.

- Discussão: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automação](/pt-BR/automation) - todos os mecanismos de automação
- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
