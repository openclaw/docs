---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir MEMORY.md
sidebarTitle: Dreaming
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário dos Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:24:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming é o sistema de consolidação de memória em segundo plano em `memory-core`. Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para a memória durável, mantendo o processo explicável e revisável.

<Note>
Dreaming é **opt-in** e vem desativado por padrão.
</Note>

## O que o dreaming grava

Dreaming mantém dois tipos de saída:

- **Estado de máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md` existente) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda grava somente em `MEMORY.md`.

## Modelo de fases

Dreaming usa três fases cooperativas:

| Fase  | Finalidade                                  | Gravação durável  |
| ----- | ------------------------------------------- | ----------------- |
| Leve  | Classificar e preparar material recente de curto prazo | Não               |
| Profunda | Pontuar e promover candidatos duráveis   | Sim (`MEMORY.md`) |
| REM   | Refletir sobre temas e ideias recorrentes   | Não               |

Essas fases são detalhes internos de implementação, não "modos" separados configurados pelo usuário.

<AccordionGroup>
  <Accordion title="Light phase">
    A fase leve ingere sinais recentes de memória diária e rastros de recall, remove duplicações e prepara linhas candidatas.

    - Lê do estado de recall de curto prazo, de arquivos recentes de memória diária e de transcrições de sessão redigidas quando disponíveis.
    - Grava um bloco `## Light Sleep` gerenciado quando o armazenamento inclui saída inline.
    - Registra sinais de reforço para ranqueamento profundo posterior.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    A fase profunda decide o que se torna memória de longo prazo.

    - Ranqueia candidatos usando pontuação ponderada e gates de limite.
    - Exige que `minScore`, `minRecallCount` e `minUniqueQueries` sejam aprovados.
    - Reidrata snippets a partir de arquivos diários ativos antes de gravar, então snippets obsoletos/excluídos são ignorados.
    - Anexa entradas promovidas a `MEMORY.md`.
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

## Ingestão de transcrição de sessão

Dreaming pode ingerir transcrições de sessão redigidas no corpus de dreaming. Quando transcrições estão disponíveis, elas são alimentadas na fase leve junto com sinais de memória diária e rastros de recall. Conteúdo pessoal e sensível é redigido antes da ingestão.

## Diário de sonhos

Dreaming também mantém um **Diário de sonhos** narrativo em `DREAMS.md`. Depois que cada fase tem material suficiente, `memory-core` executa uma rodada de subagente em segundo plano em modo best-effort e anexa uma entrada curta de diário. Ele usa o modelo padrão do runtime, a menos que `dreaming.model` esteja configurado. Se o modelo configurado estiver indisponível, o Diário de sonhos tenta novamente uma vez com o modelo padrão da sessão.

<Note>
Este diário é para leitura humana na interface Dreams, não uma fonte de promoção. Artefatos de diário/relatório gerados pelo Dreaming são excluídos da promoção de curto prazo. Somente snippets de memória fundamentados são elegíveis para promoção para `MEMORY.md`.
</Note>

Também há uma trilha fundamentada de preenchimento histórico para trabalho de revisão e recuperação:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` pré-visualiza a saída fundamentada do diário a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` grava entradas fundamentadas e reversíveis do diário em `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase profunda normal já usa.
    - `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos preparados de backfill sem tocar em entradas comuns do diário nem no recall ativo de curto prazo.

  </Accordion>
</AccordionGroup>

A Control UI expõe o mesmo fluxo de backfill/redefinição do diário para que você possa inspecionar os resultados na cena Dreams antes de decidir se os candidatos fundamentados merecem promoção. A cena também mostra uma trilha fundamentada distinta para que você possa ver quais entradas de curto prazo preparadas vieram de replay histórico, quais itens promovidos foram conduzidos por fundamentação, e limpar somente entradas preparadas exclusivamente fundamentadas sem tocar no estado comum ativo de curto prazo.

## Sinais de ranqueamento profundo

O ranqueamento profundo usa seis sinais-base ponderados mais reforço de fase:

| Sinal               | Peso | Descrição                                         |
| ------------------- | ---- | ------------------------------------------------- |
| Frequência          | 0.24 | Quantos sinais de curto prazo a entrada acumulou  |
| Relevância          | 0.30 | Qualidade média de recuperação da entrada         |
| Diversidade de consulta | 0.15 | Contextos distintos de consulta/dia que a revelaram |
| Recência            | 0.15 | Pontuação de atualização com decaimento temporal  |
| Consolidação        | 0.10 | Força de recorrência em vários dias               |
| Riqueza conceitual  | 0.06 | Densidade de tags de conceito do snippet/caminho  |

Acertos das fases leve e REM adicionam um pequeno reforço com decaimento de recência de `memory/.dreams/phase-signals.json`.

Resultados de teste shadow podem ser sobrepostos a essa pontuação-base como um sinal de revisão antes de qualquer gravação durável. Um teste útil dá ao candidato um pequeno reforço limitado, um teste neutro o mantém adiado, e um teste prejudicial o marca como rejeitado para aquela passada de pontuação. Esse sinal ainda é apenas de relatório: ele pode mudar a ordenação de candidatos ou metadados de revisão, mas não grava em `MEMORY.md` nem promove o candidato por si só.

## Cobertura do relatório de teste shadow de QA

O QA Lab inclui um cenário apenas de relatório para explorar como um teste shadow futuro do dreaming poderia revisar uma memória candidata antes da promoção. O cenário pede que um agente compare uma resposta de referência com uma resposta que pode usar a memória candidata, então grave um relatório local com um veredito, motivo e flags de risco.

Essa cobertura é intencionalmente restrita ao QA. Ela verifica que o artefato de relatório permaneça separado de `MEMORY.md` e que o agente não afirme que o candidato foi promovido. Ela não adiciona comportamento de teste shadow em produção nem altera o mecanismo de promoção da fase profunda.

O executor de teste shadow de `memory-core` mantém esse mesmo contrato apenas de relatório para caminhos de código que precisam de um artefato estável. Ele aceita o candidato, prompt do teste, resultado de referência, resultado do candidato, veredito, motivo, flags de risco e referências de evidência, então grava um relatório com `promotion action: report-only`. Vereditos úteis mapeiam para uma recomendação `promote`, vereditos neutros mapeiam para `defer`, e vereditos prejudiciais mapeiam para `reject`; nenhuma dessas recomendações grava em `MEMORY.md` nem aplica promoção de fase profunda.

## Agendamento

Quando ativado, `memory-core` gerencia automaticamente um job de cron para uma varredura completa de dreaming. Cada varredura executa as fases em ordem: leve → REM → profunda.

A varredura inclui o workspace primário de runtime e quaisquer workspaces de agente configurados, com desduplicação por caminho, para que o fan-out de workspace de subagente não exclua o `DREAMS.md` e o estado de memória do agente principal.

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

    `memory promote` manual usa os limites da fase profunda por padrão, a menos que sejam substituídos por flags da CLI.

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
  Ative ou desative a varredura de dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadência de Cron para a varredura completa de dreaming.
</ParamField>
<ParamField path="model" type="string">
  Sobrescrita opcional do modelo de subagente do Diário de sonhos. Use um valor canônico `provider/model` ao também definir uma allowlist `allowedModels` de subagente.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Contagem máxima estimada de tokens mantida de cada snippet de recall de curto prazo promovido para `MEMORY.md`. A proveniência do ranqueamento permanece visível.
</ParamField>

<Warning>
`dreaming.model` exige `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringi-lo, também defina `plugins.entries.memory-core.subagent.allowedModels`. Falhas de confiança ou allowlist permanecem visíveis em vez de cair silenciosamente em fallback; a nova tentativa cobre somente erros de modelo indisponível.
</Warning>

<Note>
A maior parte da política de fases, limites e comportamento de armazenamento são detalhes internos de implementação. Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#dreaming) para a lista completa de chaves.
</Note>

## Interface Dreams

Quando ativada, a aba **Dreams** do Gateway mostra:

- estado atual de ativação do dreaming
- status no nível de fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e promovidas hoje
- horário da próxima execução agendada
- uma trilha Scene fundamentada distinta para entradas preparadas de replay histórico
- um leitor expansível do Diário de sonhos apoiado por `doctor.memory.dreamDiary`

## Dreaming nunca executa: status mostra bloqueado

Se `openclaw memory status` relatar `Dreaming status: blocked`, o cron gerenciado existe, mas o heartbeat do agente padrão não está disparando. Verifique se o heartbeat está ativado para o agente padrão e se seu destino não é `none`, então execute `openclaw memory status --deep` novamente após o próximo intervalo de heartbeat.

## Relacionados

- [Memória](/pt-BR/concepts/memory)
- [CLI de memória](/pt-BR/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
- [Busca de memória](/pt-BR/concepts/memory-search)
