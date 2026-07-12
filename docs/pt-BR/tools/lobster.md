---
read_when:
    - Você quer fluxos de trabalho determinísticos de várias etapas com aprovações explícitas
    - Você precisa retomar um fluxo de trabalho sem executar novamente as etapas anteriores
summary: Runtime de fluxo de trabalho tipado para o OpenClaw com etapas de aprovação retomáveis.
title: Lobster
x-i18n:
    generated_at: "2026-07-12T15:49:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

O Lobster executa pipelines de ferramentas com várias etapas como uma única chamada de ferramenta determinística, com
pontos de verificação de aprovação explícitos e tokens de retomada. Ele fica uma camada acima
do trabalho desanexado em segundo plano: para orquestrar fluxos entre muitas tarefas desanexadas,
consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`); para o registro de
atividades das tarefas, consulte [Tarefas em segundo plano](/pt-BR/automation/tasks).

## Por quê

Sem o Lobster, um trabalho com várias etapas exige muitas chamadas de ferramenta de ida e volta, com o
modelo orquestrando cada etapa. O Lobster transfere essa orquestração para um
runtime tipado:

- **Uma chamada em vez de muitas**: uma única chamada da ferramenta Lobster retorna um resultado
  estruturado para toda a pipeline.
- **Aprovações integradas**: efeitos colaterais (enviar, publicar, excluir) interrompem o fluxo de trabalho
  até que sejam explicitamente aprovados.
- **Retomável**: um fluxo de trabalho interrompido retorna um token; aprove e retome sem
  executar novamente as etapas anteriores.

O Lobster é uma DSL pequena e restrita, e não uma linguagem de script de uso geral:
aprovar/retomar é uma primitiva durável e integrada; as pipelines são dados (fáceis de
registrar, comparar, reproduzir e revisar); a gramática reduzida limita caminhos de código "criativos", para que
a validação permaneça realista; tempos limite, limites de saída, verificações de sandbox e
listas de permissões são impostos pelo runtime, não por cada script. Cada etapa ainda pode
chamar qualquer CLI ou script — gere arquivos `.lobster` com outras ferramentas se você
quiser uma linguagem de autoria mais completa.

Sem o Lobster, uma triagem recorrente de e-mails seria assim:

```text
Usuário: "Verifique meus e-mails e elabore respostas"
→ o openclaw chama gmail.list
→ o LLM resume
→ Usuário: "elabore respostas para os itens nº 2 e nº 5"
→ o LLM elabora
→ Usuário: "envie o item nº 2"
→ o openclaw chama gmail.send
(repete diariamente, sem memória do que foi triado)
```

Com o Lobster, o mesmo trabalho é uma única chamada que para para aprovação e depois é retomada:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 precisam de resposta, 2 precisam de ação" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Enviar 2 rascunhos de resposta?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Como funciona

O OpenClaw executa fluxos de trabalho do Lobster **no processo** usando o pacote
`@clawdbot/lobster` incluído como um executor incorporado. Nenhum subprocesso externo
`lobster` é iniciado; a chamada de ferramenta retorna diretamente um envelope JSON. Se a
pipeline parar para aprovação, o envelope conterá um token de retomada (ou um ID curto de
aprovação) para que você possa continuar mais tarde.

## Ativar

O Lobster é uma ferramenta de plugin **opcional**, não ativada por padrão. Ela é fornecida
com o pacote, portanto não é necessária uma etapa de instalação separada — basta permitir a ferramenta:

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
restringir outras ferramentas principais. Use `tools.allow` somente se quiser um modo
restritivo de lista de permissões.
</Note>

A ferramenta é totalmente desativada em contextos de ferramentas em sandbox.

Se você precisar da CLI independente do Lobster para desenvolvimento ou pipelines externas
(fora do executor incorporado do Gateway), instale-a pelo
[repositório do Lobster](https://github.com/openclaw/lobster) e coloque `lobster` no
`PATH`.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie comandos pequenos que se comuniquem por JSON e encadeie-os em uma única chamada do Lobster.
(Os nomes de comandos abaixo são exemplos — substitua-os pelos seus.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Aplicar alterações?'",
  "timeoutMs": 30000
}
```

Se a pipeline solicitar aprovação, retome-a com o token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Exemplo: mapear itens de entrada para chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas de LLM somente com JSON (llm-task)

Para uma **etapa estruturada de LLM** dentro de um fluxo de trabalho, ative a ferramenta de plugin opcional
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

### Limitação importante: Lobster incorporado versus `openclaw.invoke`

O plugin Lobster incluído executa fluxos de trabalho **no processo** dentro do Gateway.
Nesse modo incorporado, `openclaw.invoke` **não** herda automaticamente uma
URL ou um contexto de autenticação do Gateway para chamadas aninhadas de ferramentas da CLI do OpenClaw.

Isso significa que este padrão **não é confiável atualmente no executor incorporado**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Use o exemplo abaixo somente ao executar a **CLI independente do Lobster** em um
ambiente no qual `openclaw.invoke` já esteja configurado com o contexto correto de
Gateway e autenticação.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Com base no e-mail de entrada, retorne a intenção e um rascunho.",
  "thinking": "low",
  "input": { "subject": "Olá", "body": "Você pode ajudar?" },
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

Se você estiver usando o plugin Lobster incorporado atualmente, prefira:

- uma chamada direta à ferramenta `llm-task` fora do Lobster; ou
- etapas que não usem `openclaw.invoke` dentro da pipeline do Lobster até que uma ponte
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

Executar um arquivo de fluxo de trabalho com argumentos:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Campo            | Padrão      | Observações                                                                                                        |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | obrigatório | String de pipeline embutida ou um caminho terminado em `.lobster`/`.yaml`/`.yml`/`.json` para um arquivo de fluxo de trabalho. |
| `cwd`            | cwd do Gateway | Diretório de trabalho relativo; deve ser resolvido dentro do diretório de trabalho do Gateway (caminhos absolutos são rejeitados). |
| `timeoutMs`      | `20000`     | Interrompe a execução se esse valor for excedido.                                                            |
| `maxStdoutBytes` | `512000`    | Interrompe a execução se o stdout ou stderr capturado exceder esse tamanho.                                  |
| `argsJson`       | -           | String JSON de argumentos para um arquivo de fluxo de trabalho (ignorada em pipelines embutidas).            |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` aceita `token` (o token de retomada completo de `requiresApproval`)
ou `approvalId` (o ID curto do mesmo objeto) — use o que a execução interrompida
retornou. `approve` é obrigatório.

### Modo gerenciado do Task Flow

Passar `flowControllerId` e `flowGoal` em `run` (ou `flowId` e
`flowExpectedRevision` em `resume`) encaminha a chamada pela API gerenciada de
[Task Flow](/pt-BR/automation/taskflow) do runtime do plugin em vez de retornar
um envelope simples: o OpenClaw cria ou retoma um registro de fluxo durável, aplica o
envelope do Lobster a ele (`waiting` durante a aprovação, `succeeded`/`failed` após a
conclusão) e retorna `{ ok, envelope, flow, mutation }`. Esse modo exige
um runtime do Task Flow vinculado e é destinado a código de plugin/controlador que precisa
de estado de fluxo durável entre reinicializações do Gateway, não ao uso ad hoc típico por agentes.

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

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON às
solicitações de aprovação sem código auxiliar personalizado com jq/heredoc. O estado de retomada é armazenado como
pequenos arquivos JSON no diretório de estado do Lobster (`~/.lobster/state` por
padrão; substitua-o com `LOBSTER_STATE_DIR`); o token em si codifica apenas um
ponteiro para esse estado, não o estado completo da pipeline.

## OpenProse

O OpenProse funciona bem com o Lobster: use `/prose` para orquestrar a preparação com vários agentes
e depois execute uma pipeline do Lobster para aprovações determinísticas. Se um programa Prose
precisar do Lobster, permita a ferramenta `lobster` para subagentes por meio de
`tools.subagents.tools`. Consulte [OpenProse](/pt-BR/prose).

## Segurança

- **Somente local e no processo** — os fluxos de trabalho são executados dentro do processo do Gateway; o
  próprio plugin não faz chamadas de rede.
- **Sem segredos** — o Lobster não gerencia OAuth; ele chama as ferramentas do OpenClaw que
  fazem isso.
- **Compatível com sandbox** — desativado quando o contexto da ferramenta está em sandbox.
- **Reforçado** — tempos limite e limites de saída são impostos pelo executor incorporado.

## Solução de problemas

| Erro                                                          | Causa/correção                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | A pipeline excedeu `timeoutMs`. Aumente-o ou divida a pipeline.                   |
| `lobster stdout exceeded maxStdoutBytes` (ou `stderr`)        | A saída capturada excedeu o limite. Aumente `maxStdoutBytes` ou reduza a saída.   |
| `run --args-json must be valid JSON`                          | Não foi possível analisar `argsJson` (execuções de arquivos de fluxo de trabalho). Corrija a string JSON. |
| `lobster runtime failed` (ou outra mensagem `runtime_error`) | O runtime incorporado retornou um envelope de erro. Verifique os logs do Gateway para obter detalhes. |

## Saiba mais

- [Plugins](/pt-BR/tools/plugin)
- [Criação de ferramentas de plugin](/pt-BR/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: fluxos de trabalho da comunidade

Um exemplo público: uma CLI de "segundo cérebro" + pipelines do Lobster que gerenciam três
cofres Markdown (pessoal, do parceiro e compartilhado). A CLI gera JSON para estatísticas,
listagens da caixa de entrada e verificações de itens desatualizados; o Lobster encadeia esses comandos em fluxos de trabalho
como `weekly-review`, `inbox-triage`, `memory-consolidation` e
`shared-task-sync`, cada um com pontos de aprovação. A IA realiza avaliações
(categorização) quando disponível e recorre a regras determinísticas quando
não está.

- Discussão: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionados

- [Automação](/pt-BR/automation) - todos os mecanismos de automação
- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
