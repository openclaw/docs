---
read_when:
    - Você quer que o agente crie ou atualize uma skill a partir do chat
    - Você precisa revisar, aplicar, rejeitar ou colocar em quarentena um rascunho de skill gerado
    - Você está configurando aprovação, autonomia, armazenamento ou limites do Skill Workshop
sidebarTitle: Skill Workshop
summary: Crie e atualize Skills do espaço de trabalho por meio da revisão do Skill Workshop
title: Workshop de Skills
x-i18n:
    generated_at: "2026-06-27T18:18:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

A Oficina de Skills é o caminho governado do OpenClaw para criar e atualizar
skills de workspace.

Agentes e operadores não escrevem arquivos `SKILL.md` ativos diretamente por
este caminho. Eles criam uma **proposta** primeiro. Uma proposta é um rascunho
pendente que contém o conteúdo de skill proposto, a vinculação de destino, o
estado do scanner, hashes, metadados de arquivos de suporte e metadados de
rollback. Ela só se torna uma skill ativa quando aplicada.

A Oficina de Skills escreve apenas skills de workspace. Ela não modifica skills
empacotadas, de plugin, do ClawHub, de raiz extra, gerenciadas, de agente
pessoal ou de sistema.

## Como funciona

- **Proposta primeiro:** o conteúdo de skill gerado é armazenado como
  `PROPOSAL.md`, não `SKILL.md`.
- **Aplicar é a única escrita ativa:** criar, atualizar e revisar não alteram
  skills ativas.
- **Escopo de workspace:** criações têm como destino a raiz `skills/` do
  workspace. Atualizações são permitidas apenas para skills de workspace
  graváveis.
- **Sem sobrescrita:** a criação falha se a skill de destino já existir.
- **Vinculado por hash:** propostas de atualização se vinculam ao hash atual do
  destino e ficam obsoletas se a skill ativa mudar antes da aplicação.
- **Controlado por scanner:** a aplicação executa a varredura novamente antes de
  escrever.
- **Recuperável:** a aplicação escreve metadados de rollback antes de alterar
  arquivos ativos.
- **Superfícies consistentes:** chat, CLI e Gateway chamam o mesmo serviço da
  Oficina de Skills.

## Ciclo de vida

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Somente propostas `pending` podem ser revisadas, aplicadas, rejeitadas ou
colocadas em quarentena.

## Chat

Peça ao agente a skill que você quer. O agente chama `skill_workshop` e retorna
um id de proposta.

Criar:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Atualizar uma skill de workspace existente:

```text
Update trip-planning to also check seat maps before booking.
```

Iterar em uma proposta pendente:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Por padrão, `apply`, `reject` e `quarantine` iniciados por agente exibem um
prompt de aprovação antes de executar. Defina `skills.workshop.approvalPolicy`
como `"auto"` para pular o prompt em ambientes confiáveis.

## CLI

Criar uma nova proposta de skill:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Criar uma proposta de atualização para uma skill de workspace existente:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Listar e inspecionar:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Revisar antes da aprovação:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Encerrar a proposta:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Conteúdo da proposta

Enquanto pendente, a proposta é armazenada como `PROPOSAL.md` com frontmatter
exclusivo de proposta:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Ao aplicar, a Oficina de Skills escreve o `SKILL.md` ativo e remove campos
exclusivos de proposta: `status`, `version` da proposta e `date` da proposta.

## Arquivos de suporte

Use `--proposal-dir` quando a skill proposta precisar de arquivos ao lado de
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

O diretório deve conter `PROPOSAL.md`. Arquivos de suporte devem ficar em:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

A Oficina de Skills varre, gera hash e armazena arquivos de suporte com a
proposta. Eles são escritos ao lado do `SKILL.md` ativo apenas na aplicação.

Caminhos de arquivos de suporte rejeitados incluem caminhos absolutos, segmentos
de caminho ocultos, travessia de caminho, caminhos sobrepostos, arquivos
executáveis de diretórios de proposta, texto não UTF-8, bytes nulos e arquivos
fora das pastas padrão de suporte.

## Ferramenta do agente

O modelo usa `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Agentes devem usar `skill_workshop` para trabalho de skill gerado. Eles não
devem criar nem alterar arquivos de proposta por meio de `write`, `edit`,
`exec`, comandos de shell ou operações diretas no sistema de arquivos.

<Note>
`skill_workshop` é uma ferramenta integrada de agente e está incluída em
`tools.profile: "coding"`. Se uma política mais estrita a ocultar, adicione
`skill_workshop` à lista ativa `tools.allow`, ou use
`tools.alsoAllow: ["skill_workshop"]` quando o escopo usa um perfil sem um
`tools.allow` explícito. Execuções em sandbox não constroem a ferramenta
Skill Workshop do lado do host, portanto execute ações de revisão de proposta a
partir de uma sessão normal de agente do lado do host ou da CLI.
</Note>

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

- `autonomous.enabled`: permite que o OpenClaw crie propostas pendentes a partir
  de sinais duráveis de conversa após turnos bem-sucedidos. Padrão: `false`.
- `allowSymlinkTargetWrites`: permite que a aplicação escreva por meio de
  symlinks de skill de workspace cujo destino real esteja listado em
  `skills.load.allowSymlinkTargets`. Padrão: `false`.
- `approvalPolicy: "pending"`: exige um prompt de aprovação antes de `apply`,
  `reject` ou `quarantine` iniciados por agente.
- `approvalPolicy: "auto"`: pula esse prompt de aprovação. O agente ainda deve
  chamar a ação.
- `maxPending`: limita propostas pendentes e em quarentena por workspace.
- `maxSkillBytes`: limita o tamanho do corpo da proposta. Padrão: `40000`.

Descrições de propostas são sempre limitadas a 160 bytes.

## Métodos do Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Métodos somente leitura exigem `operator.read`. Métodos de mutação exigem
`operator.admin`.

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
- `proposals.json`: índice de listagem rápida, reconstruível a partir das pastas
  de propostas.
- `PROPOSAL.md`: proposta de skill pendente.
- `rollback.json`: metadados de recuperação escritos antes de a aplicação
  alterar arquivos ativos.

## Limites

- Descrição: 160 bytes.
- Corpo da proposta: `skills.workshop.maxSkillBytes` (padrão 40.000).
- Arquivos de suporte: 64 por proposta.
- Tamanho de arquivo de suporte: 256 KB cada, 2 MB no total.
- Propostas pendentes e em quarentena: `skills.workshop.maxPending` por
  workspace (padrão 50).

## Solução de problemas

| Problema                                       | Resolução                                                                                                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Reduza `description` para 160 bytes ou menos.                                                                                                                                                              |
| `Skill proposal content is too large`          | Reduza o corpo da proposta ou aumente `skills.workshop.maxSkillBytes`.                                                                                                                                     |
| `Target skill changed after proposal creation` | Revise a proposta em relação ao destino atual, ou crie uma nova proposta.                                                                                                                                  |
| `Proposal scan failed`                         | Inspecione os achados do scanner e então revise ou coloque a proposta em quarentena.                                                                                                                       |
| `untrusted symlink target`                     | Configure `skills.load.allowSymlinkTargets` e habilite `skills.workshop.allowSymlinkTargetWrites` apenas para raízes de skill compartilhadas intencionais.                                                 |
| `Support file paths must be under one of...`   | Mova arquivos de suporte para `assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.                                                                                                           |
| A proposta não aparece na lista                | Verifique o workspace `--agent` selecionado e `OPENCLAW_STATE_DIR`.                                                                                                                                        |
| O agente não consegue chamar `skill_workshop`  | Verifique a política de ferramentas ativa e o modo de execução. `coding` inclui a ferramenta; políticas restritivas de `tools.allow` devem listá-la explicitamente, e execuções em sandbox devem usar uma sessão normal de agente do lado do host ou a CLI. |

## Relacionados

- [Skills](/pt-BR/tools/skills) para ordem de carregamento, precedência e visibilidade
- [Criando skills](/pt-BR/tools/creating-skills) para o básico de `SKILL.md` escrito
  manualmente
- [Configuração de Skills](/pt-BR/tools/skills-config) para o esquema completo
  `skills.workshop`
- [CLI de Skills](/pt-BR/cli/skills) para comandos `openclaw skills`
