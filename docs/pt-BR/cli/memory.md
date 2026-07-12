---
read_when:
    - Você quer indexar ou pesquisar a memória semântica
    - Você está depurando a disponibilidade ou a indexação da memória
    - Você quer promover a memória de curto prazo recuperada para `MEMORY.md`
summary: Referência da CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Memória
x-i18n:
    generated_at: "2026-07-11T23:49:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gerencie a indexação e a pesquisa da memória semântica, além da promoção para `MEMORY.md`.
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

Sem `--agent`, é executado para cada agente em `agents.list`; se nenhuma lista de agentes
estiver configurada, usa como alternativa o agente padrão.

| Sinalizador | Efeito                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Verifica a prontidão do armazenamento vetorial, do provedor de embeddings e da pesquisa semântica (implica chamadas adicionais ao provedor). O `memory status` simples permanece rápido e ignora essa verificação; um estado vetorial/semântico desconhecido significa que ele não foi verificado. A pesquisa lexical do QMD com `searchMode: "search"` sempre ignora as verificações vetoriais semânticas, mesmo com `--deep`. |
| `--index`   | Reindexa se o armazenamento estiver desatualizado. Implica `--deep`.                                                                                                                                                                                                                                                          |
| `--fix`     | Corrige bloqueios de recuperação obsoletos e normaliza os metadados de promoção.                                                                                                                                                                                                                                               |
| `--json`    | Exibe JSON.                                                                                                                                                                                                                                                                                               |
| `--verbose` | Emite logs detalhados por fase.                                                                                                                                                                                                                                                                             |

Se a linha `Dreaming` continuar como `off` mesmo com `dreaming.enabled: true`, ou
as varreduras agendadas nunca parecerem ser executadas, o Cron gerenciado do Dreaming depende
do acionamento do Heartbeat do agente padrão para iniciar a reconciliação. Consulte
[Dreaming](/pt-BR/concepts/dreaming) para obter detalhes do agendamento.

O status também lista quaisquer caminhos de pesquisa adicionais de `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

O mesmo escopo por agente de `status`. `--force` executa uma reindexação completa em vez de
uma incremental. `--verbose` exibe o provedor, o modelo, as fontes e
os detalhes dos caminhos adicionais de cada agente antes de mostrar o progresso da indexação.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Consulta: `[query]` posicional ou `--query <text>`. Se ambos forem definidos, `--query`
  prevalece. Se nenhum for definido, o comando retorna um erro.
- `--agent <id>`: usa como padrão o agente padrão (não a lista completa de agentes).
- `--max-results <n>`: limita a quantidade de resultados (inteiro positivo).
- `--min-score <n>`: filtra correspondências com pontuação abaixo desse valor.

## `memory promote`

Classifique candidatos de curto prazo de `memory/YYYY-MM-DD.md` e, opcionalmente, acrescente
as principais entradas a `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Sinalizador                 | Padrão                | Efeito                                                                     |
| --------------------------- | --------------------- | -------------------------------------------------------------------------- |
| `--limit <n>`               |                       | Máximo de candidatos a retornar/aplicar.                                   |
| `--min-score <n>`           | `0.75`                | Pontuação mínima ponderada de promoção.                                    |
| `--min-recall-count <n>`    | `3`                   | Contagem mínima obrigatória de recuperações.                               |
| `--min-unique-queries <n>`  | `2`                   | Quantidade mínima obrigatória de consultas distintas.                      |
| `--apply`                   | somente visualização  | Acrescenta os candidatos selecionados a `MEMORY.md` e os marca como promovidos. |
| `--include-promoted`        |                       | Inclui candidatos já promovidos em ciclos anteriores.                      |
| `--json`                    |                       | Exibe JSON.                                                                |

Esses padrões da CLI são diferentes dos limites da fase profunda da varredura agendada
do Dreaming (consulte [Dreaming](#dreaming) abaixo); passe sinalizadores explícitos para corresponder
ao comportamento da varredura em uma execução manual avulsa.

Sinais de classificação: frequência de recuperação, relevância da recuperação, diversidade de consultas,
recência temporal, consolidação entre dias e riqueza de conceitos derivados, obtidos
tanto das recuperações de memória quanto das passagens de ingestão diária, além de um reforço
leve das fases leve/REM para revisitas repetidas do Dreaming. Antes da gravação, a promoção
relê a nota diária ativa, de modo que edições ou exclusões de trechos de curto prazo
feitas desde a classificação sejam respeitadas, em vez de promover com base em um instantâneo obsoleto.

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

- `--path <file-or-dir>`: inicializa o ambiente de teste com arquivos diários históricos
  `YYYY-MM-DD.md` em vez do espaço de trabalho ativo.
- `--grounded`: também renderiza uma visualização fundamentada de `O que aconteceu` / `Reflexões` /
  `Possíveis atualizações duradouras` com base nas notas históricas.

## `memory rem-backfill`

Grave resumos REM históricos fundamentados em `DREAMS.md` para revisão na interface.
Reversível.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: obrigatório, a menos que `--rollback`/`--rollback-short-term`
  esteja definido. Arquivo(s) de memória diária histórica ou diretório a partir do qual preencher retroativamente.
- `--stage-short-term`: também insere candidatos duráveis fundamentados no armazenamento
  ativo de promoção de curto prazo, para que a fase profunda normal possa classificá-los.
- `--rollback`: remove de `DREAMS.md` as entradas de diário fundamentadas gravadas
  anteriormente.
- `--rollback-short-term`: remove candidatos fundamentados de curto prazo preparados
  anteriormente.

## Dreaming

Dreaming é o sistema de consolidação de memória em segundo plano com três fases cooperativas,
executadas em ordem em um único agendamento: **leve** (organiza/prepara o material de curto prazo),
**REM** (reflete e revela temas), **profunda** (promove fatos duráveis
para `MEMORY.md`). Somente a fase profunda grava em `MEMORY.md`.

- Ative com `plugins.entries.memory-core.config.dreaming.enabled: true`
  (padrão `false`); `memory-core` gerencia automaticamente o trabalho Cron da varredura, sem necessidade
  de executar `openclaw cron add` manualmente.
- Ative ou desative pelo chat com `/dreaming on|off`; inspecione com `/dreaming status`
  (ou `/dreaming`/`/dreaming help`). `on`/`off` exige o status de proprietário do canal
  ou `operator.admin` do Gateway; o status e a ajuda permanecem disponíveis para qualquer pessoa que
  possa invocar o comando.
- A saída legível das fases é gravada em `DREAMS.md` (ou em um `dreams.md` existente).
  Por padrão (`dreaming.storage.mode: "separate"`), cada fase também grava um
  relatório independente em `memory/dreaming/<phase>/YYYY-MM-DD.md`; defina `mode:
"inline"` para incorporar os relatórios ao arquivo de memória diária, ou `"both"`
  para usar ambos.
- As execuções agendadas e manuais de `memory promote` compartilham os mesmos sinais de
  classificação da fase profunda; somente os limites padrão são diferentes (consulte a tabela acima e
  os padrões agendados abaixo).
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

## Dependência do Gateway para SecretRef

Se os campos de chave da API remota da Active Memory estiverem configurados como SecretRefs, os comandos de `memory`
os resolverão com base no instantâneo ativo do Gateway; se o Gateway estiver
indisponível, o comando falhará imediatamente. Isso exige um Gateway compatível com o
método `secrets.resolve`; Gateways mais antigos retornam um erro de método desconhecido.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Visão geral da memória](/pt-BR/concepts/memory)
