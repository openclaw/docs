---
read_when:
    - Você quer que os agentes transformem correções ou procedimentos reutilizáveis em Skills do workspace
    - Você está configurando memória procedural de Skills
    - Você está depurando o comportamento da ferramenta `skill_workshop`
    - Você está decidindo se deve habilitar a criação automática de Skills
summary: Captura experimental de procedimentos reutilizáveis como Skills do workspace com revisão, aprovação, quarentena e atualização dinâmica de Skills
title: Plugin Skill Workshop
x-i18n:
    generated_at: "2026-04-22T04:25:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin Skill Workshop

O Skill Workshop é **experimental**. Ele vem desabilitado por padrão, suas
heurísticas de captura e prompts de revisão podem mudar entre versões, e gravações
automáticas devem ser usadas apenas em workspaces confiáveis após revisar primeiro
a saída no modo pendente.

O Skill Workshop é memória procedural para Skills do workspace. Ele permite que um agente transforme
workflows reutilizáveis, correções do usuário, correções difíceis de obter e armadilhas recorrentes
em arquivos `SKILL.md` em:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Isso é diferente de memória de longo prazo:

- **Memory** armazena fatos, preferências, entidades e contexto passado.
- **Skills** armazenam procedimentos reutilizáveis que o agente deve seguir em tarefas futuras.
- **Skill Workshop** é a ponte de um turno útil para uma Skill durável do workspace,
  com verificações de segurança e aprovação opcional.

O Skill Workshop é útil quando o agente aprende um procedimento como:

- como validar assets GIF animados de origem externa
- como substituir assets de captura de tela e verificar dimensões
- como executar um cenário de QA específico do repositório
- como depurar uma falha recorrente de provedor
- como reparar uma observação local de workflow desatualizada

Ele não foi projetado para:

- fatos como “o usuário gosta de azul”
- memória autobiográfica ampla
- arquivamento bruto de transcrição
- segredos, credenciais ou texto oculto de prompt
- instruções pontuais que não vão se repetir

## Estado padrão

O plugin incluído é **experimental** e **desabilitado por padrão**, a menos que seja
explicitamente habilitado em `plugins.entries.skill-workshop`.

O manifesto do plugin não define `enabledByDefault: true`. O padrão `enabled: true`
dentro do schema de configuração do plugin se aplica apenas depois que a entrada do plugin
já tiver sido selecionada e carregada.

Experimental significa:

- o plugin tem suporte suficiente para testes opt-in e dogfooding
- armazenamento de propostas, limites do revisor e heurísticas de captura podem evoluir
- aprovação pendente é o modo inicial recomendado
- aplicação automática é para configurações pessoais/confiáveis de workspace, não para ambientes compartilhados ou hostis
  com grande volume de entrada

## Habilitar

Configuração mínima segura:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Com essa configuração:

- a ferramenta `skill_workshop` fica disponível
- correções reutilizáveis explícitas entram na fila como propostas pendentes
- passagens do revisor baseadas em limite podem propor atualizações de Skills
- nenhum arquivo de Skill é gravado até que uma proposta pendente seja aplicada

Use gravações automáticas apenas em workspaces confiáveis:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` ainda usa o mesmo scanner e caminho de quarentena. Ele
não aplica propostas com achados críticos.

## Configuração

| Chave                | Padrão      | Intervalo / valores                         | Significado                                                          |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Habilita o plugin depois que a entrada do plugin for carregada.      |
| `autoCapture`        | `true`      | boolean                                     | Habilita captura/revisão pós-turno em turnos de agente bem-sucedidos. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Enfileira propostas ou grava propostas seguras automaticamente.      |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Escolhe captura explícita de correção, revisor LLM, ambos ou nenhum. |
| `reviewInterval`     | `15`        | `1..200`                                    | Executa o revisor após essa quantidade de turnos bem-sucedidos.      |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Executa o revisor após essa quantidade de chamadas de ferramenta observadas. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Timeout para a execução do revisor incorporado.                      |
| `maxPending`         | `50`        | `1..200`                                    | Máximo de propostas pendentes/em quarentena mantidas por workspace.  |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Tamanho máximo do arquivo gerado de Skill/arquivo de suporte.        |

Perfis recomendados:

```json5
// Conservador: somente uso explícito da ferramenta, sem captura automática.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Revisão primeiro: captura automaticamente, mas exige aprovação.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Automação confiável: grava propostas seguras imediatamente.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Baixo custo: sem chamada LLM do revisor, apenas frases explícitas de correção.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Caminhos de captura

O Skill Workshop tem três caminhos de captura.

### Sugestões da ferramenta

O modelo pode chamar `skill_workshop` diretamente quando identifica um procedimento reutilizável
ou quando o usuário pede para salvar/atualizar uma Skill.

Esse é o caminho mais explícito e funciona mesmo com `autoCapture: false`.

### Captura heurística

Quando `autoCapture` está habilitado e `reviewMode` é `heuristic` ou `hybrid`, o
plugin analisa turnos bem-sucedidos em busca de frases explícitas de correção do usuário:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

A heurística cria uma proposta a partir da instrução correspondente mais recente do usuário. Ela
usa dicas de tópico para escolher nomes de Skills para workflows comuns:

- tarefas com GIF animado -> `animated-gif-workflow`
- tarefas com captura de tela ou asset -> `screenshot-asset-workflow`
- tarefas de QA ou cenário -> `qa-scenario-workflow`
- tarefas de PR no GitHub -> `github-pr-workflow`
- fallback -> `learned-workflows`

A captura heurística é intencionalmente estreita. Ela serve para correções claras e
notas de processo repetíveis, não para resumo geral de transcrição.

### Revisor LLM

Quando `autoCapture` está habilitado e `reviewMode` é `llm` ou `hybrid`, o plugin
executa um revisor incorporado compacto quando os limites são atingidos.

O revisor recebe:

- o texto recente da transcrição, limitado aos últimos 12.000 caracteres
- até 12 Skills existentes do workspace
- até 2.000 caracteres de cada Skill existente
- instruções somente em JSON

O revisor não tem ferramentas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Ele pode retornar:

```json
{ "action": "none" }
```

ou uma proposta de Skill:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

Ele também pode acrescentar a uma Skill existente:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

Ou substituir texto exato em uma Skill existente:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

Prefira `append` ou `replace` quando já existir uma Skill relevante. Use `create`
apenas quando nenhuma Skill existente servir.

## Ciclo de vida da proposta

Toda atualização gerada se torna uma proposta com:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` opcional
- `sessionId` opcional
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` ou `reviewer`
- `status`
- `change`
- `scanFindings` opcional
- `quarantineReason` opcional

Status da proposta:

- `pending` - aguardando aprovação
- `applied` - gravada em `<workspace>/skills`
- `rejected` - rejeitada por operador/modelo
- `quarantined` - bloqueada por achados críticos do scanner

O estado é armazenado por workspace no diretório de estado do Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Propostas pendentes e em quarentena são deduplicadas por nome da Skill e payload
da alteração. O armazenamento mantém as propostas pendentes/em quarentena mais recentes até
`maxPending`.

## Referência da ferramenta

O plugin registra uma ferramenta de agente:

```text
skill_workshop
```

### `status`

Conta propostas por estado para o workspace ativo.

```json
{ "action": "status" }
```

Formato do resultado:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Lista propostas pendentes.

```json
{ "action": "list_pending" }
```

Para listar outro status:

```json
{ "action": "list_pending", "status": "applied" }
```

Valores válidos para `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Lista propostas em quarentena.

```json
{ "action": "list_quarantine" }
```

Use isso quando a captura automática parecer não fazer nada e os logs mencionarem
`skill-workshop: quarantined <skill>`.

### `inspect`

Busca uma proposta por id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Cria uma proposta. Com `approvalPolicy: "pending"`, isso entra na fila por padrão.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

Forçar uma gravação segura:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Forçar pendente mesmo com `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

Acrescentar a uma seção:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

Substituir texto exato:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Aplica uma proposta pendente.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` recusa propostas em quarentena:

```text
quarantined proposal cannot be applied
```

### `reject`

Marca uma proposta como rejeitada.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Grava um arquivo de suporte dentro de um diretório de Skill existente ou proposto.

Diretórios de suporte de nível superior permitidos:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Exemplo:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Arquivos de suporte têm escopo de workspace, passam por verificação de caminho, são limitados em bytes por
`maxSkillBytes`, são analisados pelo scanner e gravados de forma atômica.

## Gravações de Skill

O Skill Workshop grava apenas em:

```text
<workspace>/skills/<normalized-skill-name>/
```

Os nomes das Skills são normalizados:

- em minúsculas
- sequências que não correspondem a `[a-z0-9_-]` viram `-`
- caracteres não alfanuméricos no início/fim são removidos
- o comprimento máximo é 80 caracteres
- o nome final deve corresponder a `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- se a Skill não existir, o Skill Workshop grava um novo `SKILL.md`
- se ela já existir, o Skill Workshop acrescenta o body a `## Workflow`

Para `append`:

- se a Skill existir, o Skill Workshop acrescenta à seção solicitada
- se ela não existir, o Skill Workshop cria uma Skill mínima e depois acrescenta

Para `replace`:

- a Skill já deve existir
- `oldText` deve estar presente exatamente
- apenas a primeira correspondência exata é substituída

Todas as gravações são atômicas e atualizam imediatamente o snapshot em memória das Skills, então
a Skill nova ou atualizada pode se tornar visível sem reiniciar o Gateway.

## Modelo de segurança

O Skill Workshop tem um scanner de segurança para conteúdo gerado de `SKILL.md` e arquivos
de suporte.

Achados críticos colocam propostas em quarentena:

| Rule id                                | Bloqueia conteúdo que...                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | manda o agente ignorar instruções anteriores/de nível superior          |
| `prompt-injection-system`              | faz referência a prompts de sistema, mensagens de desenvolvedor ou instruções ocultas |
| `prompt-injection-tool`                | incentiva ignorar permissões/aprovação de ferramenta                    |
| `shell-pipe-to-shell`                  | inclui `curl`/`wget` com pipe para `sh`, `bash` ou `zsh`                |
| `secret-exfiltration`                  | parece enviar dados de env/process env pela rede                        |

Achados de aviso são mantidos, mas não bloqueiam sozinhos:

| Rule id              | Emite aviso para...                 |
| -------------------- | ----------------------------------- |
| `destructive-delete` | comandos amplos no estilo `rm -rf`  |
| `unsafe-permissions` | uso de permissões no estilo `chmod 777` |

Propostas em quarentena:

- mantêm `scanFindings`
- mantêm `quarantineReason`
- aparecem em `list_quarantine`
- não podem ser aplicadas por `apply`

Para recuperar uma proposta em quarentena, crie uma nova proposta segura com o
conteúdo inseguro removido. Não edite o JSON de armazenamento manualmente.

## Orientação de prompt

Quando habilitado, o Skill Workshop injeta uma seção curta de prompt que informa ao agente
que use `skill_workshop` para memória procedural durável.

A orientação enfatiza:

- procedimentos, não fatos/preferências
- correções do usuário
- procedimentos bem-sucedidos não óbvios
- armadilhas recorrentes
- reparo de Skill desatualizada/superficial/incorreta por meio de append/replace
- salvar procedimento reutilizável após loops longos de ferramenta ou correções difíceis
- texto curto e imperativo para Skill
- nada de despejos de transcrição

O texto do modo de gravação muda com `approvalPolicy`:

- modo pendente: enfileirar sugestões; aplicar somente após aprovação explícita
- modo automático: aplicar atualizações seguras de Skills do workspace quando forem claramente reutilizáveis

## Custos e comportamento de runtime

A captura heurística não chama nenhum modelo.

A revisão por LLM usa uma execução incorporada no modelo de agente ativo/padrão. Ela
é baseada em limites, então não é executada em todo turno por padrão.

O revisor:

- usa o mesmo contexto configurado de provedor/modelo quando disponível
- usa como fallback os padrões do agente em runtime
- tem `reviewTimeoutMs`
- usa contexto leve de bootstrap
- não tem ferramentas
- não grava nada diretamente
- só pode emitir uma proposta que passa pelo scanner normal e
  pelo caminho de aprovação/quarentena

Se o revisor falhar, exceder o tempo limite ou retornar JSON inválido, o plugin registra uma
mensagem de aviso/debug e ignora essa passagem de revisão.

## Padrões de operação

Use o Skill Workshop quando o usuário disser:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

Bom texto de Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Texto ruim de Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Motivos para a versão ruim não ser salva:

- parece uma transcrição
- não está no imperativo
- inclui detalhes pontuais e ruidosos
- não diz ao próximo agente o que fazer

## Depuração

Verifique se o plugin está carregado:

```bash
openclaw plugins list --enabled
```

Verifique a contagem de propostas a partir de um contexto de agente/ferramenta:

```json
{ "action": "status" }
```

Inspecione propostas pendentes:

```json
{ "action": "list_pending" }
```

Inspecione propostas em quarentena:

```json
{ "action": "list_quarantine" }
```

Sintomas comuns:

| Sintoma                              | Causa provável                                                                       | Verificação                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| A ferramenta não está disponível     | A entrada do plugin não está habilitada                                              | `plugins.entries.skill-workshop.enabled` e `openclaw plugins list`   |
| Nenhuma proposta automática aparece  | `autoCapture: false`, `reviewMode: "off"` ou limites não atingidos                   | Configuração, status da proposta, logs do Gateway                     |
| A heurística não capturou            | O texto do usuário não correspondeu aos padrões de correção                          | Use `skill_workshop.suggest` explícito ou habilite o revisor LLM      |
| O revisor não criou uma proposta     | O revisor retornou `none`, JSON inválido ou excedeu o tempo limite                   | Logs do Gateway, `reviewTimeoutMs`, limites                           |
| A proposta não é aplicada            | `approvalPolicy: "pending"`                                                          | `list_pending`, depois `apply`                                        |
| A proposta desapareceu da fila pendente | Proposta duplicada foi reutilizada, poda por máximo de pendentes ou foi aplicada/rejeitada/em quarentena | `status`, `list_pending` com filtros de status, `list_quarantine` |
| O arquivo de Skill existe, mas o modelo não a vê | O snapshot de Skills não foi atualizado ou o controle de Skills a exclui         | `openclaw skills` status e elegibilidade da Skill no workspace        |

Logs relevantes:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Cenários de QA

Cenários de QA com suporte do repositório:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Execute a cobertura determinística:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Execute a cobertura do revisor:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

O cenário do revisor é intencionalmente separado porque habilita
`reviewMode: "llm"` e exercita a passagem do revisor incorporado.

## Quando não habilitar aplicação automática

Evite `approvalPolicy: "auto"` quando:

- o workspace contém procedimentos sensíveis
- o agente está trabalhando com entrada não confiável
- as Skills são compartilhadas por uma equipe ampla
- você ainda está ajustando prompts ou regras do scanner
- o modelo lida com frequência com conteúdo hostil da web/email

Use primeiro o modo pendente. Mude para o modo automático apenas depois de revisar o tipo de
Skills que o agente propõe naquele workspace.

## Documentação relacionada

- [Skills](/pt-BR/tools/skills)
- [Plugins](/pt-BR/tools/plugin)
- [Testing](/pt-BR/reference/test)
