---
read_when:
    - Você quer que agentes transformem correções ou procedimentos reutilizáveis em Skills do workspace
    - Você está configurando memória procedural de Skills
    - Você está depurando o comportamento da ferramenta `skill_workshop`
    - Você está decidindo se deve habilitar a criação automática de Skills
summary: Captura experimental de procedimentos reutilizáveis como Skills do workspace com revisão, aprovação, quarentena e atualização dinâmica de Skills
title: Plugin Skill workshop
x-i18n:
    generated_at: "2026-04-24T06:05:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

O Skill Workshop é **experimental**. Ele vem desabilitado por padrão, suas heurísticas de captura
e prompts de revisão podem mudar entre versões, e gravações automáticas
devem ser usadas apenas em workspaces confiáveis depois de revisar primeiro a saída
do modo pendente.

Skill Workshop é memória procedural para Skills do workspace. Ele permite que um agente transforme
fluxos de trabalho reutilizáveis, correções do usuário, correções difíceis de conseguir e armadilhas recorrentes
em arquivos `SKILL.md` em:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Isso é diferente de memória de longo prazo:

- **Memory** armazena fatos, preferências, entidades e contexto passado.
- **Skills** armazenam procedimentos reutilizáveis que o agente deve seguir em tarefas futuras.
- **Skill Workshop** é a ponte entre um turno útil e uma Skill durável do workspace,
  com verificações de segurança e aprovação opcional.

O Skill Workshop é útil quando o agente aprende um procedimento como:

- como validar assets GIF animados de origem externa
- como substituir assets de captura de tela e verificar dimensões
- como executar um cenário de QA específico de um repositório
- como depurar uma falha recorrente de provider
- como reparar uma nota local de fluxo de trabalho obsoleta

Ele não foi pensado para:

- fatos como “o usuário gosta de azul”
- memória autobiográfica ampla
- arquivamento bruto de transcrição
- segredos, credenciais ou texto oculto de prompt
- instruções pontuais que não se repetirão

## Estado padrão

O Plugin incluído é **experimental** e **desabilitado por padrão**, a menos que seja
explicitamente habilitado em `plugins.entries.skill-workshop`.

O manifesto do Plugin não define `enabledByDefault: true`. O padrão `enabled: true`
dentro do schema de configuração do Plugin se aplica apenas depois que a entrada do Plugin
já tiver sido selecionada e carregada.

Experimental significa:

- o Plugin é compatível o suficiente para testes opt-in e uso interno
- armazenamento de propostas, limites do revisor e heurísticas de captura podem evoluir
- aprovação pendente é o modo inicial recomendado
- aplicação automática é para configurações pessoais/de workspace confiáveis, não para ambientes compartilhados ou com entrada pesada hostil

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
- correções reutilizáveis explícitas são enfileiradas como propostas pendentes
- passagens do revisor baseadas em limite podem propor atualizações de Skill
- nenhum arquivo de Skill é gravado até que uma proposta pendente seja aplicada

Use gravações automáticas somente em workspaces confiáveis:

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

`approvalPolicy: "auto"` ainda usa o mesmo scanner e o mesmo caminho de quarentena. Ele
não aplica propostas com achados críticos.

## Configuração

| Chave                | Padrão      | Intervalo / valores                         | Significado                                                         |
| -------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Habilita o Plugin depois que a entrada do Plugin é carregada.       |
| `autoCapture`        | `true`      | boolean                                     | Habilita captura/revisão pós-turno em turnos bem-sucedidos do agente. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Enfileira propostas ou grava propostas seguras automaticamente.     |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Escolhe captura explícita de correção, revisor LLM, ambos ou nenhum. |
| `reviewInterval`     | `15`        | `1..200`                                    | Executa o revisor após esse número de turnos bem-sucedidos.         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Executa o revisor após esse número de chamadas de ferramenta observadas. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Timeout para a execução embutida do revisor.                        |
| `maxPending`         | `50`        | `1..200`                                    | Máximo de propostas pendentes/em quarentena mantidas por workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Tamanho máximo de Skill/arquivo de suporte gerado.                  |

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
// Baixo custo: sem chamada LLM do revisor, somente frases explícitas de correção.
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
ou quando o usuário pede que ele salve/atualize uma Skill.

Esse é o caminho mais explícito e funciona mesmo com `autoCapture: false`.

### Captura heurística

Quando `autoCapture` está habilitado e `reviewMode` é `heuristic` ou `hybrid`, o
Plugin examina turnos bem-sucedidos em busca de frases explícitas de correção do usuário:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

A heurística cria uma proposta a partir da instrução do usuário correspondente mais recente. Ela
usa dicas de tópico para escolher nomes de Skill em fluxos de trabalho comuns:

- tarefas com GIF animado -> `animated-gif-workflow`
- tarefas de captura de tela ou asset -> `screenshot-asset-workflow`
- tarefas de QA ou cenário -> `qa-scenario-workflow`
- tarefas de PR do GitHub -> `github-pr-workflow`
- fallback -> `learned-workflows`

A captura heurística é intencionalmente estreita. Ela serve para correções claras e
notas de processo repetíveis, não para resumo geral de transcrição.

### Revisor LLM

Quando `autoCapture` está habilitado e `reviewMode` é `llm` ou `hybrid`, o Plugin
executa um revisor embutido compacto quando os limites são atingidos.

O revisor recebe:

- o texto recente da transcrição, limitado aos últimos 12.000 caracteres
- até 12 Skills existentes do workspace
- até 2.000 caracteres de cada Skill existente
- instruções somente em JSON

O revisor não tem ferramentas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

O revisor retorna `{ "action": "none" }` ou uma proposta. O campo `action` é `create`, `append` ou `replace` — prefira `append`/`replace` quando uma Skill relevante já existir; use `create` somente quando nenhuma Skill existente se encaixar.

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
- `rejected` - rejeitada pelo operador/modelo
- `quarantined` - bloqueada por achados críticos do scanner

O estado é armazenado por workspace no diretório de estado do Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Propostas pendentes e em quarentena são desduplicadas por nome de Skill e payload
da alteração. O armazenamento mantém as propostas pendentes/em quarentena mais recentes até
`maxPending`.

## Referência da ferramenta

O Plugin registra uma ferramenta de agente:

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

Use isso quando a captura automática aparentemente não fizer nada e os logs mencionarem
`skill-workshop: quarantined <skill>`.

### `inspect`

Busca uma proposta por ID.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Cria uma proposta. Com `approvalPolicy: "pending"` (padrão), isso entra na fila em vez de gravar.

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
  <Accordion title="Forçar uma gravação segura (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Forçar pendente sob política auto (apply: false)">

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

  <Accordion title="Acrescentar a uma seção nomeada">

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

  <Accordion title="Substituir texto exato">

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
`maxSkillBytes`, verificados por scanner e gravados atomicamente.

## Gravações de Skill

O Skill Workshop grava somente em:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nomes de Skill são normalizados:

- convertidos para minúsculas
- sequências fora de `[a-z0-9_-]` tornam-se `-`
- não alfanuméricos no início/fim são removidos
- o comprimento máximo é 80 caracteres
- o nome final deve corresponder a `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- se a Skill não existir, o Skill Workshop grava um novo `SKILL.md`
- se já existir, o Skill Workshop acrescenta o corpo a `## Workflow`

Para `append`:

- se a Skill existir, o Skill Workshop acrescenta à seção solicitada
- se não existir, o Skill Workshop cria uma Skill mínima e depois acrescenta

Para `replace`:

- a Skill já deve existir
- `oldText` deve estar presente exatamente
- somente a primeira correspondência exata é substituída

Todas as gravações são atômicas e atualizam imediatamente o snapshot em memória das Skills, de modo que
a Skill nova ou atualizada possa ficar visível sem reiniciar o Gateway.

## Modelo de segurança

O Skill Workshop tem um scanner de segurança para conteúdo gerado de `SKILL.md` e arquivos de suporte.

Achados críticos colocam propostas em quarentena:

| ID da regra                            | Bloqueia conteúdo que...                                                 |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `prompt-injection-ignore-instructions` | manda o agente ignorar instruções anteriores/superiores                  |
| `prompt-injection-system`              | referencia prompts de sistema, mensagens de developer ou instruções ocultas |
| `prompt-injection-tool`                | incentiva ignorar permissões/aprovação de ferramenta                     |
| `shell-pipe-to-shell`                  | inclui `curl`/`wget` com pipe para `sh`, `bash` ou `zsh`                 |
| `secret-exfiltration`                  | aparentemente envia dados de env/process env pela rede                   |

Achados de aviso são mantidos, mas não bloqueiam sozinhos:

| ID da regra          | Avisa sobre...                      |
| -------------------- | ----------------------------------- |
| `destructive-delete` | comandos amplos no estilo `rm -rf`  |
| `unsafe-permissions` | uso de permissões no estilo `chmod 777` |

Propostas em quarentena:

- mantêm `scanFindings`
- mantêm `quarantineReason`
- aparecem em `list_quarantine`
- não podem ser aplicadas por `apply`

Para recuperar de uma proposta em quarentena, crie uma nova proposta segura com o
conteúdo inseguro removido. Não edite o JSON de armazenamento manualmente.

## Orientação de prompt

Quando habilitado, o Skill Workshop injeta uma seção curta de prompt que informa ao agente
que deve usar `skill_workshop` para memória procedural durável.

A orientação enfatiza:

- procedimentos, não fatos/preferências
- correções do usuário
- procedimentos bem-sucedidos não óbvios
- armadilhas recorrentes
- reparo de Skill obsoleta/rasa/incorreta por append/replace
- salvar procedimento reutilizável após loops longos de ferramentas ou correções difíceis
- texto curto de Skill no imperativo
- nada de dumps de transcrição

O texto do modo de gravação muda com `approvalPolicy`:

- modo pendente: enfileira sugestões; aplica somente após aprovação explícita
- modo auto: aplica atualizações seguras de Skills do workspace quando claramente reutilizáveis

## Custos e comportamento em runtime

A captura heurística não chama um modelo.

A revisão por LLM usa uma execução embutida no modelo ativo/padrão do agente. Ela é
baseada em limites, então não é executada em todo turno por padrão.

O revisor:

- usa o mesmo contexto configurado de provider/modelo quando disponível
- recorre aos padrões do agente em runtime
- usa `reviewTimeoutMs`
- usa contexto leve de bootstrap
- não tem ferramentas
- não grava nada diretamente
- só pode emitir uma proposta que passa pelo scanner normal e pelo
  caminho de aprovação/quarentena

Se o revisor falhar, atingir timeout ou retornar JSON inválido, o Plugin registra uma
mensagem de aviso/depuração e ignora essa passagem de revisão.

## Padrões de operação

Use Skill Workshop quando o usuário disser:

- “da próxima vez, faça X”
- “de agora em diante, prefira Y”
- “certifique-se de verificar Z”
- “salve isso como um fluxo de trabalho”
- “isso levou um tempo; lembre-se do processo”
- “atualize a Skill local para isso”

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

Motivos pelos quais a versão ruim não deve ser salva:

- tem formato de transcrição
- não está no imperativo
- inclui detalhes pontuais ruidosos
- não diz ao próximo agente o que fazer

## Depuração

Verifique se o Plugin está carregado:

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

| Sintoma                               | Causa provável                                                                      | Verificar                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| A ferramenta não está disponível      | A entrada do Plugin não está habilitada                                             | `plugins.entries.skill-workshop.enabled` e `openclaw plugins list`   |
| Nenhuma proposta automática aparece   | `autoCapture: false`, `reviewMode: "off"` ou limites não atingidos                  | Configuração, status da proposta, logs do Gateway                    |
| A heurística não capturou             | O texto do usuário não correspondeu aos padrões de correção                         | Use `skill_workshop.suggest` explícito ou habilite o revisor LLM     |
| O revisor não criou uma proposta      | O revisor retornou `none`, JSON inválido ou atingiu timeout                         | Logs do Gateway, `reviewTimeoutMs`, limites                          |
| A proposta não é aplicada             | `approvalPolicy: "pending"`                                                         | `list_pending`, depois `apply`                                       |
| A proposta sumiu de pendentes         | Proposta duplicada reutilizada, poda por máximo pendente, ou foi aplicada/rejeitada/em quarentena | `status`, `list_pending` com filtros de status, `list_quarantine` |
| O arquivo de Skill existe, mas o modelo não o vê | Snapshot de Skill não foi atualizado ou o gating de Skill o exclui                | status de `openclaw skills` e elegibilidade da Skill do workspace    |

Logs relevantes:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Cenários de QA

Cenários de QA sustentados por repositório:

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
`reviewMode: "llm"` e exercita a passagem do revisor embutido.

## Quando não habilitar auto apply

Evite `approvalPolicy: "auto"` quando:

- o workspace contém procedimentos sensíveis
- o agente está trabalhando com entrada não confiável
- Skills são compartilhadas por uma equipe ampla
- você ainda está ajustando prompts ou regras do scanner
- o modelo frequentemente lida com conteúdo hostil da web/e-mail

Use primeiro o modo pendente. Mude para modo auto somente depois de revisar o tipo de
Skills que o agente propõe nesse workspace.

## Documentação relacionada

- [Skills](/pt-BR/tools/skills)
- [Plugins](/pt-BR/tools/plugin)
- [Testes](/pt-BR/reference/test)
