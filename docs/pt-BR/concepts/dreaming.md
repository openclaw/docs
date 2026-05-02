---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir MEMORY.md
sidebarTitle: Dreaming
summary: Consolidação de memória em segundo plano com fases leves, profundas e REM, além de um Diário de Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming é o sistema de consolidação de memória em segundo plano no `memory-core`. Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para a memória durável, mantendo o processo explicável e revisável.

<Note>
Dreaming é **opt-in** e vem desativado por padrão.
</Note>

## O que o dreaming grava

Dreaming mantém dois tipos de saída:

- **Estado da máquina** em `memory/.dreams/` (armazenamento de recuperação, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md` existente) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda grava apenas em `MEMORY.md`.

## Modelo de fases

Dreaming usa três fases cooperativas:

| Fase | Propósito                                   | Gravação durável  |
| ----- | ----------------------------------------- | ----------------- |
| Leve | Classificar e preparar material recente de curto prazo | Não               |
| Profunda  | Pontuar e promover candidatos duráveis      | Sim (`MEMORY.md`) |
| REM   | Refletir sobre temas e ideias recorrentes     | Não               |

Essas fases são detalhes internos de implementação, não "modos" separados configurados pelo usuário.

<AccordionGroup>
  <Accordion title="Fase leve">
    A fase leve ingere sinais recentes de memória diária e rastros de recuperação, remove duplicatas e prepara linhas candidatas.

    - Lê do estado de recuperação de curto prazo, arquivos recentes de memória diária e transcrições de sessão redigidas quando disponíveis.
    - Grava um bloco `## Light Sleep` gerenciado quando o armazenamento inclui saída inline.
    - Registra sinais de reforço para ranqueamento profundo posterior.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase profunda">
    A fase profunda decide o que se torna memória de longo prazo.

    - Ranqueia candidatos usando pontuação ponderada e gates de limite.
    - Exige que `minScore`, `minRecallCount` e `minUniqueQueries` sejam aprovados.
    - Reidrata snippets de arquivos diários ativos antes de gravar, então snippets obsoletos/excluídos são ignorados.
    - Acrescenta entradas promovidas a `MEMORY.md`.
    - Grava um resumo `## Deep Sleep` em `DREAMS.md` e, opcionalmente, grava `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    A fase REM extrai padrões e sinais reflexivos.

    - Cria resumos de temas e reflexões a partir de rastros recentes de curto prazo.
    - Grava um bloco `## REM Sleep` gerenciado quando o armazenamento inclui saída inline.
    - Registra sinais de reforço REM usados pelo ranqueamento profundo.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestão de transcrições de sessão

Dreaming pode ingerir transcrições de sessão redigidas no corpus de dreaming. Quando as transcrições estão disponíveis, elas são enviadas para a fase leve junto com sinais de memória diária e rastros de recuperação. Conteúdo pessoal e sensível é redigido antes da ingestão.

## Dream Diary

Dreaming também mantém um **Dream Diary** narrativo em `DREAMS.md`. Depois que cada fase tem material suficiente, `memory-core` executa uma rodada de subagente em segundo plano em modo best-effort e acrescenta uma entrada curta de diário. Ele usa o modelo padrão de runtime, a menos que `dreaming.model` esteja configurado. Se o modelo configurado estiver indisponível, o Dream Diary tenta novamente uma vez com o modelo padrão da sessão.

<Note>
Este diário é para leitura humana na UI Dreams, não uma fonte de promoção. Artefatos de diário/relatório gerados pelo Dreaming são excluídos da promoção de curto prazo. Apenas snippets de memória fundamentados são elegíveis para promoção para `MEMORY.md`.
</Note>

Também há uma trilha de backfill histórico fundamentado para trabalho de revisão e recuperação:

<AccordionGroup>
  <Accordion title="Comandos de backfill">
    - `memory rem-harness --path ... --grounded` pré-visualiza a saída de diário fundamentada a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` grava entradas reversíveis de diário fundamentado em `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase profunda normal já usa.
    - `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos de backfill preparados sem tocar em entradas comuns de diário ou na recuperação ativa de curto prazo.

  </Accordion>
</AccordionGroup>

A Control UI expõe o mesmo fluxo de backfill/reset de diário para que você possa inspecionar os resultados na cena Dreams antes de decidir se os candidatos fundamentados merecem promoção. A Scene também mostra uma trilha fundamentada distinta para que você possa ver quais entradas de curto prazo preparadas vieram de replay histórico, quais itens promovidos foram conduzidos por fundamentação, e limpar apenas entradas preparadas exclusivamente fundamentadas sem tocar no estado ativo comum de curto prazo.

## Sinais de ranqueamento profundo

O ranqueamento profundo usa seis sinais base ponderados mais reforço de fase:

| Sinal              | Peso | Descrição                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frequência           | 0.24   | Quantos sinais de curto prazo a entrada acumulou |
| Relevância           | 0.30   | Qualidade média de recuperação da entrada           |
| Diversidade de consulta     | 0.15   | Contextos distintos de consulta/dia que a revelaram      |
| Recência             | 0.15   | Pontuação de atualidade com decaimento temporal                      |
| Consolidação       | 0.10   | Força de recorrência em vários dias                     |
| Riqueza conceitual | 0.06   | Densidade de tags conceituais do snippet/caminho             |

Acertos das fases leve e REM adicionam um pequeno boost com decaimento por recência a partir de `memory/.dreams/phase-signals.json`.

## Agendamento

Quando habilitado, `memory-core` gerencia automaticamente um job cron para uma varredura completa de dreaming. Cada varredura executa as fases em ordem: leve → REM → profunda.

A varredura inclui o workspace principal de runtime e quaisquer workspaces de agentes configurados, sem duplicatas por caminho, para que o fan-out de workspace de subagentes não exclua o `DREAMS.md` e o estado de memória do agente principal.

Comportamento de cadência padrão:

| Configuração              | Padrão       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | modelo padrão |

## Início rápido

<Tabs>
  <Tab title="Habilitar dreaming">
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

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Fluxo de trabalho da CLI

<Tabs>
  <Tab title="Prévia / aplicação de promoção">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    O `memory promote` manual usa os limites da fase profunda por padrão, a menos que sejam sobrescritos com flags da CLI.

  </Tab>
  <Tab title="Explicar promoção">
    Explique por que um candidato específico seria ou não promovido:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Prévia do harness REM">
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
  Habilite ou desabilite a varredura de dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadência Cron para a varredura completa de dreaming.
</ParamField>
<ParamField path="model" type="string">
  Sobrescrita opcional de modelo de subagente do Dream Diary. Use um valor canônico `provider/model` ao também definir uma allowlist `allowedModels` de subagente.
</ParamField>

<Warning>
`dreaming.model` exige `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringi-lo, também defina `plugins.entries.memory-core.subagent.allowedModels`. Falhas de confiança ou allowlist permanecem visíveis em vez de fazer fallback silenciosamente; a nova tentativa cobre apenas erros de modelo indisponível.
</Warning>

<Note>
Política de fases, limites e comportamento de armazenamento são detalhes internos de implementação (não configuração voltada ao usuário). Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#dreaming) para a lista completa de chaves.
</Note>

## UI Dreams

Quando habilitada, a aba **Dreams** do Gateway mostra:

- estado atual de dreaming habilitado
- status em nível de fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e promovidas hoje
- horário da próxima execução agendada
- uma trilha Scene fundamentada distinta para entradas preparadas de replay histórico
- um leitor expansível do Dream Diary apoiado por `doctor.memory.dreamDiary`

## Dreaming nunca executa: o status mostra bloqueado

Se `openclaw memory status` relatar `Dreaming status: blocked`, o cron gerenciado existe, mas o Heartbeat do agente padrão não está disparando. Verifique se o Heartbeat está habilitado para o agente padrão e se o destino dele não é `none`; depois execute `openclaw memory status --deep` novamente após o próximo intervalo de Heartbeat.

## Relacionado

- [Memória](/pt-BR/concepts/memory)
- [CLI de memória](/pt-BR/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
- [Busca de memória](/pt-BR/concepts/memory-search)
