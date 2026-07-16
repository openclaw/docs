---
read_when:
    - Você quer que o agente crie ou atualize uma skill pelo chat
    - Você precisa revisar, aplicar, rejeitar ou colocar em quarentena um rascunho de skill gerado
    - Você está configurando a aprovação, a autonomia, o armazenamento ou os limites do Skill Workshop
    - Você quer entender onde as propostas de autoaprendizado são analisadas
sidebarTitle: Skill Workshop
summary: Crie e atualize Skills do espaço de trabalho por meio da revisão do Skill Workshop
title: Oficina de Skills
x-i18n:
    generated_at: "2026-07-16T12:57:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop é o caminho administrado do OpenClaw para criar e atualizar
Skills do espaço de trabalho. Agentes e operadores nunca gravam `SKILL.md` diretamente por
esse caminho — eles criam uma **proposta** (rascunho pendente com conteúdo, vínculo
de destino, estado do scanner, hashes e metadados de reversão) que se torna uma
Skill ativa somente quando aplicada.

O Skill Workshop grava somente Skills do espaço de trabalho. Ele nunca altera Skills
integradas, de plugins, do ClawHub, de raízes extras, gerenciadas, de agentes pessoais
ou do sistema.

## Como funciona

- **Primeiro, a proposta:** o conteúdo gerado é armazenado como `PROPOSAL.md`, não
  como `SKILL.md`.
- **A aplicação é a única gravação ativa:** criar, atualizar e revisar nunca alteram
  Skills ativas.
- **Escopo do espaço de trabalho:** as criações têm como destino a raiz `skills/` do espaço de trabalho; atualizações
  são permitidas somente para Skills graváveis do espaço de trabalho.
- **Sem sobrescrita:** a criação falha se a Skill de destino já existir.
- **Vinculada por hash:** propostas de atualização são vinculadas ao hash atual do destino e ficam
  `stale` se a Skill ativa mudar antes da aplicação.
- **Controlada pelo scanner:** a aplicação executa novamente o scanner de segurança antes da gravação.
- **Recuperável:** a aplicação grava os metadados de reversão antes de alterar os arquivos ativos.
- **Interfaces consistentes:** chat, CLI e Gateway usam o mesmo serviço.

## Ciclo de vida

```text
criar/atualizar -> pendente
revisar         -> pendente
aplicar         -> aplicada
rejeitar        -> rejeitada
colocar em quarentena -> em quarentena
alteração do destino -> desatualizada
```

Somente uma proposta `pending` pode ser revisada, aplicada, rejeitada ou colocada em quarentena.

## Curadoria do ciclo de vida

O Gateway acompanha o uso agregado das Skills no banco de dados de estado compartilhado. Uma vez
por dia, ele analisa as Skills criadas e aplicadas pelo Skill Workshop. Skills não usadas por
mais de 30 dias tornam-se `stale`; após 90 dias, tornam-se `archived` e são
excluídas dos novos snapshots de Skills dos agentes. Os arquivos das Skills arquivadas permanecem inalterados
no disco. Skills criadas manualmente nunca passam por curadoria; somente Skills criadas por propostas
do Skill Workshop entram na curadoria do ciclo de vida.

Skills fixadas ignoram as transições do ciclo de vida. Uma Skill desatualizada retorna a `active`
depois de ser usada e da execução da próxima varredura. Skills arquivadas retornam somente por meio de uma
restauração explícita:

As transições e restaurações do ciclo de vida se aplicam a novas sessões; sessões em execução mantêm
seu snapshot atual de Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Todos os comandos do curador aceitam `--json`. O status também relata candidatos determinísticos
a sobreposição apenas como sugestões; ele nunca mescla Skills nem chama um modelo.

## Chat

Peça ao agente a Skill desejada; ele chama `skill_workshop` e retorna um
ID de proposta.

### Aprender com trabalhos recentes

Use `/learn` para transformar a conversa atual ou fontes nomeadas em uma
proposta de Skill orientada por padrões:

```text
/learn
/learn docs/runbook.md e https://example.com/guide; concentre-se na recuperação
```

Sem uma solicitação, `/learn` pede ao agente para extrair da conversa atual o fluxo de trabalho
reutilizável. Com uma solicitação, o agente trata caminhos, URLs, notas coladas
e referências à conversa como fontes, respeitando os requisitos de foco, escopo e
nomenclatura. Ele coleta as fontes com suas ferramentas existentes e então chama
`skill_workshop` com `action: "create"`.

A proposta resultante permanece `pending`; `/learn` nunca a aplica. Revise-a e
aplique-a pelo fluxo normal de aprovação ou com `openclaw skills workshop`.

Criar:

```text
Crie uma Skill chamada morning-catchup que execute minha rotina de caixa de entrada às segundas-feiras.
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

As ações `apply`, `reject` e `quarantine` iniciadas pelo agente são executadas sem uma solicitação
adicional de aprovação por padrão. Defina `skills.workshop.approvalPolicy` como `"pending"`
para exigir aprovação do operador antes dessas ações.

Quando a aprovação é obrigatória, a solicitação identifica o ID da proposta e a Skill
de destino, além de mostrar a descrição da proposta, a quantidade de arquivos de suporte e o tamanho do corpo.
As solicitações de aprovação têm duração limitada para serem concluídas antes do watchdog da ferramenta do agente. Se nenhuma
decisão chegar antes que a solicitação expire, a ação do ciclo de vida não será executada:
a proposta permanecerá pendente e inalterada. Decida posteriormente na interface do Skill Workshop ou execute
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Os agentes não devem
tentar novamente uma ação expirada do ciclo de vida em um loop.

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

# Encerrar
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicada"
openclaw skills workshop quarantine <proposal-id> --reason "Requer revisão de segurança"
```

Cada subcomando aceita `--agent <id>` (espaço de trabalho de destino; o padrão é
inferido pelo diretório de trabalho atual e, depois, pelo agente padrão) e `--json` (saída estruturada).
`propose-create`, `propose-update` e `revise` também aceitam `--goal <text>` e
`--evidence <text>` para registrar o contexto da proposta junto com `--proposal`.

## Conteúdo da proposta

Enquanto estiver pendente, a proposta será armazenada como `PROPOSAL.md` com frontmatter
exclusivo da proposta:

```markdown
---
name: "morning-catchup"
description: "Atualização diária da caixa de entrada: triar, arquivar, destacar, redigir, planejar"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Na aplicação, o Skill Workshop grava o `SKILL.md` ativo e remove os
campos exclusivos da proposta: `status`, `version` da proposta e `date` da proposta.

## Arquivos de suporte

Use `--proposal-dir` quando a Skill proposta precisar de arquivos ao lado de
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Fechamento de sexta-feira: estatísticas, destaques, três principais itens da próxima semana" \
  --proposal-dir ./weekly-update-proposal
```

O diretório deve conter `PROPOSAL.md`. Os arquivos de suporte devem estar em
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`. O Skill
Workshop verifica, calcula o hash e armazena esses arquivos com a proposta, gravando-os
ao lado do `SKILL.md` ativo somente na aplicação.

Caminhos de arquivos de suporte rejeitados: caminhos absolutos, segmentos de caminho ocultos, travessia
de diretórios, caminhos sobrepostos, arquivos executáveis, texto que não seja UTF-8, bytes nulos
e caminhos fora das pastas de suporte padrão.

## Ferramenta do agente

O modelo usa `skill_workshop` com um `action` obrigatório:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Outros parâmetros são aplicáveis dependendo da ação:

| Parâmetro                  | Usado por                                             | Observações                                                           |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Obrigatório para `create`; caso contrário, resolve uma proposta pendente pelo nome |
| `description`              | `create`, `update`, `revise`                         | Máximo de 160 bytes                                                   |
| `skill_name`               | `update`                                             | Nome ou chave de uma Skill existente                                  |
| `proposal_content`         | `create`, `update`, `revise`                         | Armazenado como `PROPOSAL.md`; limitado por `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`, `update`, `revise`                         | Matriz de `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contexto em texto livre                                               |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposta de destino                                                   |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opcional                                                              |
| `query`, `status`, `limit` | `list`                                               | Filtrar/paginar; `limit` máximo de 50, padrão de 20                   |

Os agentes devem usar `skill_workshop` para trabalhos de geração de Skills. Eles não devem
criar nem alterar arquivos de propostas por meio de `write`, `edit`, `exec`, comandos
do shell ou operações diretas no sistema de arquivos.

<Note>
`skill_workshop` é uma ferramenta integrada do agente e está incluída em
`tools.profile: "coding"`. Se uma política mais restrita a ocultar, adicione
`skill_workshop` à lista `tools.allow` ativa ou use
`tools.alsoAllow: ["skill_workshop"]` quando o escopo usar um perfil sem uma
`tools.allow` explícita. Execuções em sandbox não constroem a ferramenta
Skill Workshop no lado do host; portanto, execute as ações de revisão de propostas em uma sessão
normal do agente no lado do host ou pela CLI.
</Note>

## Skills sugeridas

O OpenClaw detecta instruções persistentes, como “na próxima vez”, “lembre-se de” e correções reativas,
ao fim de um turno interativo, incluindo turnos com falha. No turno seguinte, o agente oferece salvar
o fluxo de trabalho detectado mais recente por meio de `skill_workshop`; o usuário decide se deseja criar uma
proposta. Essa sugestão integrada não cria nem altera uma Skill por conta própria. Ative
`skills.workshop.autonomous.enabled` para criar propostas pendentes diretamente. Na interface de controle,
a aba Workshop oferece a mesma configuração como um botão de alternância **Autoaprendizado** no cabeçalho da página e
como um botão de ativação no quadro de propostas vazio.

### Verificar sessões anteriores

A interface de controle pode analisar trabalhos anteriores sem ativar o autoaprendizado autônomo.
Abra **Plugins → Workshop** e selecione **Encontrar ideias de Skills**. A verificação começa pelas
sessões elegíveis mais recentes e analisa uma janela limitada de trabalhos substanciais.
Ela ignora sessões de Cron, Heartbeat, hook, subagente, ACP, pertencentes a plugins e de revisão
interna, além de conversas com menos de seis turnos do modelo.

O revisor usa o modelo configurado do agente selecionado e recebe um pacote de transcrições
com segredos removidos e tamanho limitado. Ele aplica o mesmo critério conservador da
análise de experiência: um padrão concreto de recuperação ou um procedimento estável que
eliminaria pelo menos duas chamadas futuras de modelo ou ferramenta. Trabalhos rotineiros e fatos
isolados não devem gerar propostas.

Uma verificação pode criar ou revisar no máximo três propostas pendentes. Ela não pode aplicar,
rejeitar, colocar em quarentena nem editar uma Skill ativa. O Workshop mostra a cobertura acumulada,
por exemplo, **20 sessões analisadas · 18 de jun.–hoje · 2 ideias encontradas**. Selecione
**Verificar trabalhos anteriores** para continuar a partir do cursor persistente da sessão mais antiga. Depois
que o histórico disponível se esgotar, a ação se tornará **Verificar novos trabalhos**.

A revisão histórica é manual mesmo quando
`skills.workshop.autonomous.enabled` é `false`. Cada clique inicia uma execução do modelo,
portanto, aplicam-se os preços e os termos de tratamento de dados do provedor. O cursor e as contagens de cobertura
são armazenados no banco de dados de estado compartilhado do OpenClaw; o conteúdo da transcrição não é copiado
para o estado da varredura.

Com a captura autônoma habilitada, o OpenClaw também pode realizar uma revisão conservadora após um trabalho
substancial e bem-sucedido e depois que todo o sistema de agentes ficar ocioso. Essa revisão isolada pode criar ou
revisar no máximo uma proposta pendente. Ela não pode atualizar uma skill ativa nem aplicar, rejeitar ou colocar uma
proposta em quarentena, mesmo quando `approvalPolicy` é `"auto"`.

Consulte [Autoaprendizado](/tools/self-learning) para obter detalhes sobre habilitação, qualificação, privacidade e custos,
o limiar de propostas e a solução de problemas.

## Aprovação e autonomia

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Configuração                | Padrão   | Efeito                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Cria propostas pendentes a partir de correções explícitas e, após um período de ociosidade, de trabalhos substanciais concluídos com recuperação reutilizável ou economias significativas em operações de ida e volta. |
| `allowSymlinkTargetWrites` | `false`  | Permite que a aplicação grave por meio de links simbólicos de skills do espaço de trabalho cujo destino real esteja listado em `skills.load.allowSymlinkTargets`. |
| `approvalPolicy`           | `"auto"` | `"auto"` ignora uma solicitação adicional de confirmação para `apply`, `reject` ou `quarantine` iniciados pelo agente (o agente ainda precisa chamar a ação). `"pending"` exige aprovação. |
| `maxPending`               | `50`     | Limita as propostas pendentes e em quarentena por espaço de trabalho (1-200). |
| `maxSkillBytes`            | `40000`  | Limita o tamanho do corpo da proposta em bytes (1024-200000). |

A captura autônoma reconhece regras prospectivas (por exemplo, “de agora em diante”) e
correções reativas (por exemplo, “não foi isso que pedi”). Ela agrupa novas instruções por tópico em
até três propostas por turno, encaminha correspondências de vocabulário para skills graváveis existentes no espaço de trabalho e
revisa sua própria proposta pendente quando outra correção tem como alvo a mesma skill.

Para trabalhos substanciais concluídos com êxito sem uma correção explícita, uma execução isolada do
modelo selecionado decide se a trajetória concluída supera o limiar conservador para propostas. O
modelo em primeiro plano não é instruído a aprender antes de responder. O revisor em segundo plano preserva a
execução em primeiro plano como proveniência da proposta, não pode acessar ferramentas gerais do agente e não pode tomar decisões
sobre o ciclo de vida. A revisão começa somente quando o runtime em primeiro plano informa tanto o modelo exato
resolvido quanto que `skill_workshop` estava realmente disponível. Portanto, uma política de ferramentas
restritiva ou desconhecida falha de forma fechada e não cria nenhuma proposta.

Consulte [Autoaprendizado](/tools/self-learning) para conhecer o comportamento completo da revisão autônoma e o modelo de
segurança.

As descrições das propostas são sempre limitadas a 160 bytes, independentemente de
`maxSkillBytes`.

## Métodos do Gateway

| Método                             | Escopo            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
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
revise em vez de enviar literalmente um novo conteúdo.

`historyStatus` e `historyScan` são métodos de suporte da interface de controle. `historyScan`
aceita `direction: "older" | "newer"`; ele sempre mantém os resultados como propostas
pendentes.

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
- `proposals.json`: índice de listagem rápida, reconstruível a partir das pastas de propostas.
- `PROPOSAL.md`: proposta de skill pendente.
- `rollback.json`: metadados de recuperação gravados antes que a aplicação altere arquivos ativos.

## Limites

| Limite                          | Valor                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Descrição                       | 160 bytes                                                            |
| Corpo da proposta               | `skills.workshop.maxSkillBytes` (padrão: 40.000; limite máximo: 1 MiB) |
| Arquivos de suporte             | 64 por proposta                                                      |
| Tamanho do arquivo de suporte   | 256 KiB cada, 2 MiB no total                                         |
| Propostas pendentes + em quarentena | `skills.workshop.maxPending` por espaço de trabalho (padrão: 50) |

## Solução de problemas

| Problema                                       | Resolução                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Reduza `description` para 160 bytes ou menos. |
| `Skill proposal content is too large`          | Reduza o corpo da proposta ou aumente `skills.workshop.maxSkillBytes`. |
| `Target skill changed after proposal creation` | Revise a proposta com base no destino atual ou crie uma nova proposta. |
| `Proposal scan failed`                         | Inspecione as constatações do scanner e, em seguida, revise ou coloque a proposta em quarentena. |
| `untrusted symlink target`                     | Configure `skills.load.allowSymlinkTargets` e habilite `skills.workshop.allowSymlinkTargetWrites` somente para raízes de skills compartilhadas intencionalmente. |
| `Support file paths must be under one of...`   | Mova os arquivos de suporte para `assets/`, `examples/`, `references/`, `scripts/` ou `templates/`. |
| A proposta não aparece na lista                | Verifique o espaço de trabalho `--agent` selecionado e `OPENCLAW_STATE_DIR`. |
| O agente não consegue chamar `skill_workshop` | Verifique a política de ferramentas ativa e o modo de execução. `coding` inclui a ferramenta; políticas `tools.allow` restritivas devem listá-la explicitamente, e execuções em sandbox devem usar uma sessão normal do agente no host ou a CLI. |

### Diagnóstico da política de ferramentas

Quando a captura autônoma está habilitada, `openclaw doctor` executa a
verificação `core/doctor/skill-workshop-tool-policy` para o agente padrão. Se a política
ocultar `skill_workshop`, o aviso indicará a primeira camada de configuração que o exclui e
a alteração exata em `allow` ou `alsoAllow` que deve ser feita. Runbooks mais antigos ainda podem usar
`openclaw plugins inspect skill-workshop`; agora esse comando explica que o Skill
Workshop é integrado e exibe a mesma orientação sobre a política quando aplicável.

## Relacionados

- [Skills](/pt-BR/tools/skills) para ordem de carregamento, precedência e visibilidade
- [Autoaprendizado](/tools/self-learning) para propostas conservadoras de skills após a execução
- [Criação de skills](/pt-BR/tools/creating-skills) para os conceitos básicos de `SKILL.md`
  escritos manualmente
- [Configuração de skills](/pt-BR/tools/skills-config) para o esquema `skills.workshop` completo
- [CLI de skills](/pt-BR/cli/skills) para comandos `openclaw skills`
