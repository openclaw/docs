---
read_when:
    - Você quer que a promoção de memory seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir o `MEMORY.md`
summary: Consolidação de memory em segundo plano com fases light, deep e REM, além de um Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T05:47:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming é o sistema de consolidação de memory em segundo plano em `memory-core`.
Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para memory durável, mantendo
o processo explicável e revisável.

Dreaming é **opt-in** e vem desativado por padrão.

## O que o Dreaming grava

O Dreaming mantém dois tipos de saída:

- **Estado de máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md` existente) e arquivos opcionais de relatório por fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo continua gravando apenas em `MEMORY.md`.

## Modelo de fases

O Dreaming usa três fases cooperativas:

| Fase | Finalidade                                 | Gravação durável   |
| ----- | ------------------------------------------ | ------------------ |
| Light | Organizar e preparar material recente de curto prazo | Não                |
| Deep  | Pontuar e promover candidatos duráveis     | Sim (`MEMORY.md`)  |
| REM   | Refletir sobre temas e ideias recorrentes  | Não                |

Essas fases são detalhes internos de implementação, não "modos"
configuráveis pelo usuário separadamente.

### Fase Light

A fase Light ingere sinais recentes de memory diária e rastros de recall, remove duplicações
e prepara linhas candidatas.

- Lê do estado de recall de curto prazo, arquivos recentes de memory diária e transcrições de sessão com redação, quando disponíveis.
- Grava um bloco gerenciado `## Light Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço para classificação deep posterior.
- Nunca grava em `MEMORY.md`.

### Fase Deep

A fase Deep decide o que se torna memory de longo prazo.

- Classifica candidatos usando pontuação ponderada e limites de corte.
- Exige que `minScore`, `minRecallCount` e `minUniqueQueries` sejam atendidos.
- Reidrata trechos de arquivos diários ativos antes de gravar, então trechos obsoletos/excluídos são ignorados.
- Acrescenta entradas promovidas a `MEMORY.md`.
- Grava um resumo `## Deep Sleep` em `DREAMS.md` e opcionalmente grava `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

A fase REM extrai padrões e sinais reflexivos.

- Constrói resumos de temas e reflexões a partir de rastros recentes de curto prazo.
- Grava um bloco gerenciado `## REM Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço REM usados pela classificação deep.
- Nunca grava em `MEMORY.md`.

## Ingestão de transcrições de sessão

O Dreaming pode ingerir transcrições de sessão com redação no corpus de Dreaming. Quando
as transcrições estão disponíveis, elas são alimentadas na fase Light junto com sinais de
memory diária e rastros de recall. Conteúdo pessoal e sensível é redigido
antes da ingestão.

## Dream Diary

O Dreaming também mantém um **Dream Diary** narrativo em `DREAMS.md`.
Depois que cada fase tem material suficiente, `memory-core` executa um turno de subagente
em segundo plano com melhor esforço (usando o modelo de runtime padrão) e acrescenta uma entrada curta no diário.

Esse diário é para leitura humana na UI de Dreams, não uma fonte de promoção.
Artefatos de diário/relatório gerados pelo Dreaming são excluídos da
promoção de curto prazo. Somente trechos de memory fundamentados são elegíveis para promoção para
`MEMORY.md`.

Também há uma trilha de preenchimento histórico fundamentado para trabalho de revisão e recuperação:

- `memory rem-harness --path ... --grounded` mostra uma prévia da saída fundamentada do diário a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` grava entradas fundamentadas reversíveis do diário em `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase deep normal já usa.
- `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos de backfill preparados sem tocar em entradas comuns do diário ou no recall ativo normal de curto prazo.

A UI de controle expõe o mesmo fluxo de backfill/reset do diário para que você possa inspecionar
os resultados na cena Dreams antes de decidir se os candidatos fundamentados
merecem promoção. A cena também mostra uma trilha fundamentada distinta para que você veja
quais entradas de curto prazo preparadas vieram de replay histórico, quais itens promovidos foram conduzidos por grounding, e para limpar apenas entradas preparadas somente fundamentadas sem
afetar o estado comum ativo de curto prazo.

## Sinais de classificação Deep

A classificação deep usa seis sinais base ponderados mais reforço de fase:

| Sinal               | Peso | Descrição                                         |
| ------------------- | ---- | ------------------------------------------------- |
| Frequência          | 0.24 | Quantos sinais de curto prazo a entrada acumulou  |
| Relevância          | 0.30 | Qualidade média de recuperação da entrada         |
| Diversidade de query | 0.15 | Contextos distintos de query/dia que a trouxeram |
| Recência            | 0.15 | Pontuação de frescor com decaimento temporal      |
| Consolidação        | 0.10 | Força de recorrência em vários dias               |
| Riqueza conceitual  | 0.06 | Densidade de tags conceituais do trecho/caminho   |

Ocorrências das fases Light e REM adicionam um pequeno aumento com decaimento por recência de
`memory/.dreams/phase-signals.json`.

## Agendamento

Quando ativado, `memory-core` gerencia automaticamente um trabalho Cron para uma varredura
completa de Dreaming. Cada varredura executa as fases em ordem: light -> REM -> deep.

Comportamento padrão de cadência:

| Configuração         | Padrão     |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Início rápido

Ative o Dreaming:

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

Ative o Dreaming com uma cadência personalizada de varredura:

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

Use a promoção via CLI para visualizar ou aplicar manualmente:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual usa limites da fase deep por padrão, a menos que sejam substituídos
com flags de CLI.

Explique por que um candidato específico seria ou não promovido:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Visualize reflexões REM, verdades candidatas e saída de promoção deep sem
gravar nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Padrões principais

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

| Chave       | Padrão     |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

Política de fase, limites e comportamento de armazenamento são detalhes internos de implementação
(não são configuração voltada ao usuário).

Consulte [Referência de configuração de Memory](/pt-BR/reference/memory-config#dreaming)
para ver a lista completa de chaves.

## UI de Dreams

Quando ativada, a aba **Dreams** do Gateway mostra:

- estado atual de ativação do Dreaming
- status por fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e promovidas no dia
- horário da próxima execução agendada
- uma trilha de cena fundamentada distinta para entradas preparadas de replay histórico
- um leitor expansível do Dream Diary alimentado por `doctor.memory.dreamDiary`

## Relacionado

- [Memory](/pt-BR/concepts/memory)
- [Memory Search](/pt-BR/concepts/memory-search)
- [CLI de memory](/pt-BR/cli/memory)
- [Referência de configuração de Memory](/pt-BR/reference/memory-config)
