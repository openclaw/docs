---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase do dreaming faz
    - Você quer ajustar a consolidação sem poluir o MEMORY.md
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming (experimental)
x-i18n:
    generated_at: "2026-04-06T03:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f27da718176bebf59fe8a80fddd4fb5b6d814ac5647f6c1e8344bcfb328db9de
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (experimental)

Dreaming é o sistema de consolidação de memória em segundo plano no `memory-core`.
Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para a memória durável, mantendo
o processo explicável e passível de revisão.

Dreaming é **opt-in** e vem desativado por padrão.

## O que o dreaming grava

O dreaming mantém dois tipos de saída:

- **Estado da máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md`, se já existir) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda grava somente em `MEMORY.md`.

## Modelo de fases

O dreaming usa três fases cooperativas:

| Fase | Finalidade                                  | Gravação durável   |
| ----- | ------------------------------------------- | ------------------ |
| Leve  | Ordenar e preparar material recente de curto prazo | Não                |
| Profunda  | Pontuar e promover candidatos duráveis      | Sim (`MEMORY.md`) |
| REM   | Refletir sobre temas e ideias recorrentes   | Não                |

Essas fases são detalhes internos de implementação, não "modos"
separados configurados pelo usuário.

### Fase leve

A fase leve ingere sinais recentes de memória diária e rastros de recall, remove duplicatas
e prepara linhas candidatas.

- Lê o estado de recall de curto prazo e arquivos recentes de memória diária.
- Grava um bloco gerenciado `## Light Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço para classificação profunda posterior.
- Nunca grava em `MEMORY.md`.

### Fase profunda

A fase profunda decide o que se torna memória de longo prazo.

- Classifica candidatos usando pontuação ponderada e limites mínimos.
- Exige que `minScore`, `minRecallCount` e `minUniqueQueries` sejam atendidos.
- Reidrata trechos a partir de arquivos diários ativos antes de gravar, para que trechos obsoletos/excluídos sejam ignorados.
- Acrescenta entradas promovidas a `MEMORY.md`.
- Grava um resumo `## Deep Sleep` em `DREAMS.md` e opcionalmente grava `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

A fase REM extrai padrões e sinais reflexivos.

- Constrói resumos de temas e reflexões a partir de rastros recentes de curto prazo.
- Grava um bloco gerenciado `## REM Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço REM usados pela classificação profunda.
- Nunca grava em `MEMORY.md`.

## Diário de Sonhos

O dreaming também mantém um **Diário de Sonhos** narrativo em `DREAMS.md`.
Depois que cada fase reúne material suficiente, o `memory-core` executa, em segundo plano e em regime best-effort,
um turno de subagente (usando o modelo de runtime padrão) e acrescenta uma entrada curta ao diário.

Esse diário é para leitura humana na UI de Dreams, não uma fonte de promoção.

## Sinais de classificação profunda

A classificação profunda usa seis sinais-base ponderados mais reforço de fase:

| Sinal               | Peso | Descrição                                         |
| ------------------- | ---- | ------------------------------------------------- |
| Frequência          | 0.24 | Quantos sinais de curto prazo a entrada acumulou |
| Relevância          | 0.30 | Qualidade média de recuperação da entrada         |
| Diversidade de consultas | 0.15 | Contextos distintos de consulta/dia que a trouxeram à tona |
| Recência            | 0.15 | Pontuação de atualidade com decaimento temporal   |
| Consolidação        | 0.10 | Força de recorrência em vários dias               |
| Riqueza conceitual  | 0.06 | Densidade de tags conceituais do trecho/caminho   |

Ocorrências nas fases leve e REM adicionam um pequeno impulso com decaimento por recência a partir de
`memory/.dreams/phase-signals.json`.

## Agendamento

Quando ativado, o `memory-core` gerencia automaticamente uma tarefa cron para uma
varredura completa de dreaming. Cada varredura executa as fases nesta ordem: leve -> REM -> profunda.

Comportamento padrão de cadência:

| Configuração         | Padrão     |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Início rápido

Ative o dreaming:

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

Ative o dreaming com uma cadência de varredura personalizada:

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

## Fluxo da CLI

Use a promoção pela CLI para visualizar ou aplicar manualmente:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

O `memory promote` manual usa os limites da fase profunda por padrão, a menos que sejam substituídos
com flags da CLI.

## Valores padrão principais

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

| Chave       | Padrão     |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

A política de fases, os limites e o comportamento de armazenamento são detalhes internos de implementação
(não são configurações voltadas ao usuário).

Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#dreaming-experimental)
para ver a lista completa de chaves.

## UI de Dreams

Quando ativada, a aba **Dreams** do Gateway mostra:

- estado atual de ativação do dreaming
- status no nível de fase e presença de varredura gerenciada
- contagens de curto prazo, longo prazo e promovidos hoje
- horário da próxima execução agendada
- um leitor expansível do Diário de Sonhos com suporte de `doctor.memory.dreamDiary`

## Relacionados

- [Memory](/pt-BR/concepts/memory)
- [Memory Search](/pt-BR/concepts/memory-search)
- [memory CLI](/cli/memory)
- [referência de configuração de memória](/pt-BR/reference/memory-config)
