---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir o `MEMORY.md`
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming é o sistema de consolidação de memória em segundo plano em `memory-core`.
Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para memória durável,
mantendo o processo explicável e revisável.

Dreaming é **opt-in** e vem desabilitado por padrão.

## O que o Dreaming grava

O Dreaming mantém dois tipos de saída:

- **Estado de máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md`, se já existir) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda grava apenas em `MEMORY.md`.

## Modelo de fases

O Dreaming usa três fases cooperativas:

| Fase | Finalidade                                | Gravação durável   |
| ----- | ----------------------------------------- | ------------------ |
| Leve  | Classificar e preparar material recente de curto prazo | Não                |
| Profunda | Pontuar e promover candidatos duráveis | Sim (`MEMORY.md`)  |
| REM   | Refletir sobre temas e ideias recorrentes | Não                |

Essas fases são detalhes internos de implementação, não "modos" separados
configurados pelo usuário.

### Fase leve

A fase leve ingere sinais recentes de memória diária e rastros de recall, remove duplicatas
e prepara linhas candidatas.

- Lê o estado de recall de curto prazo, arquivos recentes de memória diária e transcrições de sessão com redação, quando disponíveis.
- Grava um bloco gerenciado `## Light Sleep` quando o armazenamento inclui saída embutida.
- Registra sinais de reforço para classificação profunda posterior.
- Nunca grava em `MEMORY.md`.

### Fase profunda

A fase profunda decide o que se torna memória de longo prazo.

- Classifica candidatos usando pontuação ponderada e limites mínimos.
- Exige aprovação em `minScore`, `minRecallCount` e `minUniqueQueries`.
- Reidrata trechos a partir de arquivos diários ativos antes de gravar, para que trechos obsoletos/removidos sejam ignorados.
- Acrescenta entradas promovidas a `MEMORY.md`.
- Grava um resumo `## Deep Sleep` em `DREAMS.md` e opcionalmente grava `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

A fase REM extrai padrões e sinais reflexivos.

- Constrói resumos de temas e reflexões a partir de rastros recentes de curto prazo.
- Grava um bloco gerenciado `## REM Sleep` quando o armazenamento inclui saída embutida.
- Registra sinais de reforço REM usados pela classificação profunda.
- Nunca grava em `MEMORY.md`.

## Ingestão de transcrições de sessão

O Dreaming pode ingerir transcrições de sessão com redação no corpus do Dreaming. Quando
as transcrições estão disponíveis, elas são alimentadas na fase leve junto com sinais de
memória diária e rastros de recall. Conteúdo pessoal e sensível é redigido
antes da ingestão.

## Diário de Sonhos

O Dreaming também mantém um **Diário de Sonhos** narrativo em `DREAMS.md`.
Depois que cada fase tem material suficiente, o `memory-core` executa uma melhor tentativa de turno
de subagente em segundo plano (usando o modelo de runtime padrão) e acrescenta uma entrada curta no diário.

Esse diário é para leitura humana na UI de Sonhos, não uma fonte de promoção.
Artefatos de diário/relatório gerados pelo Dreaming são excluídos da
promoção de curto prazo. Somente trechos de memória fundamentados são elegíveis para promoção em
`MEMORY.md`.

Também existe uma trilha fundamentada de preenchimento retroativo histórico para trabalho de revisão e recuperação:

- `memory rem-harness --path ... --grounded` mostra uma prévia da saída fundamentada do diário a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` grava entradas fundamentadas reversíveis do diário em `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase profunda normal já usa.
- `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos preparados de preenchimento retroativo sem tocar em entradas normais do diário nem no recall ativo de curto prazo.

A UI de Controle expõe o mesmo fluxo de preenchimento retroativo/redefinição do diário para que você possa inspecionar
os resultados na cena de Sonhos antes de decidir se os candidatos fundamentados
merecem promoção. A cena também mostra uma trilha fundamentada distinta para que você possa ver
quais entradas preparadas de curto prazo vieram de replay histórico, quais itens promovidos foram orientados por base fundamentada e limpar apenas entradas preparadas exclusivamente fundamentadas sem
tocar no estado normal ativo de curto prazo.

## Sinais de classificação profunda

A classificação profunda usa seis sinais base ponderados mais reforço por fase:

| Sinal               | Peso   | Descrição                                         |
| ------------------- | ------ | ------------------------------------------------- |
| Frequência          | 0.24   | Quantos sinais de curto prazo a entrada acumulou |
| Relevância          | 0.30   | Qualidade média de recuperação da entrada         |
| Diversidade de consultas | 0.15 | Contextos distintos de consulta/dia que a trouxeram à tona |
| Recência            | 0.15   | Pontuação de atualidade com decaimento temporal   |
| Consolidação        | 0.10   | Força de recorrência em vários dias               |
| Riqueza conceitual  | 0.06   | Densidade de tags conceituais do trecho/caminho   |

Acertos das fases leve e REM adicionam um pequeno impulso com decaimento de recência a partir de
`memory/.dreams/phase-signals.json`.

## Agendamento

Quando habilitado, o `memory-core` gerencia automaticamente um job de Cron para uma varredura completa
de Dreaming. Cada varredura executa as fases em ordem: leve -> REM -> profunda.

Comportamento padrão da cadência:

| Configuração         | Padrão     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Início rápido

Habilite o Dreaming:

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

Habilite o Dreaming com uma cadência de varredura personalizada:

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

## Comando de barra

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Fluxo de trabalho da CLI

Use a promoção via CLI para prévia ou aplicação manual:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

O `memory promote` manual usa os limites da fase profunda por padrão, a menos que sejam substituídos
com flags da CLI.

Explique por que um candidato específico seria ou não promovido:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Veja uma prévia de reflexões REM, verdades candidatas e saída de promoção profunda sem
gravar nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Principais padrões

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

| Chave       | Padrão      |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Política de fases, limites e comportamento de armazenamento são detalhes internos de implementação
(não configurações voltadas ao usuário).

Consulte [Referência de configuração de memória](/pt-BR/reference/memory-config#dreaming)
para a lista completa de chaves.

## UI de Sonhos

Quando habilitada, a aba **Sonhos** do Gateway mostra:

- estado atual de habilitação do Dreaming
- status por fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e promovidas hoje
- horário da próxima execução agendada
- uma trilha distinta fundamentada na cena para entradas preparadas de replay histórico
- um leitor expansível do Diário de Sonhos com base em `doctor.memory.dreamDiary`

## Solução de problemas

### O Dreaming nunca executa (o status mostra bloqueado)

O Cron gerenciado do Dreaming depende do Heartbeat do agente padrão. Se o Heartbeat não estiver disparando para esse agente, o Cron enfileira um evento de sistema que ninguém consome e o Dreaming silenciosamente não é executado. Tanto `openclaw memory status` quanto `/dreaming status` informarão `blocked` nesse caso e nomearão o agente cujo Heartbeat está bloqueando.

Duas causas comuns:

- Outro agente declara um bloco `heartbeat:` explícito. Quando qualquer entrada em `agents.list` tem seu próprio bloco `heartbeat`, apenas esses agentes emitem Heartbeat — os padrões deixam de se aplicar a todos os demais, então o agente padrão pode ficar silencioso. Mova as configurações de Heartbeat para `agents.defaults.heartbeat` ou adicione um bloco `heartbeat` explícito ao agente padrão. Consulte [Escopo e precedência](/pt-BR/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` é `0`, vazio ou não pode ser interpretado. O Cron não tem intervalo para agendar, então o Heartbeat fica efetivamente desabilitado. Defina `every` como uma duração positiva, como `30m`. Consulte [Padrões](/pt-BR/gateway/heartbeat#defaults).

## Relacionado

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [CLI de memory](/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
