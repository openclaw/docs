---
read_when:
    - Você quer que o agente crie ou atualize uma skill pelo chat
    - Você precisa revisar, aplicar, rejeitar ou colocar em quarentena um rascunho de skill gerado
    - Você está configurando a aprovação, a autonomia, o armazenamento ou os limites do Workshop de Skills
sidebarTitle: Skill Workshop
summary: Crie e atualize Skills do espaço de trabalho por meio da revisão do Skill Workshop
title: Oficina de Skills
x-i18n:
    generated_at: "2026-07-12T15:51:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

O Skill Workshop é o caminho controlado do OpenClaw para criar e atualizar
Skills do espaço de trabalho. Agentes e operadores nunca gravam `SKILL.md`
diretamente por esse caminho — eles criam uma **proposta** (rascunho pendente
com conteúdo, vinculação de destino, estado do scanner, hashes e metadados de
reversão) que se torna uma Skill ativa somente quando aplicada.

O Skill Workshop grava apenas Skills do espaço de trabalho. Ele nunca modifica
Skills integradas, de Plugin, do ClawHub, de raízes extras, gerenciadas, de
agentes pessoais ou do sistema.

## Como funciona

- **Primeiro, a proposta:** o conteúdo gerado é armazenado como `PROPOSAL.md`,
  não como `SKILL.md`.
- **A aplicação é a única gravação ativa:** criar, atualizar e revisar nunca
  alteram Skills ativas.
- **Escopo do espaço de trabalho:** as criações têm como destino a raiz
  `skills/` do espaço de trabalho; atualizações são permitidas apenas para
  Skills graváveis do espaço de trabalho.
- **Sem sobrescrita:** a criação falha se a Skill de destino já existir.
- **Vinculada por hash:** propostas de atualização são vinculadas ao hash atual
  do destino e passam para `stale` se a Skill ativa mudar antes da aplicação.
- **Controlada pelo scanner:** a aplicação executa novamente o scanner de
  segurança antes da gravação.
- **Recuperável:** a aplicação grava metadados de reversão antes de modificar
  arquivos ativos.
- **Superfícies consistentes:** chat, CLI e Gateway chamam o mesmo serviço.

## Ciclo de vida

```text
criar/atualizar -> pendente
revisar         -> pendente
aplicar         -> aplicada
rejeitar        -> rejeitada
colocar em quarentena -> em quarentena
alteração do destino  -> desatualizada
```

Somente uma proposta `pending` pode ser revisada, aplicada, rejeitada ou
colocada em quarentena.

## Curadoria do ciclo de vida

O Gateway acompanha o uso agregado das Skills no banco de dados de estado
compartilhado. Uma vez por dia, ele analisa as Skills criadas e aplicadas pelo
Skill Workshop. Skills não usadas por mais de 30 dias passam para `stale`;
após 90 dias, passam para `archived` e são excluídas de novos snapshots de
Skills dos agentes. Os arquivos das Skills arquivadas permanecem inalterados
no disco. Skills criadas manualmente nunca passam por curadoria; somente Skills
criadas por propostas do Skill Workshop entram na curadoria do ciclo de vida.

Skills fixadas ignoram as transições do ciclo de vida. Uma Skill desatualizada
retorna para `active` depois de ser usada e da execução da próxima varredura.
Skills arquivadas retornam somente por meio de uma restauração explícita:

As transições e restaurações do ciclo de vida se aplicam a novas sessões; as
sessões em execução mantêm seu snapshot atual de Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Todos os comandos do curador aceitam `--json`. O status também relata
candidatos determinísticos de sobreposição apenas como sugestões; ele nunca
mescla Skills nem chama um modelo.

## Chat

Peça ao agente a Skill desejada; ele chama `skill_workshop` e retorna um ID de
proposta.

### Aprender com trabalhos recentes

Use `/learn` para transformar a conversa atual ou fontes nomeadas em uma
proposta de Skill orientada por padrões:

```text
/learn
/learn docs/runbook.md e https://example.com/guide; concentre-se na recuperação
```

Sem uma solicitação, `/learn` pede ao agente que extraia da conversa atual o
fluxo de trabalho reutilizável. Com uma solicitação, o agente trata caminhos,
URLs, notas coladas e referências à conversa como fontes, respeitando os
requisitos de foco, escopo e nomenclatura. Ele coleta as fontes com suas
ferramentas existentes e chama `skill_workshop` com `action: "create"`.

A proposta resultante permanece `pending`; `/learn` nunca a aplica. Revise-a e
aplique-a pelo fluxo normal de aprovação ou com
`openclaw skills workshop`.

Criar:

```text
Crie uma Skill chamada morning-catchup que execute minha rotina de caixa de entrada de segunda-feira.
```

Atualizar uma Skill existente do espaço de trabalho:

```text
Atualize trip-planning para também verificar mapas de assentos antes da reserva.
```

Iterar em uma proposta pendente:

```text
Mostre a proposta morning-catchup.
Revise-a para também sinalizar tudo o que estiver marcado como urgente.
Aplique a proposta morning-catchup.
```

As ações `apply`, `reject` e `quarantine` iniciadas por agentes exibem, por
padrão, uma solicitação de aprovação. Defina
`skills.workshop.approvalPolicy` como `"auto"` para ignorá-la em ambientes
confiáveis.

A solicitação identifica o ID da proposta e a Skill de destino, além de exibir
a descrição da proposta, a quantidade de arquivos de suporte e o tamanho do
corpo. As solicitações de aprovação têm um prazo limitado para serem concluídas
antes do watchdog da ferramenta do agente. Se nenhuma decisão chegar antes da
expiração da solicitação, a ação do ciclo de vida não será executada: a
proposta continuará pendente e inalterada. Decida mais tarde na interface do
Skill Workshop ou execute
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Os agentes não
devem tentar novamente uma ação expirada do ciclo de vida em um loop.

## CLI

```bash
# Criar
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Revisão diária da caixa de entrada: triar, arquivar, destacar, redigir, planejar" \
  --proposal ./PROPOSAL.md

# Atualizar uma Skill existente do espaço de trabalho
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Listar e inspecionar
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisar antes da aprovação
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Encerrar
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicada"
openclaw skills workshop quarantine <proposal-id> --reason "Requer análise de segurança"
```

Cada subcomando aceita `--agent <id>` (espaço de trabalho de destino; o padrão
é o inferido pelo diretório de trabalho atual e, depois, o agente padrão) e
`--json` (saída estruturada). `propose-create`, `propose-update` e `revise`
também aceitam `--goal <text>` e `--evidence <text>` para registrar o contexto
da proposta junto com `--proposal`.

## Conteúdo da proposta

Enquanto estiver pendente, a proposta será armazenada como `PROPOSAL.md` com
frontmatter exclusivo da proposta:

```markdown
---
name: "morning-catchup"
description: "Revisão diária da caixa de entrada: triar, arquivar, destacar, redigir, planejar"
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
  --description "Encerramento de sexta-feira: estatísticas, destaques e as três principais prioridades da próxima semana" \
  --proposal-dir ./weekly-update-proposal
```

O diretório deve conter `PROPOSAL.md`. Os arquivos de suporte devem estar em
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`. O Skill
Workshop os examina, calcula seus hashes e os armazena com a proposta, depois
os grava ao lado do `SKILL.md` ativo somente na aplicação.

Caminhos de arquivos de suporte rejeitados: caminhos absolutos, segmentos
ocultos de caminho, travessia de diretórios, caminhos sobrepostos, arquivos
executáveis, texto que não esteja em UTF-8, bytes nulos e caminhos fora das
pastas padrão de suporte.

## Ferramenta do agente

O modelo usa `skill_workshop` com uma `action` obrigatória:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Outros parâmetros se aplicam conforme a ação:

| Parâmetro                  | Usado por                                             | Observações                                                                 |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                         | Obrigatório para `create`; caso contrário, resolve uma proposta pendente pelo nome |
| `description`              | `create`, `update`, `revise`                          | Máximo de 160 bytes                                                         |
| `skill_name`               | `update`                                              | Nome ou chave da Skill existente                                            |
| `proposal_content`         | `create`, `update`, `revise`                          | Armazenado como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                          | Matriz de `{ path, content }`                                                |
| `goal`, `evidence`         | `create`, `update`, `revise`                          | Contexto em texto livre                                                     |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`  | Proposta de destino                                                         |
| `reason`                   | `apply`, `reject`, `quarantine`                       | Opcional                                                                    |
| `query`, `status`, `limit` | `list`                                                | Filtra/pagina; máximo de 50 para `limit`, padrão de 20                       |

Os agentes devem usar `skill_workshop` para trabalhos de Skills gerados. Eles
não devem criar nem alterar arquivos de propostas por meio de `write`, `edit`,
`exec`, comandos do shell ou operações diretas no sistema de arquivos.

<Note>
`skill_workshop` é uma ferramenta integrada do agente e está incluída em
`tools.profile: "coding"`. Se uma política mais restrita a ocultar, adicione
`skill_workshop` à lista `tools.allow` ativa ou use
`tools.alsoAllow: ["skill_workshop"]` quando o escopo usar um perfil sem um
`tools.allow` explícito. Execuções em sandbox não constroem a ferramenta
Skill Workshop no lado do host; portanto, execute as ações de revisão de
propostas em uma sessão normal do agente no lado do host ou pela CLI.
</Note>

## Skills sugeridas

O OpenClaw detecta instruções persistentes como “da próxima vez”, “lembre-se de”
e correções reativas quando um turno interativo termina, inclusive em turnos
que falharam. No turno seguinte, o agente oferece salvar o fluxo de trabalho
detectado mais recentemente por meio de `skill_workshop`; o usuário decide se
deseja criar uma proposta. Essa sugestão integrada não cria nem altera uma
Skill por conta própria. Ative `skills.workshop.autonomous.enabled` para criar
propostas pendentes diretamente.

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

| Configuração               | Padrão      | Efeito                                                                                                                                                                           |
| -------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | Cria propostas pendentes diretamente, em vez de oferecer o fluxo de trabalho detectado mais recentemente no turno seguinte.                                                      |
| `allowSymlinkTargetWrites` | `false`     | Permite que a aplicação grave por meio de links simbólicos de Skills do espaço de trabalho cujo destino real esteja listado em `skills.load.allowSymlinkTargets`.                |
| `approvalPolicy`           | `"pending"` | `"pending"` exige uma solicitação de aprovação antes de `apply`, `reject` ou `quarantine` iniciados pelo agente. `"auto"` ignora a solicitação (o agente ainda precisa chamar a ação). |
| `maxPending`               | `50`        | Limita as propostas pendentes e em quarentena por espaço de trabalho (1-200).                                                                                                    |
| `maxSkillBytes`            | `40000`     | Limita o tamanho do corpo da proposta em bytes (1024-200000).                                                                                                                    |

A captura autônoma reconhece regras prospectivas (por exemplo, “de agora em
diante”) e correções reativas (por exemplo, “não foi isso que pedi”). Ela
agrupa novas instruções por tópico em até três propostas por turno, encaminha
correspondências de vocabulário para Skills graváveis existentes do espaço de
trabalho e revisa sua própria proposta pendente quando outra correção tem como
destino a mesma Skill.

As descrições das propostas são sempre limitadas a 160 bytes,
independentemente de `maxSkillBytes`.

## Métodos do Gateway

| Método                             | Escopo            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` está disponível somente no Gateway (sem equivalente na CLI ou nas ferramentas do agente): ele
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
- `proposals.json`: índice para listagem rápida, que pode ser reconstruído com base nas pastas de propostas.
- `PROPOSAL.md`: proposta de skill pendente.
- `rollback.json`: metadados de recuperação gravados antes que a aplicação altere os arquivos ativos.

## Limites

| Limite                          | Valor                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Descrição                       | 160 bytes                                                            |
| Corpo da proposta               | `skills.workshop.maxSkillBytes` (padrão 40.000; limite máximo absoluto de 1 MiB) |
| Arquivos de suporte             | 64 por proposta                                                      |
| Tamanho dos arquivos de suporte | 256 KiB cada, 2 MiB no total                                         |
| Propostas pendentes + em quarentena | `skills.workshop.maxPending` por espaço de trabalho (padrão 50)   |

## Solução de problemas

| Problema                                       | Resolução                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Reduza `description` para 160 bytes ou menos.                                                                                                                                                              |
| `Skill proposal content is too large`          | Reduza o corpo da proposta ou aumente `skills.workshop.maxSkillBytes`.                                                                                                                                      |
| `Target skill changed after proposal creation` | Revise a proposta com base no destino atual ou crie uma nova proposta.                                                                                                                                      |
| `Proposal scan failed`                         | Inspecione as constatações do verificador e, em seguida, revise ou coloque a proposta em quarentena.                                                                                                        |
| `untrusted symlink target`                     | Configure `skills.load.allowSymlinkTargets` e habilite `skills.workshop.allowSymlinkTargetWrites` somente para raízes de skills compartilhadas intencionalmente.                                            |
| `Support file paths must be under one of...`   | Mova os arquivos de suporte para `assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.                                                                                                         |
| A proposta não aparece na lista                | Verifique o espaço de trabalho selecionado por `--agent` e `OPENCLAW_STATE_DIR`.                                                                                                                            |
| O agente não consegue chamar `skill_workshop`  | Verifique a política de ferramentas ativa e o modo de execução. `coding` inclui a ferramenta; políticas restritivas de `tools.allow` devem listá-la explicitamente, e execuções em sandbox devem usar uma sessão normal do agente no host ou a CLI. |

### Diagnóstico da política de ferramentas

Quando a captura autônoma está habilitada, `openclaw doctor` executa a
verificação `core/doctor/skill-workshop-tool-policy` para o agente padrão. Se a política
ocultar `skill_workshop`, o aviso indicará a primeira camada de configuração que o exclui e
a alteração exata em `allow` ou `alsoAllow` que deve ser feita. Runbooks mais antigos ainda podem usar
`openclaw plugins inspect skill-workshop`; agora esse comando explica que o Skill
Workshop é integrado e exibe a mesma dica de política quando aplicável.

## Relacionado

- [Skills](/pt-BR/tools/skills) para ordem de carregamento, precedência e visibilidade
- [Criação de skills](/pt-BR/tools/creating-skills) para os conceitos básicos da criação manual de `SKILL.md`
- [Configuração de Skills](/pt-BR/tools/skills-config) para o esquema completo de `skills.workshop`
- [CLI de Skills](/pt-BR/cli/skills) para os comandos `openclaw skills`
