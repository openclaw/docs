---
read_when:
    - Você quer indexar ou pesquisar memória semântica
    - Você está depurando disponibilidade ou indexação de memória semântica
    - Você quer promover memória de curto prazo recuperada para `MEMORY.md`
summary: Referência da CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memória
x-i18n:
    generated_at: "2026-04-24T05:45:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gerencie a indexação e a pesquisa de memória semântica.
Fornecido pelo Plugin de memória ativo (padrão: `memory-core`; defina `plugins.slots.memory = "none"` para desabilitar).

Relacionado:

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

- `--agent <id>`: limita a um único agente. Sem ele, esses comandos são executados para cada agente configurado; se nenhuma lista de agentes estiver configurada, eles recorrem ao agente padrão.
- `--verbose`: emite logs detalhados durante probes e indexação.

`memory status`:

- `--deep`: verifica disponibilidade de vetores + embeddings.
- `--index`: executa uma reindexação se o armazenamento estiver sujo (implica `--deep`).
- `--fix`: repara bloqueios de recall obsoletos e normaliza metadados de promoção.
- `--json`: imprime saída JSON.

Se `memory status` mostrar `Dreaming status: blocked`, o Cron gerenciado de Dreaming está habilitado, mas o heartbeat que o aciona não está disparando para o agente padrão. Consulte [Dreaming nunca executa](/pt-BR/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para as duas causas comuns.

`memory index`:

- `--force`: força uma reindexação completa.

`memory search`:

- Entrada da consulta: passe `[query]` posicional ou `--query <text>`.
- Se ambos forem fornecidos, `--query` prevalece.
- Se nenhum for fornecido, o comando termina com erro.
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--max-results <n>`: limita o número de resultados retornados.
- `--min-score <n>`: filtra correspondências com baixa pontuação.
- `--json`: imprime resultados em JSON.

`memory promote`:

Visualize e aplique promoções de memória de curto prazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- grava promoções em `MEMORY.md` (padrão: somente visualização).
- `--limit <n>` -- limita o número de candidatos mostrados.
- `--include-promoted` -- inclui entradas já promovidas em ciclos anteriores.

Opções completas:

- Classifica candidatos de curto prazo de `memory/YYYY-MM-DD.md` usando sinais ponderados de promoção (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa sinais de curto prazo tanto de recalls de memória quanto de passagens de ingestão diária, além de sinais de reforço de fases light/REM.
- Quando Dreaming está habilitado, `memory-core` gerencia automaticamente um trabalho Cron que executa uma varredura completa (`light -> REM -> deep`) em segundo plano (não é necessário `openclaw cron add` manual).
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--limit <n>`: máximo de candidatos a retornar/aplicar.
- `--min-score <n>`: pontuação mínima ponderada para promoção.
- `--min-recall-count <n>`: contagem mínima de recall exigida para um candidato.
- `--min-unique-queries <n>`: contagem mínima de consultas distintas exigida para um candidato.
- `--apply`: acrescenta os candidatos selecionados em `MEMORY.md` e os marca como promovidos.
- `--include-promoted`: inclui candidatos já promovidos na saída.
- `--json`: imprime saída JSON.

`memory promote-explain`:

Explica um candidato específico à promoção e o detalhamento da sua pontuação.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chave do candidato, fragmento de caminho ou fragmento de trecho para buscar.
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos já promovidos.
- `--json`: imprime saída JSON.

`memory rem-harness`:

Visualiza reflexões REM, verdades candidatas e saída de promoção deep sem gravar nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos deep já promovidos.
- `--json`: imprime saída JSON.

## Dreaming

Dreaming é o sistema de consolidação de memória em segundo plano com três fases
cooperativas: **light** (ordena/prepara material de curto prazo), **deep** (promove fatos
duráveis para `MEMORY.md`) e **REM** (reflete e revela temas).

- Habilite com `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Alterne pelo chat com `/dreaming on|off` (ou inspecione com `/dreaming status`).
- Dreaming é executado em uma agenda gerenciada de varredura (`dreaming.frequency`) e executa as fases em ordem: light, REM, deep.
- Somente a fase deep grava memória durável em `MEMORY.md`.
- A saída legível por humanos das fases e as entradas de diário são gravadas em `DREAMS.md` (ou no `dreams.md` existente), com relatórios opcionais por fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- A classificação usa sinais ponderados: frequência de recall, relevância de recuperação, diversidade de consultas, recência temporal, consolidação entre dias e riqueza conceitual derivada.
- A promoção relê a nota diária ativa antes de gravar em `MEMORY.md`, para que trechos de curto prazo editados ou excluídos não sejam promovidos a partir de snapshots obsoletos do armazenamento de recall.
- Execuções agendadas e manuais de `memory promote` compartilham os mesmos padrões da fase deep, a menos que você passe substituições de limite pela CLI.
- Execuções automáticas se distribuem pelos workspaces de memória configurados.

Agendamento padrão:

- **Cadência de varredura**: `dreaming.frequency = 0 3 * * *`
- **Limites deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` imprime detalhes por fase (provider, modelo, fontes, atividade em lote).
- `memory status` inclui quaisquer caminhos extras configurados por `memorySearch.extraPaths`.
- Se campos de chave de API remota de memória efetivamente ativos estiverem configurados como SecretRefs, o comando resolve esses valores a partir do snapshot ativo do gateway. Se o gateway não estiver disponível, o comando falha imediatamente.
- Observação sobre incompatibilidade de versão do gateway: este caminho de comando exige um gateway que ofereça suporte a `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Ajuste a cadência da varredura agendada com `dreaming.frequency`. Fora isso, a política de promoção deep é interna; use flags da CLI em `memory promote` quando precisar de substituições manuais pontuais.
- `memory rem-harness --path <file-or-dir> --grounded` visualiza `What Happened`, `Reflections` e `Possible Lasting Updates` fundamentados a partir de notas diárias históricas sem gravar nada.
- `memory rem-backfill --path <file-or-dir>` grava entradas de diário fundamentadas reversíveis em `DREAMS.md` para revisão na UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` também semeia candidatos duráveis fundamentados no armazenamento ativo de promoção de curto prazo para que a fase deep normal possa classificá-los.
- `memory rem-backfill --rollback` remove entradas de diário fundamentadas gravadas anteriormente, e `memory rem-backfill --rollback-short-term` remove candidatos fundamentados de curto prazo preparados anteriormente.
- Consulte [Dreaming](/pt-BR/concepts/dreaming) para descrições completas das fases e referência de configuração.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral da memória](/pt-BR/concepts/memory)
