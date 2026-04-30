---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir MEMORY.md
sidebarTitle: Dreaming
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T09:44:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming é o sistema de consolidação de memória em segundo plano em `memory-core`. Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para a memória durável, mantendo o processo explicável e revisável.

<Note>
Dreaming é **opcional** e vem desativado por padrão.
</Note>

## O que o Dreaming grava

Dreaming mantém dois tipos de saída:

- **Estado de máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md` existente) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda grava somente em `MEMORY.md`.

## Modelo de fases

Dreaming usa três fases cooperativas:

| Fase     | Finalidade                                      | Gravação durável |
| -------- | ----------------------------------------------- | ---------------- |
| Leve     | Classificar e preparar material recente de curto prazo | Não              |
| Profunda | Pontuar e promover candidatos duráveis          | Sim (`MEMORY.md`) |
| REM      | Refletir sobre temas e ideias recorrentes       | Não              |

Essas fases são detalhes internos de implementação, não "modos" separados configurados pelo usuário.

<AccordionGroup>
  <Accordion title="Light phase">
    A fase leve ingere sinais recentes de memória diária e rastros de recall, remove duplicatas e prepara linhas candidatas.

    - Lê do estado de recall de curto prazo, arquivos recentes de memória diária e transcrições de sessão redigidas quando disponíveis.
    - Grava um bloco `## Light Sleep` gerenciado quando o armazenamento inclui saída inline.
    - Registra sinais de reforço para ranqueamento profundo posterior.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    A fase profunda decide o que se torna memória de longo prazo.

    - Ranqueia candidatos usando pontuação ponderada e gates de limite.
    - Exige que `minScore`, `minRecallCount` e `minUniqueQueries` sejam aprovados.
    - Reidrata trechos de arquivos diários ativos antes de gravar, então trechos obsoletos/excluídos são ignorados.
    - Acrescenta entradas promovidas a `MEMORY.md`.
    - Grava um resumo `## Deep Sleep` em `DREAMS.md` e, opcionalmente, grava `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    A fase REM extrai padrões e sinais reflexivos.

    - Cria resumos de temas e reflexões a partir de rastros recentes de curto prazo.
    - Grava um bloco `## REM Sleep` gerenciado quando o armazenamento inclui saída inline.
    - Registra sinais de reforço REM usados pelo ranqueamento profundo.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestão de transcrições de sessão

Dreaming pode ingerir transcrições de sessão redigidas no corpus de Dreaming. Quando transcrições estão disponíveis, elas são alimentadas na fase leve junto com sinais de memória diária e rastros de recall. Conteúdo pessoal e sensível é redigido antes da ingestão.

## Diário de Sonhos

Dreaming também mantém um **Diário de Sonhos** narrativo em `DREAMS.md`. Depois que cada fase tem material suficiente, `memory-core` executa uma rodada de subagente em segundo plano em regime de melhor esforço e acrescenta uma entrada curta de diário. Ele usa o modelo padrão de runtime, a menos que `dreaming.model` esteja configurado. Se o modelo configurado estiver indisponível, o Diário de Sonhos tenta novamente uma vez com o modelo padrão da sessão.

<Note>
Este diário é para leitura humana na UI de Sonhos, não uma fonte de promoção. Artefatos de diário/relatório gerados pelo Dreaming são excluídos da promoção de curto prazo. Somente trechos de memória fundamentados são elegíveis para promoção para `MEMORY.md`.
</Note>

Também há uma trilha de preenchimento histórico fundamentado para trabalho de revisão e recuperação:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` pré-visualiza a saída de diário fundamentada a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` grava entradas de diário fundamentadas e reversíveis em `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase profunda normal já usa.
    - `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos de preenchimento preparados sem tocar em entradas comuns de diário ou recall ativo de curto prazo.

  </Accordion>
</AccordionGroup>

A UI de Controle expõe o mesmo fluxo de preenchimento/redefinição do diário para que você possa inspecionar os resultados na cena de Sonhos antes de decidir se os candidatos fundamentados merecem promoção. A Cena também mostra uma trilha fundamentada distinta para que você veja quais entradas preparadas de curto prazo vieram da reprodução histórica, quais itens promovidos foram guiados por fundamentação e limpe apenas entradas preparadas somente fundamentadas sem tocar no estado comum ativo de curto prazo.

## Sinais de ranqueamento profundo

O ranqueamento profundo usa seis sinais-base ponderados mais reforço de fase:

| Sinal                  | Peso | Descrição                                             |
| ---------------------- | ---- | ----------------------------------------------------- |
| Frequência             | 0.24 | Quantos sinais de curto prazo a entrada acumulou      |
| Relevância             | 0.30 | Qualidade média de recuperação da entrada             |
| Diversidade de consulta | 0.15 | Contextos distintos de consulta/dia que a revelaram   |
| Recência               | 0.15 | Pontuação de frescor com decaimento temporal          |
| Consolidação           | 0.10 | Força de recorrência em vários dias                   |
| Riqueza conceitual     | 0.06 | Densidade de tags de conceito a partir do trecho/caminho |

Acertos das fases leve e REM adicionam um pequeno impulso com decaimento de recência a partir de `memory/.dreams/phase-signals.json`.

## Agendamento

Quando ativado, `memory-core` gerencia automaticamente um job Cron para uma varredura completa de Dreaming. Cada varredura executa as fases em ordem: leve → REM → profunda.

Comportamento de cadência padrão:

| Configuração         | Padrão        |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | modelo padrão |

## Início rápido

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Fluxo de trabalho da CLI

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual usa limites de fase profunda por padrão, a menos que sejam substituídos por flags da CLI.

  </Tab>
  <Tab title="Explain promotion">
    Explique por que um candidato específico seria ou não promovido:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Pré-visualize reflexões REM, verdades candidatas e saída de promoção profunda sem gravar nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Principais padrões

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Ative ou desative a varredura de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadência Cron para a varredura completa de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Substituição opcional do modelo de subagente do Diário de Sonhos. Use um valor canônico `provider/model` ao também definir uma allowlist `allowedModels` de subagente.
</ParamField>

<Warning>
`dreaming.model` exige `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringi-lo, também defina `plugins.entries.memory-core.subagent.allowedModels`. Falhas de confiança ou allowlist permanecem visíveis em vez de recorrer silenciosamente; a nova tentativa cobre apenas erros de modelo indisponível.
</Warning>

<Note>
A política de fases, limites e comportamento de armazenamento são detalhes internos de implementação (não configuração voltada ao usuário). Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#dreaming) para a lista completa de chaves.
</Note>

## UI de Sonhos

Quando ativada, a aba **Sonhos** do Gateway mostra:

- estado atual de ativação do Dreaming
- status em nível de fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e promovidas hoje
- horário da próxima execução agendada
- uma trilha de Cena fundamentada distinta para entradas preparadas de reprodução histórica
- um leitor expansível do Diário de Sonhos apoiado por `doctor.memory.dreamDiary`

## Relacionados

- [Memória](/pt-BR/concepts/memory)
- [CLI de memória](/pt-BR/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
- [Busca de memória](/pt-BR/concepts/memory-search)
