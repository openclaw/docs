---
read_when:
    - Você quer indexar ou pesquisar a memória semântica
    - Você está depurando disponibilidade de memória ou indexação
    - Você quer promover a memória de curto prazo recuperada para `MEMORY.md`
summary: Referência da CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memória
x-i18n:
    generated_at: "2026-06-27T17:19:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gerencie a indexação e a busca de memória semântica.
Fornecido pelo Plugin `memory-core` incluído. O comando fica disponível quando
`plugins.slots.memory` seleciona `memory-core` (o padrão); outros Plugins de memória
expõem seus próprios namespaces de CLI.

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

- `--agent <id>`: limita o escopo a um único agente. Sem essa opção, esses comandos são executados para cada agente configurado; se nenhuma lista de agentes estiver configurada, eles usam o agente padrão como fallback.
- `--verbose`: emite logs detalhados durante verificações e indexação.

`memory status`:

- `--deep`: verifica a prontidão do armazenamento vetorial local, a prontidão do provedor de embeddings e a prontidão da busca vetorial semântica. `memory status` simples permanece rápido e não executa embeddings ao vivo nem trabalho de descoberta de provedores; estado desconhecido de armazenamento vetorial ou vetor semântico significa que ele não foi verificado nesse comando. O QMD lexical `searchMode: "search"` ignora verificações de vetor semântico e manutenção de embeddings mesmo com `--deep`.
- `--index`: executa uma reindexação se o armazenamento estiver sujo (implica `--deep`).
- `--fix`: repara bloqueios de recall obsoletos e normaliza metadados de promoção.
- `--json`: imprime saída JSON.

Se `memory status` mostrar `Dreaming status: blocked`, o Cron gerenciado de Dreaming está habilitado, mas o Heartbeat que o aciona não está disparando para o agente padrão. Consulte [Dreaming nunca executa](/pt-BR/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para as duas causas comuns.

`memory index`:

- `--force`: força uma reindexação completa.

`memory search`:

- Entrada da consulta: passe `[query]` posicional ou `--query <text>`.
- Se ambos forem fornecidos, `--query` prevalece.
- Se nenhum for fornecido, o comando sai com erro.
- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--max-results <n>`: limita o número de resultados retornados.
- `--min-score <n>`: filtra correspondências com baixa pontuação.
- `--json`: imprime resultados JSON.

`memory promote`:

Visualize e aplique promoções de memória de curto prazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- grava promoções em `MEMORY.md` (padrão: apenas visualização).
- `--limit <n>` -- limita o número de candidatos exibidos.
- `--include-promoted` -- inclui entradas já promovidas em ciclos anteriores.

Opções completas:

- Classifica candidatos de curto prazo de `memory/YYYY-MM-DD.md` usando sinais de promoção ponderados (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa sinais de curto prazo tanto de recalls de memória quanto de passagens de ingestão diária, além de sinais de reforço de fases leve/REM.
- Quando Dreaming está habilitado, `memory-core` gerencia automaticamente um job de Cron que executa uma varredura completa (`light -> REM -> deep`) em segundo plano (sem exigir `openclaw cron add` manual).
- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--limit <n>`: máximo de candidatos a retornar/aplicar.
- `--min-score <n>`: pontuação ponderada mínima de promoção.
- `--min-recall-count <n>`: contagem mínima de recall exigida para um candidato.
- `--min-unique-queries <n>`: contagem mínima de consultas distintas exigida para um candidato.
- `--apply`: anexa os candidatos selecionados a `MEMORY.md` e os marca como promovidos.
- `--include-promoted`: inclui candidatos já promovidos na saída.
- `--json`: imprime saída JSON.

`memory promote-explain`:

Explica um candidato específico à promoção e o detalhamento de sua pontuação.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chave do candidato, fragmento de caminho ou fragmento de trecho a procurar.
- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos já promovidos.
- `--json`: imprime saída JSON.

`memory rem-harness`:

Visualize reflexões REM, verdades candidatas e saída de promoção profunda sem gravar nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita o escopo a um único agente (padrão: o agente padrão).
- `--include-promoted`: inclui candidatos profundos já promovidos.
- `--json`: imprime saída JSON.

## Dreaming

Dreaming é o sistema de consolidação de memória em segundo plano com três fases
cooperativas: **light** (classificar/preparar material de curto prazo), **deep** (promover
fatos duráveis para `MEMORY.md`) e **REM** (refletir e destacar temas).

- Habilite com `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Alterne pelo chat com `/dreaming on|off` (ou inspecione com `/dreaming status`).
- Dreaming executa em uma programação de varredura gerenciada (`dreaming.frequency`) e executa as fases em ordem: light, REM, deep.
- Somente a fase deep grava memória durável em `MEMORY.md`.
- Saída de fase legível por humanos e entradas de diário são gravadas em `DREAMS.md` (ou no `dreams.md` existente), com relatórios opcionais por fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- A classificação usa sinais ponderados: frequência de recall, relevância de recuperação, diversidade de consultas, recência temporal, consolidação entre dias e riqueza conceitual derivada.
- A promoção relê a nota diária ao vivo antes de gravar em `MEMORY.md`, para que trechos de curto prazo editados ou excluídos não sejam promovidos a partir de snapshots obsoletos do armazenamento de recall.
- Execuções agendadas e manuais de `memory promote` compartilham os mesmos padrões da fase deep, a menos que você passe substituições de limiar pela CLI.
- Execuções automáticas se distribuem entre os workspaces de memória configurados.

Agendamento padrão:

- **Cadência de varredura**: `dreaming.frequency = 0 3 * * *`
- **Limiares deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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
- Se campos de chave de API remota de memória ativa efetivamente estiverem configurados como SecretRefs, o comando resolve esses valores a partir do snapshot ativo do Gateway. Se o Gateway estiver indisponível, o comando falha rapidamente.
- Observação sobre desvio de versão do Gateway: este caminho de comando exige um Gateway que ofereça suporte a `secrets.resolve`; Gateways mais antigos retornam um erro de método desconhecido.
- Ajuste a cadência da varredura agendada com `dreaming.frequency`. A política de promoção deep é interna no restante, exceto por `dreaming.phases.deep.maxPromotedSnippetTokens`, que limita o tamanho do trecho promovido mantendo a proveniência visível. Use flags da CLI em `memory promote` quando precisar de substituições pontuais manuais de limiar.
- `memory rem-harness --path <file-or-dir> --grounded` visualiza `What Happened`, `Reflections` e `Possible Lasting Updates` fundamentados a partir de notas diárias históricas sem gravar nada.
- `memory rem-backfill --path <file-or-dir>` grava entradas de diário fundamentadas e reversíveis em `DREAMS.md` para revisão na UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` também semeia candidatos duráveis fundamentados no armazenamento ativo de promoção de curto prazo para que a fase deep normal possa classificá-los.
- `memory rem-backfill --rollback` remove entradas de diário fundamentadas gravadas anteriormente, e `memory rem-backfill --rollback-short-term` remove candidatos de curto prazo fundamentados preparados anteriormente.
- Consulte [Dreaming](/pt-BR/concepts/dreaming) para descrições completas das fases e referência de configuração.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral de memória](/pt-BR/concepts/memory)
