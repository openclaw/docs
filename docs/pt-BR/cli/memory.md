---
read_when:
    - Você quer indexar ou pesquisar a memória semântica
    - Você está depurando a disponibilidade de memória ou a indexação
    - Você quer promover a memória de curto prazo recuperada para `MEMORY.md`
summary: Referência da CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memória
x-i18n:
    generated_at: "2026-06-30T13:52:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gerencie a indexação e a busca de memória semântica.
Fornecido pelo Plugin `memory-core` incluído. O comando fica disponível quando
`plugins.slots.memory` seleciona `memory-core` (o padrão); outros Plugins de memória
expõem seus próprios namespaces de CLI.

Relacionados:

- Conceito de memória: [Memória](/pt-BR/concepts/memory)
- Wiki de memória: [Wiki de memória](/pt-BR/plugins/memory-wiki)
- CLI da wiki: [wiki](/pt-BR/cli/wiki)
- Plugins: [Plugins](/pt-BR/tools/plugin)

## Exemplos

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opções

`memory status` e `memory index`:

- `--agent <id>`: limita o escopo a um único agente. Sem isso, esses comandos são executados para cada agente configurado; se nenhuma lista de agentes estiver configurada, eles recorrem ao agente padrão.
- `--verbose`: emite logs detalhados durante sondagens e indexação.

`memory status`:

- `--deep`: sonda a prontidão do armazenamento vetorial local, a prontidão do provedor de embeddings e a prontidão da busca vetorial semântica. `memory status` simples permanece rápido e não executa trabalho ao vivo de embedding nem descoberta de provedor; estado desconhecido de armazenamento vetorial ou vetor semântico significa que ele não foi sondado nesse comando. QMD léxico `searchMode: "search"` ignora sondagens vetoriais semânticas e manutenção de embeddings mesmo com `--deep`.
- `--index`: executa uma reindexação se o armazenamento estiver sujo (implica `--deep`).
- `--fix`: repara bloqueios de recuperação obsoletos e normaliza metadados de promoção.
- `--json`: imprime saída JSON.

Se `memory status` mostrar `Dreaming status: blocked`, o cron gerenciado de dreaming está habilitado, mas o Heartbeat que o aciona não está disparando para o agente padrão. Consulte [Dreaming nunca executa](/pt-BR/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para as duas causas comuns.

`memory index`:

- `--force`: força uma reindexação completa.

`memory search`:

- Entrada de consulta: passe `[query]` posicional ou `--query <text>`.
- Se ambos forem fornecidos, `--query` prevalece.
- Se nenhum for fornecido, o comando sai com um erro.
- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--max-results <n>`: limita o número de resultados retornados.
- `--min-score <n>`: filtra correspondências de baixa pontuação.
- `--json`: imprime resultados JSON.

`memory promote`:

Pré-visualize e aplique promoções de memória de curto prazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- grava promoções em `MEMORY.md` (padrão: apenas pré-visualização).
- `--limit <n>` -- limita o número de candidatos mostrados.
- `--include-promoted` -- inclui entradas já promovidas em ciclos anteriores.

Opções completas:

- Classifica candidatos de curto prazo de `memory/YYYY-MM-DD.md` usando sinais de promoção ponderados (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa sinais de curto prazo tanto de recuperações de memória quanto de passagens de ingestão diária, além de sinais de reforço das fases light/REM.
- Quando Dreaming está habilitado, `memory-core` gerencia automaticamente um cron job que executa uma varredura completa (`light -> REM -> deep`) em segundo plano (não é necessário `openclaw cron add` manual).
- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--limit <n>`: máximo de candidatos a retornar/aplicar.
- `--min-score <n>`: pontuação mínima ponderada de promoção.
- `--min-recall-count <n>`: contagem mínima de recuperações exigida para um candidato.
- `--min-unique-queries <n>`: contagem mínima de consultas distintas exigida para um candidato.
- `--apply`: acrescenta os candidatos selecionados a `MEMORY.md` e os marca como promovidos.
- `--include-promoted`: inclui candidatos já promovidos na saída.
- `--json`: imprime saída JSON.

`memory promote-explain`:

Explique um candidato específico à promoção e o detalhamento de sua pontuação.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chave do candidato, fragmento de caminho ou fragmento de trecho para procurar.
- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos já promovidos.
- `--json`: imprime saída JSON.

`memory rem-harness`:

Pré-visualize reflexões REM, verdades candidatas e saída de promoção profunda sem gravar nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos profundos já promovidos.
- `--json`: imprime saída JSON.

## Dreaming

Dreaming é o sistema em segundo plano de consolidação de memória com três fases
cooperativas: **light** (ordenar/preparar material de curto prazo), **deep** (promover
fatos duráveis para `MEMORY.md`) e **REM** (refletir e destacar temas).

- Habilite com `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Alterne pelo chat com `/dreaming on|off` (ou inspecione com `/dreaming status`).
  Chamadores de canal devem ser proprietários para alterar a configuração; clientes Gateway precisam de
  `operator.admin`. Status somente leitura e ajuda continuam disponíveis para remetentes
  de comandos autorizados.
- Dreaming é executado em uma programação de varredura gerenciada (`dreaming.frequency`) e executa as fases em ordem: light, REM, deep.
- Somente a fase deep grava memória durável em `MEMORY.md`.
- Saída de fase legível por humanos e entradas de diário são gravadas em `DREAMS.md` (ou no `dreams.md` existente), com relatórios opcionais por fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- A classificação usa sinais ponderados: frequência de recuperação, relevância de recuperação, diversidade de consultas, recência temporal, consolidação entre dias e riqueza conceitual derivada.
- A promoção relê a nota diária ao vivo antes de gravar em `MEMORY.md`, para que trechos de curto prazo editados ou excluídos não sejam promovidos a partir de snapshots obsoletos do armazenamento de recuperação.
- Execuções agendadas e manuais de `memory promote` compartilham os mesmos padrões da fase deep, a menos que você passe substituições de limites pela CLI.
- Execuções automáticas se espalham por workspaces de memória configurados.

Agendamento padrão:

- **Cadência de varredura**: `dreaming.frequency = 0 3 * * *`
- **Limites de deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Exemplo:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Observações:

- `memory index --verbose` imprime detalhes por fase (provedor, modelo, fontes, atividade em lote).
- `memory status` inclui quaisquer caminhos extras configurados via `memorySearch.extraPaths`.
- Se campos de chave de API remota de Active Memory efetivamente ativos estiverem configurados como SecretRefs, o comando resolve esses valores a partir do snapshot ativo do Gateway. Se o gateway estiver indisponível, o comando falha rapidamente.
- Observação sobre incompatibilidade de versão do Gateway: este caminho de comando requer um gateway que ofereça suporte a `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Ajuste a cadência da varredura agendada com `dreaming.frequency`. A política de promoção deep é interna, exceto por `dreaming.phases.deep.maxPromotedSnippetTokens`, que limita o tamanho do trecho promovido mantendo a proveniência visível. Use flags de CLI em `memory promote` quando precisar de substituições manuais pontuais de limites.
- `memory rem-harness --path <file-or-dir> --grounded` pré-visualiza `What Happened`, `Reflections` e `Possible Lasting Updates` fundamentados a partir de notas diárias históricas sem gravar nada.
- `memory rem-backfill --path <file-or-dir>` grava entradas reversíveis de diário fundamentado em `DREAMS.md` para revisão na UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` também semeia candidatos duráveis fundamentados no armazenamento ativo de promoção de curto prazo para que a fase deep normal possa classificá-los.
- `memory rem-backfill --rollback` remove entradas de diário fundamentado gravadas anteriormente, e `memory rem-backfill --rollback-short-term` remove candidatos fundamentados de curto prazo preparados anteriormente.
- Consulte [Dreaming](/pt-BR/concepts/dreaming) para descrições completas das fases e referência de configuração.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Visão geral da memória](/pt-BR/concepts/memory)
