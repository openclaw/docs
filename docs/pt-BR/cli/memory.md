---
read_when:
    - Você quer indexar ou pesquisar na memória semântica
    - Você está depurando a disponibilidade ou a indexação da Active Memory
    - Você quer promover a memória de curto prazo recuperada para `MEMORY.md`
summary: Referência da CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Active Memory
x-i18n:
    generated_at: "2026-04-23T14:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gerencie a indexação e a pesquisa da Active Memory.
Fornecido pelo plugin de memória ativo (padrão: `memory-core`; defina `plugins.slots.memory = "none"` para desabilitar).

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

- `--agent <id>`: limita a um único agente. Sem isso, esses comandos são executados para cada agente configurado; se nenhuma lista de agentes estiver configurada, eles recorrem ao agente padrão.
- `--verbose`: emite logs detalhados durante sondagens e indexação.

`memory status`:

- `--deep`: verifica a disponibilidade de vetores + embeddings.
- `--index`: executa uma reindexação se o armazenamento estiver sujo (implica `--deep`).
- `--fix`: repara locks de recall obsoletos e normaliza metadados de promoção.
- `--json`: imprime saída em JSON.

Se `memory status` mostrar `Dreaming status: blocked`, o cron gerenciado de Dreaming está habilitado, mas o Heartbeat que o aciona não está disparando para o agente padrão. Veja [Dreaming nunca executa](/pt-BR/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para as duas causas comuns.

`memory index`:

- `--force`: força uma reindexação completa.

`memory search`:

- Entrada da consulta: passe `[query]` posicional ou `--query <text>`.
- Se ambos forem fornecidos, `--query` prevalece.
- Se nenhum for fornecido, o comando sai com erro.
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--max-results <n>`: limita o número de resultados retornados.
- `--min-score <n>`: filtra correspondências com pontuação baixa.
- `--json`: imprime resultados em JSON.

`memory promote`:

Visualize e aplique promoções de memória de curto prazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- grava promoções em `MEMORY.md` (padrão: apenas visualização).
- `--limit <n>` -- limita o número de candidatos exibidos.
- `--include-promoted` -- inclui entradas já promovidas em ciclos anteriores.

Opções completas:

- Classifica candidatos de curto prazo de `memory/YYYY-MM-DD.md` usando sinais ponderados de promoção (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa sinais de curto prazo tanto de recalls de memória quanto de passagens de ingestão diária, além de sinais leves/de fase REM de reforço.
- Quando Dreaming está habilitado, `memory-core` gerencia automaticamente uma tarefa Cron que executa uma varredura completa (`light -> REM -> deep`) em segundo plano (não é necessário `openclaw cron add` manual).
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--limit <n>`: máximo de candidatos para retornar/aplicar.
- `--min-score <n>`: pontuação mínima ponderada de promoção.
- `--min-recall-count <n>`: contagem mínima de recall exigida para um candidato.
- `--min-unique-queries <n>`: contagem mínima de consultas distintas exigida para um candidato.
- `--apply`: acrescenta candidatos selecionados em `MEMORY.md` e os marca como promovidos.
- `--include-promoted`: inclui candidatos já promovidos na saída.
- `--json`: imprime saída em JSON.

`memory promote-explain`:

Explica um candidato específico de promoção e o detalhamento de sua pontuação.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chave do candidato, fragmento de caminho ou fragmento de trecho para busca.
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos já promovidos.
- `--json`: imprime saída em JSON.

`memory rem-harness`:

Visualize reflexões REM, verdades candidatas e a saída de promoção profunda sem gravar nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos profundos já promovidos.
- `--json`: imprime saída em JSON.

## Dreaming

Dreaming é o sistema de consolidação de memória em segundo plano com três fases
cooperativas: **light** (ordenar/preparar material de curto prazo), **deep** (promover fatos
duráveis para `MEMORY.md`) e **REM** (refletir e destacar temas).

- Habilite com `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Alterne pelo chat com `/dreaming on|off` (ou inspecione com `/dreaming status`).
- Dreaming é executado em um único agendamento gerenciado de varredura (`dreaming.frequency`) e executa as fases em ordem: light, REM, deep.
- Apenas a fase deep grava memória durável em `MEMORY.md`.
- A saída legível por humanos das fases e as entradas de diário são gravadas em `DREAMS.md` (ou `dreams.md`, se já existir), com relatórios opcionais por fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- A classificação usa sinais ponderados: frequência de recall, relevância da recuperação, diversidade de consultas, recência temporal, consolidação entre dias e riqueza conceitual derivada.
- A promoção relê a nota diária ativa antes de gravar em `MEMORY.md`, para que trechos editados ou excluídos de curto prazo não sejam promovidos a partir de snapshots obsoletos do armazenamento de recall.
- Execuções agendadas e manuais de `memory promote` compartilham os mesmos padrões da fase deep, a menos que você passe substituições de limiar pela CLI.
- Execuções automáticas são distribuídas entre os espaços de trabalho de memória configurados.

Agendamento padrão:

- **Cadência de varredura**: `dreaming.frequency = 0 3 * * *`
- **Limiares profundos**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` imprime detalhes por fase (provider, modelo, fontes, atividade de lote).
- `memory status` inclui quaisquer caminhos extras configurados por `memorySearch.extraPaths`.
- Se campos de chave de API remota da Active Memory efetivamente ativos estiverem configurados como SecretRefs, o comando resolverá esses valores a partir do snapshot ativo do gateway. Se o gateway não estiver disponível, o comando falhará rapidamente.
- Observação sobre incompatibilidade de versão do Gateway: este caminho de comando exige um gateway com suporte a `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Ajuste a cadência de varredura agendada com `dreaming.frequency`. Fora isso, a política de promoção profunda é interna; use flags da CLI em `memory promote` quando precisar de substituições manuais pontuais.
- `memory rem-harness --path <file-or-dir> --grounded` visualiza `What Happened`, `Reflections` e `Possible Lasting Updates` fundamentados a partir de notas diárias históricas sem gravar nada.
- `memory rem-backfill --path <file-or-dir>` grava entradas de diário fundamentadas e reversíveis em `DREAMS.md` para revisão na interface.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` também semeia candidatos duráveis fundamentados no armazenamento ativo de promoção de curto prazo, para que a fase deep normal possa classificá-los.
- `memory rem-backfill --rollback` remove entradas de diário fundamentadas gravadas anteriormente, e `memory rem-backfill --rollback-short-term` remove candidatos fundamentados de curto prazo preparados anteriormente.
- Veja [Dreaming](/pt-BR/concepts/dreaming) para descrições completas das fases e a referência de configuração.
