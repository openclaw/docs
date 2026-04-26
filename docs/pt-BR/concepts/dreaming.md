---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir o MEMORY.md
sidebarTitle: Dreaming
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:26:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming é o sistema de consolidação de memória em segundo plano no `memory-core`. Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para memória durável, mantendo o processo explicável e revisável.

<Note>
Dreaming é **opt-in** e vem desativado por padrão.
</Note>

## O que o Dreaming grava

O Dreaming mantém dois tipos de saída:

- **Estado de máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md` existente) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda grava apenas em `MEMORY.md`.

## Modelo de fases

O Dreaming usa três fases cooperativas:

| Fase | Objetivo                                  | Gravação durável   |
| ----- | ----------------------------------------- | ------------------ |
| Leve  | Classificar e preparar material recente de curto prazo | Não                |
| Profunda | Pontuar e promover candidatos duráveis | Sim (`MEMORY.md`)  |
| REM   | Refletir sobre temas e ideias recorrentes | Não                |

Essas fases são detalhes internos de implementação, não "modos" separados configurados pelo usuário.

<AccordionGroup>
  <Accordion title="Fase leve">
    A fase leve ingere sinais recentes de memória diária e rastros de recall, remove duplicatas e prepara linhas candidatas.

    - Lê do estado de recall de curto prazo, de arquivos recentes de memória diária e de transcrições de sessão redigidas, quando disponíveis.
    - Grava um bloco gerenciado `## Light Sleep` quando o armazenamento inclui saída inline.
    - Registra sinais de reforço para classificação profunda posterior.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase profunda">
    A fase profunda decide o que se torna memória de longo prazo.

    - Classifica candidatos usando pontuação ponderada e limites de corte.
    - Exige aprovação em `minScore`, `minRecallCount` e `minUniqueQueries`.
    - Reidrata trechos de arquivos diários ativos antes de gravar, portanto trechos obsoletos/excluídos são ignorados.
    - Acrescenta entradas promovidas a `MEMORY.md`.
    - Grava um resumo `## Deep Sleep` em `DREAMS.md` e opcionalmente grava `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    A fase REM extrai padrões e sinais reflexivos.

    - Constrói resumos de temas e reflexões a partir de rastros recentes de curto prazo.
    - Grava um bloco gerenciado `## REM Sleep` quando o armazenamento inclui saída inline.
    - Registra sinais de reforço REM usados pela classificação profunda.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestão de transcrições de sessão

O Dreaming pode ingerir transcrições de sessão redigidas no corpus de Dreaming. Quando transcrições estão disponíveis, elas são alimentadas na fase leve junto com sinais de memória diária e rastros de recall. Conteúdo pessoal e sensível é redigido antes da ingestão.

## Diário de Sonhos

O Dreaming também mantém um **Diário de Sonhos** narrativo em `DREAMS.md`. Depois que cada fase tem material suficiente, o `memory-core` executa uma rodada best-effort de subagente em segundo plano (usando o modelo padrão de runtime) e acrescenta uma breve entrada de diário.

<Note>
Este diário é para leitura humana na UI de Dreams, não uma fonte de promoção. Artefatos de diário/relatório gerados pelo Dreaming são excluídos da promoção de curto prazo. Apenas trechos de memória fundamentados são elegíveis para promoção em `MEMORY.md`.
</Note>

Também existe uma trilha de preenchimento histórico fundamentado para trabalhos de revisão e recuperação:

<AccordionGroup>
  <Accordion title="Comandos de backfill">
    - `memory rem-harness --path ... --grounded` visualiza a saída fundamentada do diário a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` grava entradas reversíveis de diário fundamentado em `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase profunda normal já usa.
    - `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos preparados de backfill sem tocar em entradas comuns de diário ou no recall ativo normal de curto prazo.
  </Accordion>
</AccordionGroup>

A UI de Controle expõe o mesmo fluxo de backfill/redefinição do diário para que você possa inspecionar os resultados na cena Dreams antes de decidir se os candidatos fundamentados merecem promoção. A Scene também mostra uma trilha fundamentada distinta para que você veja quais entradas preparadas de curto prazo vieram de replay histórico, quais itens promovidos foram guiados por fundamentos e limpe apenas entradas preparadas exclusivamente fundamentadas sem tocar no estado comum ativo de curto prazo.

## Sinais de classificação profunda

A classificação profunda usa seis sinais-base ponderados mais reforço de fase:

| Sinal               | Peso | Descrição                                        |
| ------------------- | ---- | ------------------------------------------------ |
| Frequência          | 0.24 | Quantos sinais de curto prazo a entrada acumulou |
| Relevância          | 0.30 | Qualidade média de recuperação da entrada        |
| Diversidade de consulta | 0.15 | Contextos distintos de consulta/dia que a expuseram |
| Recência            | 0.15 | Pontuação de frescor com decaimento temporal     |
| Consolidação        | 0.10 | Força de recorrência em vários dias              |
| Riqueza conceitual  | 0.06 | Densidade de tags de conceito do trecho/caminho  |

Acertos de fase leve e REM adicionam um pequeno reforço com decaimento temporal de `memory/.dreams/phase-signals.json`.

## Agendamento

Quando ativado, o `memory-core` gerencia automaticamente uma tarefa Cron para uma varredura completa de Dreaming. Cada varredura executa as fases em ordem: leve → REM → profunda.

Comportamento padrão de cadência:

| Configuração         | Padrão     |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Início rápido

<Tabs>
  <Tab title="Ativar Dreaming">
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
  </Tab>
  <Tab title="Cadência personalizada de varredura">
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
  </Tab>
</Tabs>

## Comando de barra

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Fluxo de trabalho da CLI

<Tabs>
  <Tab title="Visualizar / aplicar promoção">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    O `memory promote` manual usa por padrão os limites da fase profunda, salvo quando substituídos por flags da CLI.

  </Tab>
  <Tab title="Explicar promoção">
    Explique por que um candidato específico seria ou não promovido:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Visualização do harness REM">
    Visualize reflexões REM, verdades candidatas e saída de promoção profunda sem gravar nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Principais padrões

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Ativa ou desativa a varredura de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadência Cron para a varredura completa de Dreaming.
</ParamField>

<Note>
Política de fase, limites e comportamento de armazenamento são detalhes internos de implementação (não configuração voltada ao usuário). Consulte [Referência de configuração de memória](/pt-BR/reference/memory-config#dreaming) para a lista completa de chaves.
</Note>

## UI de Dreams

Quando ativada, a aba **Dreams** do Gateway mostra:

- estado atual de ativação do Dreaming
- status por fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, sinais e promovidas hoje
- horário da próxima execução agendada
- uma trilha distinta na Scene para entradas preparadas de replay histórico fundamentado
- um leitor expansível do Diário de Sonhos com base em `doctor.memory.dreamDiary`

## Relacionado

- [Memória](/pt-BR/concepts/memory)
- [CLI de memória](/pt-BR/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
