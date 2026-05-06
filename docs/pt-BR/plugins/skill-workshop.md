---
read_when:
    - Você quer que os agentes transformem correções ou procedimentos reutilizáveis em Skills do espaço de trabalho
    - Você está configurando a memória procedural de habilidades
    - Você está depurando o comportamento da ferramenta `skill_workshop`
    - Você está decidindo se deve ativar a criação automática de Skills
summary: Captura experimental de procedimentos reutilizáveis como Skills do espaço de trabalho com revisão, aprovação, quarentena e atualização a quente de Skills
title: Plugin de oficina de Skills
x-i18n:
    generated_at: "2026-05-06T09:09:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Workshop de Skills é **experimental**. Ele é desativado por padrão, suas heurísticas de captura e prompts de revisão podem mudar entre versões, e gravações automáticas devem ser usadas somente em workspaces confiáveis, depois de revisar primeiro a saída do modo pendente.

Workshop de Skills é memória procedural para skills do workspace. Ele permite que um agente transforme fluxos de trabalho reutilizáveis, correções do usuário, correções conquistadas com esforço e armadilhas recorrentes em arquivos `SKILL.md` em:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Isso é diferente de memória de longo prazo:

- **Memória** armazena fatos, preferências, entidades e contexto passado.
- **Skills** armazenam procedimentos reutilizáveis que o agente deve seguir em tarefas futuras.
- **Workshop de Skills** é a ponte de um turno útil para uma skill durável do workspace, com verificações de segurança e aprovação opcional.

Workshop de Skills é útil quando o agente aprende um procedimento como:

- como validar assets de GIF animado obtidos externamente
- como substituir assets de captura de tela e verificar dimensões
- como executar um cenário de QA específico do repositório
- como depurar uma falha recorrente de provedor
- como reparar uma nota de fluxo de trabalho local obsoleta

Ele não se destina a:

- fatos como "o usuário gosta de azul"
- memória autobiográfica ampla
- arquivamento bruto de transcrições
- segredos, credenciais ou texto de prompt oculto
- instruções pontuais que não se repetirão

## Estado padrão

O plugin incluído é **experimental** e **desativado por padrão**, a menos que seja explicitamente habilitado em `plugins.entries.skill-workshop`.

O manifesto do plugin não define `enabledByDefault: true`. O padrão `enabled: true` dentro do esquema de configuração do plugin se aplica somente depois que a entrada do plugin já foi selecionada e carregada.

Experimental significa:

- o plugin tem suporte suficiente para testes opt-in e dogfooding
- armazenamento de propostas, limites de revisão e heurísticas de captura podem evoluir
- aprovação pendente é o modo inicial recomendado
- aplicação automática é para configurações pessoais/de workspace confiáveis, não para ambientes compartilhados ou hostis com muito input

## Habilitar

Configuração segura mínima:

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
- passagens do revisor baseadas em limites podem propor atualizações de skill
- nenhum arquivo de skill é gravado até que uma proposta pendente seja aplicada

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

`approvalPolicy: "auto"` ainda usa o mesmo scanner e caminho de quarentena. Ele não aplica propostas com achados críticos.

## Configuração

| Chave                | Padrão     | Intervalo / valores                         | Significado                                                         |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Habilita o plugin depois que a entrada do plugin é carregada.        |
| `autoCapture`        | `true`      | boolean                                     | Habilita captura/revisão pós-turno em turnos bem-sucedidos do agente. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Enfileira propostas ou grava propostas seguras automaticamente.      |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Escolhe captura de correção explícita, revisor LLM, ambos ou nenhum. |
| `reviewInterval`     | `15`        | `1..200`                                    | Executa o revisor após este número de turnos bem-sucedidos.          |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Executa o revisor após este número de chamadas de ferramenta observadas. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Tempo limite para a execução do revisor embutido.                    |
| `maxPending`         | `50`        | `1..200`                                    | Máximo de propostas pendentes/em quarentena mantidas por workspace.  |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Tamanho máximo gerado para arquivo de skill/suporte.                 |

Perfis recomendados:

```json5
// Conservador: apenas uso explícito da ferramenta, sem captura automática.
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

Workshop de Skills tem três caminhos de captura.

### Sugestões de ferramenta

O modelo pode chamar `skill_workshop` diretamente quando vê um procedimento reutilizável ou quando o usuário pede para salvar/atualizar uma skill.

Este é o caminho mais explícito e funciona mesmo com `autoCapture: false`.

### Captura heurística

Quando `autoCapture` está habilitado e `reviewMode` é `heuristic` ou `hybrid`, o plugin escaneia turnos bem-sucedidos em busca de frases explícitas de correção do usuário:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

A heurística cria uma proposta a partir da instrução mais recente do usuário que corresponder. Ela usa dicas de tópico para escolher nomes de skill para fluxos de trabalho comuns:

- tarefas de GIF animado -> `animated-gif-workflow`
- tarefas de captura de tela ou asset -> `screenshot-asset-workflow`
- tarefas de QA ou cenário -> `qa-scenario-workflow`
- tarefas de PR do GitHub -> `github-pr-workflow`
- fallback -> `learned-workflows`

A captura heurística é intencionalmente estreita. Ela serve para correções claras e notas de processo repetíveis, não para sumarização geral de transcrições.

### Revisor LLM

Quando `autoCapture` está habilitado e `reviewMode` é `llm` ou `hybrid`, o plugin executa um revisor embutido compacto depois que os limites são atingidos.

O revisor recebe:

- o texto da transcrição recente, limitado aos últimos 12.000 caracteres
- até 12 skills existentes do workspace
- até 2.000 caracteres de cada skill existente
- instruções somente em JSON

O revisor não tem ferramentas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

O revisor retorna `{ "action": "none" }` ou uma proposta. O campo `action` é `create`, `append` ou `replace` - prefira `append`/`replace` quando uma skill relevante já existir; use `create` somente quando nenhuma skill existente servir.

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

`append` adiciona `section` + `body`. `replace` troca `oldText` por `newText` na skill nomeada.

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

Status de proposta:

- `pending` - aguardando aprovação
- `applied` - gravado em `<workspace>/skills`
- `rejected` - rejeitado pelo operador/modelo
- `quarantined` - bloqueado por achados críticos do scanner

O estado é armazenado por workspace no diretório de estado do Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Propostas pendentes e em quarentena são deduplicadas por nome da skill e payload
de alteração. O armazenamento mantém as propostas pendentes/em quarentena mais recentes até
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

Cria uma proposta. Com `approvalPolicy: "pending"` (padrão), isto enfileira em vez de gravar.

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
  <Accordion title="Force a safe write (apply: true)">

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

Grava um arquivo de suporte dentro de um diretório de skill existente ou proposto.

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

Arquivos de suporte são escopados ao workspace, verificados por caminho, limitados por bytes por
`maxSkillBytes`, escaneados e escritos de forma atômica.

## Escritas de Skills

Skill Workshop escreve apenas em:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nomes de Skills são normalizados:

- convertidos para minúsculas
- sequências que não são `[a-z0-9_-]` viram `-`
- caracteres não alfanuméricos no início/fim são removidos
- o tamanho máximo é de 80 caracteres
- o nome final deve corresponder a `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- se a skill não existir, Skill Workshop escreve um novo `SKILL.md`
- se ela já existir, Skill Workshop acrescenta o corpo a `## Workflow`

Para `append`:

- se a skill existir, Skill Workshop acrescenta à seção solicitada
- se ela não existir, Skill Workshop cria uma skill mínima e então acrescenta

Para `replace`:

- a skill já deve existir
- `oldText` deve estar presente exatamente
- apenas a primeira correspondência exata é substituída

Todas as escritas são atômicas e atualizam imediatamente o snapshot de skills em memória, para que
a skill nova ou atualizada possa ficar visível sem reiniciar o Gateway.

## Modelo de segurança

Skill Workshop tem um scanner de segurança em conteúdo `SKILL.md` gerado e arquivos de
suporte.

Achados críticos colocam propostas em quarentena:

| ID da regra                            | Bloqueia conteúdo que...                                             |
| -------------------------------------- | -------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | diz ao agente para ignorar instruções anteriores/superiores          |
| `prompt-injection-system`              | referencia prompts de sistema, mensagens de desenvolvedor ou instruções ocultas |
| `prompt-injection-tool`                | incentiva contornar permissão/aprovação de ferramentas               |
| `shell-pipe-to-shell`                  | inclui `curl`/`wget` encadeado por pipe para `sh`, `bash` ou `zsh`   |
| `secret-exfiltration`                  | parece enviar dados de env/process env pela rede                     |

Achados de aviso são retidos, mas não bloqueiam por si só:

| ID da regra          | Avisa sobre...                    |
| -------------------- | --------------------------------- |
| `destructive-delete` | comandos amplos no estilo `rm -rf` |
| `unsafe-permissions` | uso de permissões no estilo `chmod 777` |

Propostas em quarentena:

- mantêm `scanFindings`
- mantêm `quarantineReason`
- aparecem em `list_quarantine`
- não podem ser aplicadas por meio de `apply`

Para recuperar de uma proposta em quarentena, crie uma nova proposta segura com o
conteúdo inseguro removido. Não edite o JSON do armazenamento manualmente.

## Orientação de prompt

Quando ativado, Skill Workshop injeta uma seção curta de prompt que orienta o agente
a usar `skill_workshop` para memória procedural durável.

A orientação enfatiza:

- procedimentos, não fatos/preferências
- correções do usuário
- procedimentos bem-sucedidos não óbvios
- armadilhas recorrentes
- reparo de skill obsoleta/fraca/incorreta por meio de append/replace
- salvar procedimento reutilizável após loops longos de ferramentas ou correções difíceis
- texto de skill curto e imperativo
- sem despejos de transcrição

O texto do modo de escrita muda com `approvalPolicy`:

- modo pendente: enfileirar sugestões; aplicar apenas após aprovação explícita
- modo automático: aplicar atualizações seguras de skills do workspace quando forem claramente reutilizáveis

## Custos e comportamento em runtime

A captura heurística não chama um modelo.

A revisão por LLM usa uma execução incorporada no modelo ativo/padrão do agente. Ela é
baseada em limiares, então, por padrão, não é executada em todos os turnos.

O revisor:

- usa o mesmo contexto de provedor/modelo configurado quando disponível
- faz fallback para os padrões do agente em runtime
- tem `reviewTimeoutMs`
- usa contexto de bootstrap leve
- não tem ferramentas
- não escreve nada diretamente
- só pode emitir uma proposta que passa pelo scanner normal e pelo caminho de
  aprovação/quarentena

Se o revisor falhar, atingir timeout ou retornar JSON inválido, o plugin registra uma
mensagem de aviso/debug e pula essa passagem de revisão.

## Padrões operacionais

Use Skill Workshop quando o usuário disser:

- "da próxima vez, faça X"
- "de agora em diante, prefira Y"
- "certifique-se de verificar Z"
- "salve isto como um workflow"
- "isso demorou um pouco; lembre-se do processo"
- "atualize a skill local para isto"

Bom texto de skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Texto de skill ruim:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Motivos pelos quais a versão ruim não deve ser salva:

- em formato de transcrição
- não é imperativa
- inclui detalhes ruidosos de caso único
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
| A ferramenta está indisponível        | A entrada do plugin não está habilitada                                             | `plugins.entries.skill-workshop.enabled` e `openclaw plugins list`   |
| Nenhuma proposta automática aparece   | `autoCapture: false`, `reviewMode: "off"` ou limiares não atendidos                 | Configuração, status da proposta, logs do Gateway                    |
| A heurística não capturou             | A redação do usuário não correspondeu aos padrões de correção                       | Use `skill_workshop.suggest` explícito ou habilite o revisor por LLM  |
| O revisor não criou uma proposta      | O revisor retornou `none`, JSON inválido ou atingiu timeout                         | Logs do Gateway, `reviewTimeoutMs`, limiares                         |
| A proposta não é aplicada             | `approvalPolicy: "pending"`                                                         | `list_pending`, depois `apply`                                       |
| A proposta desapareceu de pendentes   | Proposta duplicada reutilizada, limpeza por máximo de pendentes ou foi aplicada/rejeitada/posta em quarentena | `status`, `list_pending` com filtros de status, `list_quarantine`    |
| O arquivo da skill existe, mas o modelo não a vê | Snapshot de skill não atualizado ou gating de skills a exclui                       | status de `openclaw skills` e elegibilidade da skill do workspace    |

Logs relevantes:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Cenários de QA

Cenários de QA apoiados pelo repo:

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
- skills são compartilhadas por uma equipe ampla
- você ainda está ajustando prompts ou regras do scanner
- o modelo lida frequentemente com conteúdo hostil da web/e-mail

Use primeiro o modo pendente. Mude para o modo automático apenas após revisar o tipo de
skills que o agente propõe nesse workspace.

## Documentos relacionados

- [Skills](/pt-BR/tools/skills)
- [Plugins](/pt-BR/tools/plugin)
- [Testes](/pt-BR/reference/test)
