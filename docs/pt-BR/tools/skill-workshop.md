---
read_when:
    - Você quer que o agente crie ou atualize uma skill pelo chat
    - Você precisa revisar, aplicar, rejeitar ou colocar em quarentena um rascunho de skill gerado
    - Você está configurando a aprovação, a autonomia, o armazenamento ou os limites do Skill Workshop
sidebarTitle: Skill Workshop
summary: Crie e atualize Skills do espaço de trabalho por meio da revisão do Skill Workshop
title: Oficina de Skills
x-i18n:
    generated_at: "2026-07-12T00:27:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop é o caminho controlado do OpenClaw para criar e atualizar Skills
do espaço de trabalho. Agentes e operadores nunca escrevem `SKILL.md` diretamente por
esse caminho — eles criam uma **proposta** (rascunho pendente com conteúdo, vínculo
de destino, estado do scanner, hashes e metadados de reversão) que só se torna uma Skill
ativa quando aplicada.

O Skill Workshop grava somente Skills do espaço de trabalho. Ele nunca altera Skills
incluídas, de Plugin, do ClawHub, de raízes adicionais, gerenciadas, de agentes pessoais
ou do sistema.

## Como funciona

- **Primeiro, a proposta:** o conteúdo gerado é armazenado como `PROPOSAL.md`, não
  como `SKILL.md`.
- **A aplicação é a única gravação ativa:** criar, atualizar e revisar nunca alteram
  Skills ativas.
- **Restrito ao espaço de trabalho:** as criações têm como destino a raiz `skills/`
  do espaço de trabalho; atualizações são permitidas somente para Skills graváveis
  do espaço de trabalho.
- **Sem sobrescrita:** a criação falha se a Skill de destino já existir.
- **Vinculado por hash:** as propostas de atualização são vinculadas ao hash atual
  do destino e passam para `stale` se a Skill ativa mudar antes da aplicação.
- **Condicionado ao scanner:** a aplicação executa novamente o scanner de segurança
  antes da gravação.
- **Recuperável:** a aplicação grava metadados de reversão antes de alterar arquivos
  ativos.
- **Interfaces consistentes:** chat, CLI e Gateway usam o mesmo serviço.

## Ciclo de vida

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Somente uma proposta `pending` pode ser revisada, aplicada, rejeitada ou colocada
em quarentena.

## Curadoria do ciclo de vida

O Gateway monitora o uso agregado de Skills no banco de dados de estado compartilhado.
Uma vez por dia, ele analisa as Skills criadas e aplicadas pelo Skill Workshop. Skills
não utilizadas por mais de 30 dias passam para `stale`; após 90 dias, passam para
`archived` e deixam de ser incluídas em novos instantâneos de Skills dos agentes.
Os arquivos de Skills arquivadas permanecem inalterados no disco. Skills criadas
manualmente nunca passam por curadoria; somente Skills criadas por propostas do
Skill Workshop entram na curadoria do ciclo de vida.

Skills fixadas ignoram as transições do ciclo de vida. Uma Skill obsoleta retorna
para `active` depois de ser utilizada e da execução da próxima varredura. Skills
arquivadas retornam somente por meio de uma restauração explícita:

As transições do ciclo de vida e as restaurações se aplicam a novas sessões; sessões
em execução mantêm seu instantâneo atual de Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Todos os comandos do curador aceitam `--json`. O status também informa candidatos
determinísticos de sobreposição apenas como sugestões; ele nunca mescla Skills nem
chama um modelo.

## Chat

Peça ao agente a Skill desejada; ele chama `skill_workshop` e retorna um
identificador de proposta.

### Aprender com trabalhos recentes

Use `/learn` para transformar a conversa atual ou fontes nomeadas em uma
proposta de Skill orientada por padrões:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Sem uma solicitação, `/learn` pede ao agente que sintetize o fluxo de trabalho
reutilizável da conversa atual. Com uma solicitação, o agente trata caminhos, URLs,
notas coladas e referências à conversa como fontes, respeitando os requisitos de foco,
escopo e nomenclatura. Ele coleta as fontes com suas ferramentas existentes e então
chama `skill_workshop` com `action: "create"`.

A proposta resultante permanece `pending`; `/learn` nunca a aplica. Revise-a e
aplique-a pelo fluxo normal de aprovação ou com `openclaw skills workshop`.

Criar:

```text
Crie uma Skill chamada morning-catchup que execute minha rotina da caixa de entrada de segunda-feira.
```

Atualizar uma Skill existente do espaço de trabalho:

```text
Atualize trip-planning para também verificar os mapas de assentos antes da reserva.
```

Iterar sobre uma proposta pendente:

```text
Mostre a proposta morning-catchup.
Revise-a para também sinalizar tudo que estiver marcado como urgente.
Aplique a proposta morning-catchup.
```

As ações `apply`, `reject` e `quarantine` iniciadas pelo agente exibem uma
solicitação de aprovação por padrão. Defina `skills.workshop.approvalPolicy`
como `"auto"` para ignorá-la em ambientes confiáveis.

A solicitação identifica o ID da proposta e a Skill de destino, além de mostrar
a descrição da proposta, a quantidade de arquivos de suporte e o tamanho do corpo.
As solicitações de aprovação têm um limite para serem concluídas antes do mecanismo
de supervisão da ferramenta do agente. Se nenhuma decisão chegar antes que a
solicitação expire, a ação do ciclo de vida não será executada: a proposta permanecerá
pendente e inalterada. Decida posteriormente na interface do Skill Workshop ou execute
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Os agentes não devem
tentar novamente uma ação expirada do ciclo de vida repetidamente.

## CLI

```bash
# Criar
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Atualização diária da caixa de entrada: triar, arquivar, destacar, redigir, planejar" \
  --proposal ./PROPOSAL.md

# Atualizar uma Skill existente do espaço de trabalho
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Listar e inspecionar
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisar antes da aprovação
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Finalizar
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicada"
openclaw skills workshop quarantine <proposal-id> --reason "Requer análise de segurança"
```

Cada subcomando aceita `--agent <id>` (espaço de trabalho de destino; o padrão é
o inferido pelo diretório de trabalho atual e, depois, o agente padrão) e `--json`
(saída estruturada). `propose-create`, `propose-update` e `revise` também aceitam
`--goal <text>` e `--evidence <text>` para registrar o contexto da proposta junto
com `--proposal`.

## Conteúdo da proposta

Enquanto estiver pendente, a proposta será armazenada como `PROPOSAL.md` com
frontmatter exclusivo da proposta:

```markdown
---
name: "morning-catchup"
description: "Atualização diária da caixa de entrada: triar, arquivar, destacar, redigir, planejar"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Na aplicação, o Skill Workshop grava o `SKILL.md` ativo e remove os campos
exclusivos da proposta: `status`, `version` da proposta e `date` da proposta.

## Arquivos de suporte

Use `--proposal-dir` quando a Skill proposta precisar de arquivos ao lado de
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Resumo de sexta-feira: estatísticas, destaques e as três principais prioridades da próxima semana" \
  --proposal-dir ./weekly-update-proposal
```

O diretório deve conter `PROPOSAL.md`. Os arquivos de suporte devem ficar em
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`. O Skill
Workshop os examina, calcula seus hashes e os armazena com a proposta; somente
na aplicação eles são gravados ao lado do `SKILL.md` ativo.

Caminhos de arquivos de suporte rejeitados: caminhos absolutos, segmentos ocultos
de caminho, travessia de diretórios, caminhos sobrepostos, arquivos executáveis,
texto que não seja UTF-8, bytes nulos e caminhos fora das pastas padrão de suporte.

## Ferramenta do agente

O modelo usa `skill_workshop` com uma `action` obrigatória:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Os demais parâmetros se aplicam de acordo com a ação:

| Parâmetro                  | Usado por                                             | Observações                                                                    |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `name`                     | `create`, `inspect`, `revise`                        | Obrigatório para `create`; nos demais casos, resolve uma proposta pendente pelo nome |
| `description`              | `create`, `update`, `revise`                         | Máximo de 160 bytes                                                            |
| `skill_name`               | `update`                                             | Nome ou chave da Skill existente                                               |
| `proposal_content`         | `create`, `update`, `revise`                         | Armazenado como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes`     |
| `support_files`            | `create`, `update`, `revise`                         | Matriz de `{ path, content }`                                                   |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contexto em texto livre                                                        |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposta de destino                                                            |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opcional                                                                       |
| `query`, `status`, `limit` | `list`                                               | Filtra/pagina; máximo de 50 para `limit`, padrão de 20                          |

Os agentes devem usar `skill_workshop` para trabalhos de Skills geradas. Eles não
devem criar nem alterar arquivos de propostas por meio de `write`, `edit`, `exec`,
comandos do shell ou operações diretas no sistema de arquivos.

<Note>
`skill_workshop` é uma ferramenta integrada do agente e está incluída em
`tools.profile: "coding"`. Se uma política mais restritiva a ocultar, adicione
`skill_workshop` à lista `tools.allow` ativa ou use
`tools.alsoAllow: ["skill_workshop"]` quando o escopo usar um perfil sem uma
lista `tools.allow` explícita. Execuções em sandbox não constroem a ferramenta
Skill Workshop no lado do host; portanto, execute as ações de revisão de propostas
em uma sessão normal do agente no lado do host ou pela CLI.
</Note>

## Skills sugeridas

O OpenClaw detecta instruções duradouras como “da próxima vez”, “lembre-se de” e correções reativas
quando um turno interativo termina, incluindo turnos com falha. No turno seguinte, o agente oferece
salvar o fluxo de trabalho detectado mais recente por meio de `skill_workshop`; o usuário decide se
deseja criar uma proposta. Essa sugestão integrada não cria nem altera uma Skill por si só. Ative
`skills.workshop.autonomous.enabled` para criar diretamente propostas pendentes.

## Aprovação e autonomia

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Configuração               | Padrão      | Efeito                                                                                                                                                                            |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | Cria diretamente propostas pendentes em vez de oferecer o fluxo de trabalho detectado mais recente no turno seguinte.                                                             |
| `allowSymlinkTargetWrites` | `false`     | Permite que a aplicação grave por meio de links simbólicos de Skills do espaço de trabalho cujo destino real esteja listado em `skills.load.allowSymlinkTargets`.                  |
| `approvalPolicy`           | `"pending"` | `"pending"` exige uma solicitação de aprovação antes de `apply`, `reject` ou `quarantine` iniciados pelo agente. `"auto"` ignora a solicitação (o agente ainda precisa chamar a ação). |
| `maxPending`               | `50`        | Limita as propostas pendentes e em quarentena por espaço de trabalho (1–200).                                                                                                     |
| `maxSkillBytes`            | `40000`     | Limita o tamanho do corpo da proposta em bytes (1024–200000).                                                                                                                     |

A captura autônoma reconhece regras prospectivas (por exemplo, “de agora em diante”) e
correções reativas (por exemplo, “não foi isso que eu pedi”). Ela agrupa novas instruções
por tópico em até três propostas por turno, encaminha correspondências de vocabulário
para Skills graváveis existentes no espaço de trabalho e revisa sua própria proposta
pendente quando outra correção tem como destino a mesma Skill.

As descrições das propostas são sempre limitadas a 160 bytes, independentemente de
`maxSkillBytes`.

## Métodos do Gateway

| Método                             | Escopo            |
| ---------------------------------- | ----------------- |
| `skills.proposals.list`            | `operator.read`   |
| `skills.proposals.inspect`         | `operator.read`   |
| `skills.proposals.create`          | `operator.admin`  |
| `skills.proposals.update`          | `operator.admin`  |
| `skills.proposals.revise`          | `operator.admin`  |
| `skills.proposals.requestRevision` | `operator.admin`  |
| `skills.proposals.apply`           | `operator.admin`  |
| `skills.proposals.reject`          | `operator.admin`  |
| `skills.proposals.quarantine`      | `operator.admin`  |
| `skills.curator.status`            | `operator.read`   |
| `skills.curator.pin`               | `operator.admin`  |
| `skills.curator.unpin`             | `operator.admin`  |
| `skills.curator.restore`           | `operator.admin`  |

`requestRevision` está disponível apenas no Gateway (sem equivalente na CLI ou nas ferramentas do agente): ele
encaminha instruções de revisão em texto livre para a sessão de chat do agente responsável,
em vez de substituir `PROPOSAL.md` diretamente, para interfaces que solicitam ao agente que
faça a revisão em vez de enviar literalmente um novo conteúdo.

## Armazenamento

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Diretório de estado padrão: `~/.openclaw`.

- `proposal.json`: registro canônico da proposta.
- `proposals.json`: índice de listagem rápida, recriável a partir das pastas de propostas.
- `PROPOSAL.md`: proposta de Skill pendente.
- `rollback.json`: metadados de recuperação gravados antes que a aplicação altere os arquivos ativos.

## Limites

| Limite                          | Valor                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- |
| Descrição                       | 160 bytes                                                              |
| Corpo da proposta               | `skills.workshop.maxSkillBytes` (padrão: 40.000; limite máximo: 1 MiB) |
| Arquivos de suporte             | 64 por proposta                                                        |
| Tamanho dos arquivos de suporte | 256 KiB cada, 2 MiB no total                                           |
| Propostas pendentes + em quarentena | `skills.workshop.maxPending` por espaço de trabalho (padrão: 50)   |

## Solução de problemas

| Problema                                       | Resolução                                                                                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Reduza `description` para 160 bytes ou menos.                                                                                                                                                                                   |
| `Skill proposal content is too large`          | Reduza o corpo da proposta ou aumente `skills.workshop.maxSkillBytes`.                                                                                                                                                          |
| `Target skill changed after proposal creation` | Revise a proposta em relação ao destino atual ou crie uma nova proposta.                                                                                                                                                        |
| `Proposal scan failed`                         | Inspecione as constatações do scanner e, em seguida, revise ou coloque a proposta em quarentena.                                                                                                                                |
| `untrusted symlink target`                     | Configure `skills.load.allowSymlinkTargets` e habilite `skills.workshop.allowSymlinkTargetWrites` somente para raízes de Skills compartilhadas intencionalmente.                                                                |
| `Support file paths must be under one of...`   | Mova os arquivos de suporte para `assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.                                                                                                                             |
| A proposta não aparece na lista                | Verifique o espaço de trabalho selecionado por `--agent` e `OPENCLAW_STATE_DIR`.                                                                                                                                                |
| O agente não consegue chamar `skill_workshop`  | Verifique a política de ferramentas ativa e o modo de execução. `coding` inclui a ferramenta; políticas restritivas de `tools.allow` devem listá-la explicitamente, e execuções em sandbox devem usar uma sessão normal de agente no host ou a CLI. |

### Diagnóstico da política de ferramentas

Quando a captura autônoma está habilitada, `openclaw doctor` executa a verificação
`core/doctor/skill-workshop-tool-policy` para o agente padrão. Se a política
ocultar `skill_workshop`, o aviso indicará a primeira camada de configuração que
a exclui e a alteração exata necessária em `allow` ou `alsoAllow`. Guias operacionais
mais antigos ainda podem usar `openclaw plugins inspect skill-workshop`; agora, esse
comando explica que o Skill Workshop é integrado e exibe a mesma dica de política
quando aplicável.

## Relacionado

- [Skills](/pt-BR/tools/skills) para ordem de carregamento, precedência e visibilidade
- [Criação de Skills](/pt-BR/tools/creating-skills) para os conceitos básicos de um `SKILL.md`
  escrito manualmente
- [Configuração de Skills](/pt-BR/tools/skills-config) para o esquema completo de `skills.workshop`
- [CLI de Skills](/pt-BR/cli/skills) para os comandos `openclaw skills`
