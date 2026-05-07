---
read_when:
    - Você quer que os agentes transformem correções ou procedimentos reutilizáveis em Skills do espaço de trabalho
    - Você está configurando a memória procedural de habilidades
    - Você está depurando o comportamento da ferramenta skill_workshop
    - Você está decidindo se deve habilitar a criação automática de Skills
summary: Captura experimental de procedimentos reutilizáveis como Skills do espaço de trabalho, com revisão, aprovação, quarentena e atualização a quente de Skills
title: Plugin de oficina de Skills
x-i18n:
    generated_at: "2026-05-07T13:23:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop é **experimental**. Ele fica desativado por padrão, suas
heurísticas de captura e prompts de revisor podem mudar entre versões, e escritas
automáticas devem ser usadas apenas em workspaces confiáveis depois de revisar
primeiro a saída do modo pendente.

Skill Workshop é memória procedural para Skills de workspace. Ele permite que um agente transforme
fluxos de trabalho reutilizáveis, correções do usuário, soluções conquistadas com esforço e armadilhas recorrentes
em arquivos `SKILL.md` em:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Isso é diferente de memória de longo prazo:

- **Memória** armazena fatos, preferências, entidades e contexto passado.
- **Skills** armazenam procedimentos reutilizáveis que o agente deve seguir em tarefas futuras.
- **Skill Workshop** é a ponte de um turno útil para uma Skill durável de workspace,
  com verificações de segurança e aprovação opcional.

Skill Workshop é útil quando o agente aprende um procedimento como:

- como validar recursos de GIFs animados obtidos de fontes externas
- como substituir recursos de captura de tela e verificar dimensões
- como executar um cenário de QA específico do repositório
- como depurar uma falha recorrente de provedor
- como reparar uma nota obsoleta de fluxo de trabalho local

Ele não se destina a:

- fatos como "o usuário gosta de azul"
- memória autobiográfica ampla
- arquivamento bruto de transcrições
- segredos, credenciais ou texto oculto de prompt
- instruções pontuais que não se repetirão

## Estado padrão

O Plugin incluído é **experimental** e **desativado por padrão**, a menos que seja
explicitamente ativado em `plugins.entries.skill-workshop`.

O manifesto do Plugin não define `enabledByDefault: true`. O padrão `enabled: true`
dentro do esquema de configuração do Plugin se aplica apenas depois que a entrada do Plugin já foi
selecionada e carregada.

Experimental significa:

- o Plugin tem suporte suficiente para testes opt-in e dogfooding
- o armazenamento de propostas, os limites do revisor e as heurísticas de captura podem evoluir
- aprovação pendente é o modo inicial recomendado
- aplicação automática é para configurações pessoais/de workspace confiáveis, não para ambientes compartilhados ou hostis
  com alto volume de entrada

## Ativar

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

Com esta configuração:

- a ferramenta `skill_workshop` fica disponível
- correções reutilizáveis explícitas são enfileiradas como propostas pendentes
- passagens de revisor baseadas em limite podem propor atualizações de Skills
- nenhum arquivo de Skill é escrito até que uma proposta pendente seja aplicada

Use escritas automáticas apenas em workspaces confiáveis:

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
| `enabled`            | `true`      | boolean                                     | Ativa o Plugin depois que a entrada do Plugin é carregada.           |
| `autoCapture`        | `true`      | boolean                                     | Ativa captura/revisão pós-turno em turnos de agente bem-sucedidos.   |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Enfileira propostas ou escreve propostas seguras automaticamente.    |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Escolhe captura de correção explícita, revisor LLM, ambos ou nenhum. |
| `reviewInterval`     | `15`        | `1..200`                                    | Executa o revisor após este número de turnos bem-sucedidos.          |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Executa o revisor após este número de chamadas de ferramenta observadas. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Tempo limite para a execução do revisor incorporado.                 |
| `maxPending`         | `50`        | `1..200`                                    | Máximo de propostas pendentes/em quarentena mantidas por workspace.  |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Tamanho máximo de arquivo de Skill/suporte gerado.                   |

Perfis recomendados:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Caminhos de captura

Skill Workshop tem três caminhos de captura.

### Sugestões de ferramenta

O modelo pode chamar `skill_workshop` diretamente quando vê um procedimento reutilizável
ou quando o usuário pede para salvar/atualizar uma Skill.

Este é o caminho mais explícito e funciona mesmo com `autoCapture: false`.

### Captura heurística

Quando `autoCapture` está ativado e `reviewMode` é `heuristic` ou `hybrid`, o
Plugin examina turnos bem-sucedidos em busca de frases explícitas de correção do usuário:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

A heurística cria uma proposta a partir da instrução mais recente do usuário que corresponder. Ela
usa dicas de tópico para escolher nomes de Skills para fluxos de trabalho comuns:

- tarefas de GIF animado -> `animated-gif-workflow`
- tarefas de captura de tela ou recursos -> `screenshot-asset-workflow`
- tarefas de QA ou cenário -> `qa-scenario-workflow`
- tarefas de PR do GitHub -> `github-pr-workflow`
- fallback -> `learned-workflows`

A captura heurística é intencionalmente estreita. Ela é para correções claras e
notas de processo repetíveis, não para sumarização geral de transcrições.

### Revisor LLM

Quando `autoCapture` está ativado e `reviewMode` é `llm` ou `hybrid`, o Plugin
executa um revisor compacto incorporado após os limites serem atingidos.

O revisor recebe:

- o texto recente da transcrição, limitado aos últimos 12.000 caracteres
- até 12 Skills existentes do workspace
- até 2.000 caracteres de cada Skill existente
- instruções somente JSON

O revisor não tem ferramentas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

O revisor retorna `{ "action": "none" }` ou uma proposta. O campo `action` é `create`, `append` ou `replace` - prefira `append`/`replace` quando uma Skill relevante já existir; use `create` apenas quando nenhuma Skill existente se encaixar.

Exemplo de `create`:

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

`append` adiciona `section` + `body`. `replace` troca `oldText` por `newText` na Skill nomeada.

## Ciclo de vida da proposta

Toda atualização gerada vira uma proposta com:

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

Status de propostas:

- `pending` - aguardando aprovação
- `applied` - escrita em `<workspace>/skills`
- `rejected` - rejeitada pelo operador/modelo
- `quarantined` - bloqueada por achados críticos do scanner

O estado é armazenado por espaço de trabalho no diretório de estado do Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Propostas pendentes e em quarentena são desduplicadas por nome da skill e payload
de alteração. O armazenamento mantém as propostas pendentes/em quarentena mais recentes até
`maxPending`.

## Referência da ferramenta

O plugin registra uma ferramenta de agente:

```text
skill_workshop
```

### `status`

Conta propostas por estado para o espaço de trabalho ativo.

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

Valores válidos de `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Lista propostas em quarentena.

```json
{ "action": "list_quarantine" }
```

Use isto quando a captura automática parecer não fazer nada e os logs mencionarem
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

Cria uma proposta. Com `approvalPolicy: "pending"` (padrão), isto enfileira em vez de escrever.

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

<AccordionGroup>
  <Accordion title="Request immediate write in auto mode (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Com `approvalPolicy: "pending"`, `apply: true` ainda enfileira a proposta. Revise-a e então use
a ação `apply` após a aprovação.

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Aplica uma proposta pendente.

Com `approvalPolicy: "pending"`, esta ação solicita aprovação do operador antes de escrever a
skill do espaço de trabalho.

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

Escreve um arquivo de suporte dentro de um diretório de skill existente ou proposto.

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

Os arquivos de suporte têm escopo de workspace, passam por verificação de caminho, são limitados em bytes por
`maxSkillBytes`, escaneados e gravados atomicamente.

## Escritas de Skills

Skill Workshop grava apenas em:

```text
<workspace>/skills/<normalized-skill-name>/
```

Os nomes das Skills são normalizados:

- convertidos para minúsculas
- sequências não `[a-z0-9_-]` viram `-`
- não alfanuméricos no início/fim são removidos
- o comprimento máximo é 80 caracteres
- o nome final deve corresponder a `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- se a skill não existir, Skill Workshop grava um novo `SKILL.md`
- se ela já existir, Skill Workshop acrescenta o corpo a `## Workflow`

Para `append`:

- se a skill existir, Skill Workshop acrescenta à seção solicitada
- se ela não existir, Skill Workshop cria uma skill mínima e então acrescenta

Para `replace`:

- a skill já deve existir
- `oldText` deve estar presente exatamente
- apenas a primeira correspondência exata é substituída

Todas as gravações são atômicas e atualizam imediatamente o snapshot de skills em memória, para que
a skill nova ou atualizada possa ficar visível sem reiniciar o Gateway.

## Modelo de segurança

Skill Workshop tem um scanner de segurança para conteúdo gerado de `SKILL.md` e arquivos de suporte.

Achados críticos colocam propostas em quarentena:

| ID da regra                            | Bloqueia conteúdo que...                                             |
| -------------------------------------- | -------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | instrui o agente a ignorar instruções anteriores/superiores          |
| `prompt-injection-system`              | referencia prompts do sistema, mensagens de desenvolvedor ou instruções ocultas |
| `prompt-injection-tool`                | incentiva contornar permissão/aprovação de ferramenta                |
| `shell-pipe-to-shell`                  | inclui `curl`/`wget` redirecionado para `sh`, `bash` ou `zsh`        |
| `secret-exfiltration`                  | parece enviar dados de env/process env pela rede                     |

Achados de aviso são mantidos, mas não bloqueiam por si só:

| ID da regra          | Avisa sobre...                    |
| -------------------- | --------------------------------- |
| `destructive-delete` | comandos amplos no estilo `rm -rf` |
| `unsafe-permissions` | uso de permissões no estilo `chmod 777` |

Propostas em quarentena:

- mantêm `scanFindings`
- mantêm `quarantineReason`
- aparecem em `list_quarantine`
- não podem ser aplicadas por meio de `apply`

Para se recuperar de uma proposta em quarentena, crie uma nova proposta segura com o
conteúdo inseguro removido. Não edite o JSON do armazenamento manualmente.

## Orientação de prompt

Quando ativado, Skill Workshop injeta uma seção curta de prompt que instrui o agente
a usar `skill_workshop` para memória procedural durável.

A orientação enfatiza:

- procedimentos, não fatos/preferências
- correções do usuário
- procedimentos bem-sucedidos não óbvios
- armadilhas recorrentes
- reparo de skill desatualizada/fraca/incorreta por append/replace
- salvar procedimento reutilizável depois de longos ciclos com ferramentas ou correções difíceis
- texto curto e imperativo para skills
- nenhum despejo de transcrição

O texto do modo de escrita muda conforme `approvalPolicy`:

- modo pendente: enfileirar sugestões; usar `apply` após aprovação explícita
- modo automático: aplicar atualizações seguras de skills do workspace, a menos que `apply: false` enfileire em vez disso

## Custos e comportamento em runtime

A captura heurística não chama um modelo.

A revisão por LLM usa uma execução embutida no modelo ativo/padrão do agente. Ela é
baseada em limite, então não roda em todos os turnos por padrão.

O revisor:

- usa o mesmo contexto configurado de provedor/modelo quando disponível
- recorre aos padrões do agente em runtime
- tem `reviewTimeoutMs`
- usa contexto leve de bootstrap
- não tem ferramentas
- não grava nada diretamente
- só pode emitir uma proposta que passa pelo scanner normal e pelo caminho de
  aprovação/quarentena

Se o revisor falhar, exceder o tempo limite ou retornar JSON inválido, o plugin registra uma
mensagem de aviso/debug e ignora essa passagem de revisão.

## Padrões operacionais

Use Skill Workshop quando o usuário disser:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

Bom texto de skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Texto ruim de skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Motivos pelos quais a versão ruim não deve ser salva:

- tem formato de transcrição
- não é imperativa
- inclui detalhes pontuais ruidosos
- não diz ao próximo agente o que fazer

## Depuração

Verifique se o plugin está carregado:

```bash
openclaw plugins list --enabled
```

Verifique contagens de propostas a partir de um contexto de agente/ferramenta:

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

| Sintoma                               | Causa provável                                                                      | Verificação                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| A ferramenta está indisponível        | A entrada do plugin não está ativada                                                | `plugins.entries.skill-workshop.enabled` e `openclaw plugins list` |
| Nenhuma proposta automática aparece   | `autoCapture: false`, `reviewMode: "off"` ou limites não atingidos                  | Configuração, status da proposta, logs do Gateway                    |
| A heurística não capturou             | A redação do usuário não correspondeu aos padrões de correção                       | Use `skill_workshop.suggest` explícito ou ative o revisor LLM        |
| O revisor não criou uma proposta      | O revisor retornou `none`, JSON inválido ou excedeu o tempo limite                  | Logs do Gateway, `reviewTimeoutMs`, limites                          |
| A proposta não foi aplicada           | `approvalPolicy: "pending"`                                                        | `list_pending`, depois `apply`                                       |
| A proposta desapareceu de pendentes   | Proposta duplicada reutilizada, poda por máximo de pendentes, ou foi aplicada/rejeitada/quarentenada | `status`, `list_pending` com filtros de status, `list_quarantine` |
| O arquivo de skill existe, mas o modelo não o vê | O snapshot de skills não foi atualizado ou o gating de skills o exclui             | status de `openclaw skills` e elegibilidade da skill do workspace    |

Logs relevantes:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Cenários de QA

Cenários de QA baseados no repositório:

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

O cenário do revisor é intencionalmente separado porque ativa
`reviewMode: "llm"` e exercita a passagem embutida do revisor.

## Quando não ativar aplicação automática

Evite `approvalPolicy: "auto"` quando:

- o workspace contém procedimentos sensíveis
- o agente está trabalhando com entrada não confiável
- skills são compartilhadas por uma equipe ampla
- você ainda está ajustando prompts ou regras do scanner
- o modelo lida com frequência com conteúdo hostil da web/e-mail

Use o modo pendente primeiro. Mude para o modo automático somente depois de revisar o tipo de
skills que o agente propõe nesse workspace.

## Docs relacionadas

- [Skills](/pt-BR/tools/skills)
- [Plugins](/pt-BR/tools/plugin)
- [Testes](/pt-BR/reference/test)
