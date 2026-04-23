---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir `MEMORY.md`
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T14:02:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming é o sistema de consolidação de memória em segundo plano em `memory-core`.
Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para memória durável,
mantendo o processo explicável e revisável.

Dreaming é **opt-in** e vem desativado por padrão.

## O que o Dreaming grava

Dreaming mantém dois tipos de saída:

- **Estado da máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md`, se já existir) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda grava apenas em `MEMORY.md`.

## Modelo de fases

Dreaming usa três fases cooperativas:

| Fase | Objetivo                                  | Gravação durável   |
| ----- | ----------------------------------------- | ------------------ |
| Light | Ordenar e preparar material recente de curto prazo | Não                |
| Deep  | Pontuar e promover candidatos duráveis    | Sim (`MEMORY.md`)  |
| REM   | Refletir sobre temas e ideias recorrentes | Não                |

Essas fases são detalhes internos de implementação, não "modos"
separados configuráveis pelo usuário.

### Fase Light

A fase Light ingere sinais recentes de memória diária e rastros de recall, remove duplicações
e prepara linhas candidatas.

- Lê o estado de recall de curto prazo, arquivos recentes de memória diária e transcrições redigidas de sessão quando disponíveis.
- Grava um bloco gerenciado `## Light Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço para o ranking deep posterior.
- Nunca grava em `MEMORY.md`.

### Fase Deep

A fase Deep decide o que se torna memória de longo prazo.

- Classifica candidatos usando pontuação ponderada e portas de limiar.
- Exige aprovação em `minScore`, `minRecallCount` e `minUniqueQueries`.
- Reidrata trechos a partir de arquivos diários ativos antes de gravar, então trechos obsoletos/excluídos são ignorados.
- Acrescenta entradas promovidas a `MEMORY.md`.
- Grava um resumo `## Deep Sleep` em `DREAMS.md` e opcionalmente grava `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

A fase REM extrai padrões e sinais reflexivos.

- Cria resumos de temas e reflexões a partir de rastros recentes de curto prazo.
- Grava um bloco gerenciado `## REM Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço REM usados pelo ranking deep.
- Nunca grava em `MEMORY.md`.

## Ingestão de transcrições de sessão

Dreaming pode ingerir transcrições redigidas de sessão no corpus de Dreaming. Quando
transcrições estão disponíveis, elas são alimentadas na fase light junto com sinais
de memória diária e rastros de recall. Conteúdo pessoal e sensível é redigido
antes da ingestão.

## Diário de Sonhos

Dreaming também mantém um **Diário de Sonhos** narrativo em `DREAMS.md`.
Depois que cada fase tem material suficiente, `memory-core` executa um turno de
subagente em segundo plano em melhor esforço (usando o modelo de runtime padrão) e acrescenta
uma entrada curta no diário.

Esse diário é para leitura humana na UI de Dreams, não uma fonte de promoção.
Artefatos de diário/relatório gerados por Dreaming são excluídos da
promoção de curto prazo. Apenas trechos de memória fundamentados são elegíveis para promoção em
`MEMORY.md`.

Também existe uma trilha de preenchimento retroativo histórico fundamentado para trabalho de revisão e recuperação:

- `memory rem-harness --path ... --grounded` visualiza a saída fundamentada do diário a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` grava entradas fundamentadas reversíveis do diário em `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase deep normal já usa.
- `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos preparados de backfill sem tocar em entradas comuns do diário ou recall ativo de curto prazo.

A Control UI expõe o mesmo fluxo de backfill/reset do diário para que você possa inspecionar
os resultados na cena Dreams antes de decidir se os candidatos fundamentados
merecem promoção. A cena também mostra uma trilha fundamentada distinta para que você possa ver
quais entradas preparadas de curto prazo vieram de replay histórico, quais itens promovidos
foram guiados por conteúdo fundamentado e limpar apenas entradas preparadas exclusivamente fundamentadas sem
tocar no estado comum ativo de curto prazo.

## Sinais de ranking Deep

O ranking deep usa seis sinais-base ponderados mais reforço de fase:

| Sinal               | Peso | Descrição                                         |
| ------------------- | ---- | ------------------------------------------------- |
| Frequência          | 0.24 | Quantos sinais de curto prazo a entrada acumulou |
| Relevância          | 0.30 | Qualidade média de recuperação para a entrada    |
| Diversidade de consulta | 0.15 | Contextos distintos de consulta/dia que a trouxeram à tona |
| Recência            | 0.15 | Pontuação de atualização com decaimento temporal |
| Consolidação        | 0.10 | Força de recorrência em múltiplos dias           |
| Riqueza conceitual  | 0.06 | Densidade de tags conceituais do trecho/caminho  |

Ocorrências das fases Light e REM adicionam um pequeno reforço com decaimento de recência a partir de
`memory/.dreams/phase-signals.json`.

## Agendamento

Quando ativado, `memory-core` gerencia automaticamente um job de Cron para uma varredura completa de Dreaming. Cada varredura executa as fases em ordem: light -> REM -> deep.

Comportamento padrão da cadência:

| Configuração         | Padrão     |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Início rápido

Ativar Dreaming:

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

Ativar Dreaming com uma cadência de varredura personalizada:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Fluxo de trabalho da CLI

Use a promoção pela CLI para visualização prévia ou aplicação manual:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual usa os limiares da fase deep por padrão, a menos que sejam sobrescritos
com flags da CLI.

Explique por que um candidato específico seria ou não promovido:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Visualize reflexões REM, verdades candidatas e a saída de promoção deep sem
gravar nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Padrões principais

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

| Chave      | Padrão     |
| ---------- | ---------- |
| `enabled`  | `false`    |
| `frequency` | `0 3 * * *` |

Política de fase, limiares e comportamento de armazenamento são detalhes internos de implementação
(não são config voltada ao usuário).

Consulte [Referência de configuração de memória](/pt-BR/reference/memory-config#dreaming)
para a lista completa de chaves.

## UI de Dreams

Quando ativada, a aba **Dreams** do Gateway mostra:

- estado atual de ativação do Dreaming
- status no nível de fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinal e promovidas hoje
- horário da próxima execução agendada
- uma trilha Scene fundamentada distinta para entradas preparadas de replay histórico
- um leitor expansível do Diário de Sonhos com base em `doctor.memory.dreamDiary`

## Solução de problemas

### Dreaming nunca é executado (o status mostra bloqueado)

O Cron gerenciado de Dreaming depende do Heartbeat do agente padrão. Se o Heartbeat não estiver disparando para esse agente, o Cron enfileira um evento do sistema que ninguém consome e o Dreaming silenciosamente não é executado. Tanto `openclaw memory status` quanto `/dreaming status` informarão `blocked` nesse caso e nomearão o agente cujo Heartbeat é o bloqueador.

Duas causas comuns:

- Outro agente declara um bloco `heartbeat:` explícito. Quando qualquer entrada em `agents.list` tem seu próprio bloco `heartbeat`, apenas esses agentes recebem Heartbeat — os padrões deixam de se aplicar a todos os demais, então o agente padrão pode ficar silencioso. Mova as configurações de Heartbeat para `agents.defaults.heartbeat` ou adicione um bloco `heartbeat` explícito ao agente padrão. Consulte [Escopo e precedência](/pt-BR/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` é `0`, vazio ou não analisável. O Cron não tem intervalo para agendar, então o Heartbeat fica efetivamente desativado. Defina `every` como uma duração positiva, como `30m`. Consulte [Padrões](/pt-BR/gateway/heartbeat#defaults).

## Relacionado

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [CLI de memory](/pt-BR/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
