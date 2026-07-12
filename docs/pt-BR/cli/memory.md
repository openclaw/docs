---
read_when:
    - Você quer indexar ou pesquisar a memória semântica
    - Você está depurando a disponibilidade ou a indexação da memória
    - Você quer promover a memória de curto prazo recuperada para `MEMORY.md`
summary: Referência da CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Memória
x-i18n:
    generated_at: "2026-07-12T15:05:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gerencie a indexação, a busca e a promoção da memória semântica para `MEMORY.md`.
Fornecido pelo plugin `memory-core` incluído, disponível quando
`plugins.slots.memory` seleciona `memory-core` (o padrão). Outros plugins de memória
expõem seus próprios namespaces da CLI.

Relacionado: conceito de [Memória](/pt-BR/concepts/memory), [Dreaming](/pt-BR/concepts/dreaming),
[Referência de configuração da memória](/pt-BR/reference/memory-config), [Wiki da memória](/pt-BR/plugins/memory-wiki),
[wiki](/pt-BR/cli/wiki), [Plugins](/pt-BR/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Sem `--agent`, é executado para cada agente em `agents.list`; se nenhuma lista de agentes estiver
configurada, usa o agente padrão.

| Flag        | Efeito                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Verifica a prontidão do armazenamento vetorial, do provedor de embeddings e da busca semântica (implica chamadas adicionais ao provedor). O `memory status` simples permanece rápido e ignora essa verificação; um estado vetorial/semântico desconhecido significa que ele não foi verificado. A busca lexical QMD com `searchMode: "search"` sempre ignora verificações vetoriais semânticas, mesmo com `--deep`. |
| `--index`   | Reindexa se o armazenamento estiver desatualizado. Implica `--deep`.                                                                                                                                                                                                                                      |
| `--fix`     | Corrige bloqueios de recuperação obsoletos e normaliza os metadados de promoção.                                                                                                                                                                                                                           |
| `--json`    | Exibe JSON.                                                                                                                                                                                                                                                                                               |
| `--verbose` | Emite logs detalhados por fase.                                                                                                                                                                                                                                                                           |

Se a linha `Dreaming` permanecer como `off` mesmo com `dreaming.enabled: true`, ou
se as varreduras agendadas nunca parecerem ser executadas, o cron gerenciado do Dreaming depende do
Heartbeat do agente padrão ser disparado para acionar a reconciliação. Consulte
[Dreaming](/pt-BR/concepts/dreaming) para obter detalhes do agendamento.

O status também lista quaisquer caminhos de busca adicionais de `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

O mesmo escopo por agente de `status`. `--force` executa uma reindexação completa em vez de
uma incremental. `--verbose` exibe detalhes do provedor, modelo, fontes e
caminhos adicionais por agente antes de mostrar o progresso da indexação.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Consulta: `[query]` posicional ou `--query <text>`. Se ambos forem definidos, `--query`
  prevalece. Se nenhum for definido, o comando retorna um erro.
- `--agent <id>`: usa por padrão o agente padrão (não a lista completa de agentes).
- `--max-results <n>`: limita a quantidade de resultados (inteiro positivo).
- `--min-score <n>`: filtra correspondências abaixo dessa pontuação.

## `memory promote`

Classifique candidatos de curto prazo de `memory/YYYY-MM-DD.md` e, opcionalmente, acrescente
as principais entradas a `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Flag                       | Padrão                   | Efeito                                                                   |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `--limit <n>`              |                          | Máximo de candidatos a retornar/aplicar.                                 |
| `--min-score <n>`          | `0.75`                   | Pontuação mínima ponderada de promoção.                                  |
| `--min-recall-count <n>`   | `3`                      | Contagem mínima de recuperações exigida.                                 |
| `--min-unique-queries <n>` | `2`                      | Contagem mínima de consultas distintas exigida.                          |
| `--apply`                  | somente visualização     | Acrescenta os candidatos selecionados a `MEMORY.md` e os marca como promovidos. |
| `--include-promoted`       |                          | Inclui candidatos já promovidos em ciclos anteriores.                    |
| `--json`                   |                          | Exibe JSON.                                                              |

Esses padrões da CLI diferem dos limites da fase profunda da varredura agendada do Dreaming
(consulte [Dreaming](#dreaming) abaixo); passe flags explícitas para corresponder
ao comportamento da varredura em uma execução manual avulsa.

Sinais de classificação: frequência de recuperação, relevância da busca, diversidade de consultas,
recência temporal, consolidação entre dias e riqueza dos conceitos derivados, obtidos
tanto das recuperações de memória quanto das passagens de ingestão diária, além de um aumento leve de
reforço das fases leve/REM para revisitas repetidas do Dreaming. Antes da gravação, a promoção
relê a nota diária atual, portanto edições ou exclusões de trechos de curto prazo
desde a classificação são respeitadas, em vez de promover com base em um snapshot obsoleto.

## `memory promote-explain`

Explique a composição da pontuação de um candidato à promoção.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` corresponde à chave de um candidato (exata ou substring), ao caminho ou ao texto
do trecho.

## `memory rem-harness`

Visualize reflexões REM, possíveis verdades e a saída de promoção da fase profunda
sem gravar nada.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: inicializa o harness a partir de arquivos diários históricos
  `YYYY-MM-DD.md`, em vez do espaço de trabalho atual.
- `--grounded`: também renderiza uma visualização fundamentada de `What Happened` / `Reflections` /
  `Possible Lasting Updates` com base nas notas históricas.

## `memory rem-backfill`

Grave resumos históricos REM fundamentados em `DREAMS.md` para revisão na interface.
Reversível.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: obrigatório, a menos que `--rollback`/`--rollback-short-term`
  esteja definido. Arquivo(s) de memória diária histórica ou diretório usado como origem do preenchimento retroativo.
- `--stage-short-term`: também insere candidatos duráveis fundamentados no armazenamento atual
  de promoção de curto prazo, para que a fase profunda normal possa classificá-los.
- `--rollback`: remove de `DREAMS.md` entradas fundamentadas do diário gravadas
  anteriormente.
- `--rollback-short-term`: remove candidatos fundamentados de curto prazo preparados
  anteriormente.

## Dreaming

Dreaming é o sistema de consolidação de memória em segundo plano com três fases
cooperativas, executadas em ordem em um único agendamento: **leve** (organiza/prepara material
de curto prazo), **REM** (reflete e destaca temas), **profunda** (promove fatos
duráveis para `MEMORY.md`). Somente a fase profunda grava em `MEMORY.md`.

- Ative com `plugins.entries.memory-core.config.dreaming.enabled: true`
  (padrão `false`); `memory-core` gerencia automaticamente o trabalho cron de varredura, sem necessidade
  de executar `openclaw cron add` manualmente.
- Alterne pelo chat com `/dreaming on|off`; consulte com `/dreaming status`
  (ou `/dreaming`/`/dreaming help`). `on`/`off` exige status de proprietário do canal
  ou `operator.admin` do Gateway; `status` e a ajuda permanecem disponíveis para qualquer pessoa que
  possa invocar o comando.
- A saída das fases legível por humanos é gravada em `DREAMS.md` (ou em um `dreams.md` existente).
  Por padrão (`dreaming.storage.mode: "separate"`), cada fase também grava um
  relatório independente em `memory/dreaming/<phase>/YYYY-MM-DD.md`; defina `mode:
"inline"` para incorporar os relatórios ao arquivo diário de memória, ou `"both"`
  para ambos.
- As execuções agendadas e manuais de `memory promote` compartilham os mesmos sinais de
  classificação da fase profunda; apenas os limites padrão diferem (consulte a tabela acima e os
  padrões agendados abaixo).
- As execuções agendadas são distribuídas entre os espaços de trabalho de memória de todos os agentes configurados.

Padrões agendados (`plugins.entries.memory-core.config.dreaming`):

| Chave                                  | Padrão      |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

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

Lista completa de chaves e detalhes das fases: [Dreaming](/pt-BR/concepts/dreaming),
[Referência de configuração da memória](/pt-BR/reference/memory-config#dreaming).

## Dependência de SecretRef no Gateway

Se os campos de chave da API remota da Active Memory estiverem configurados como SecretRefs, os comandos `memory`
os resolverão a partir do snapshot ativo do Gateway; se o Gateway estiver
indisponível, o comando falhará imediatamente. Isso exige um Gateway compatível com o
método `secrets.resolve`; Gateways mais antigos retornam um erro de método desconhecido.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral da memória](/pt-BR/concepts/memory)
