---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase de Dreaming faz
    - Você quer ajustar a consolidação sem poluir MEMORY.md
sidebarTitle: Dreaming
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T13:53:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming é o sistema de consolidação de memória em segundo plano em `memory-core`. Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para memória durável, mantendo o processo explicável e revisável.

<Note>
Dreaming é **opt-in** e vem desabilitado por padrão.
</Note>

## O que o Dreaming escreve

Dreaming mantém dois tipos de saída:

- **Estado de máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, bloqueios).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md` existente) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo ainda escreve somente em `MEMORY.md`.

## Modelo de fases

Dreaming usa três fases cooperativas:

| Fase  | Finalidade                                | Escrita durável   |
| ----- | ----------------------------------------- | ----------------- |
| Light | Classificar e preparar material recente de curto prazo | Não               |
| Deep  | Pontuar e promover candidatos duráveis    | Sim (`MEMORY.md`) |
| REM   | Refletir sobre temas e ideias recorrentes | Não               |

Essas fases são detalhes internos de implementação, não "modos" separados configurados pelo usuário.

<AccordionGroup>
  <Accordion title="Fase Light">
    A fase Light ingere sinais recentes de memória diária e rastros de recall, deduplica-os e prepara linhas candidatas.

    - Lê a partir do estado de recall de curto prazo, arquivos recentes de memória diária e transcrições de sessão redigidas quando disponíveis.
    - Escreve um bloco `## Light Sleep` gerenciado quando o armazenamento inclui saída inline.
    - Registra sinais de reforço para ranqueamento Deep posterior.
    - Nunca escreve em `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    A fase Deep decide o que se torna memória de longo prazo.

    - Ranqueia candidatos usando pontuação ponderada e gates de limite.
    - Exige que `minScore`, `minRecallCount` e `minUniqueQueries` sejam aprovados.
    - Reidrata snippets a partir de arquivos diários ativos antes de escrever, para que snippets obsoletos/excluídos sejam ignorados.
    - Acrescenta entradas promovidas a `MEMORY.md`.
    - Escreve um resumo `## Deep Sleep` em `DREAMS.md` e, opcionalmente, escreve `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    A fase REM extrai padrões e sinais reflexivos.

    - Cria resumos de temas e reflexões a partir de rastros recentes de curto prazo.
    - Escreve um bloco `## REM Sleep` gerenciado quando o armazenamento inclui saída inline.
    - Registra sinais de reforço REM usados pelo ranqueamento Deep.
    - Nunca escreve em `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestão de transcrições de sessão

Dreaming pode ingerir transcrições de sessão redigidas no corpus de Dreaming. Quando transcrições estão disponíveis, elas são alimentadas na fase Light junto com sinais de memória diária e rastros de recall. Conteúdo pessoal e sensível é redigido antes da ingestão.

## Diário de Sonhos

Dreaming também mantém um **Diário de Sonhos** narrativo em `DREAMS.md`. Depois que cada fase tem material suficiente, `memory-core` executa uma tentativa em segundo plano de subagente e acrescenta uma entrada curta de diário. Ele usa o modelo padrão do runtime, a menos que `dreaming.model` esteja configurado. Se o modelo configurado estiver indisponível, o Diário de Sonhos tenta novamente uma vez com o modelo padrão da sessão.

<Note>
Este diário é para leitura humana na UI de Sonhos, não uma fonte de promoção. Artefatos de diário/relatório gerados por Dreaming são excluídos da promoção de curto prazo. Somente snippets de memória fundamentados são elegíveis para promoção para `MEMORY.md`.
</Note>

Também há uma pista de preenchimento histórico fundamentado para trabalho de revisão e recuperação:

<AccordionGroup>
  <Accordion title="Comandos de preenchimento">
    - `memory rem-harness --path ... --grounded` pré-visualiza a saída fundamentada de diário a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escreve entradas reversíveis de diário fundamentado em `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase Deep normal já usa.
    - `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos de preenchimento preparados sem tocar em entradas comuns de diário ou recall ativo de curto prazo.

  </Accordion>
</AccordionGroup>

A UI de Controle expõe o mesmo fluxo de preenchimento/redefinição de diário para que você possa inspecionar os resultados na cena Sonhos antes de decidir se os candidatos fundamentados merecem promoção. A Cena também mostra uma pista fundamentada distinta para que você possa ver quais entradas de curto prazo preparadas vieram de replay histórico, quais itens promovidos foram liderados por fundamentação, e limpar somente entradas preparadas exclusivamente fundamentadas sem tocar no estado comum ativo de curto prazo.

## Sinais de ranqueamento Deep

O ranqueamento Deep usa seis sinais base ponderados mais reforço de fase:

| Sinal               | Peso | Descrição                                         |
| ------------------- | ---- | ------------------------------------------------- |
| Frequência          | 0.24 | Quantos sinais de curto prazo a entrada acumulou  |
| Relevância          | 0.30 | Qualidade média de recuperação da entrada         |
| Diversidade de consulta | 0.15 | Contextos distintos de consulta/dia que a revelaram |
| Recenticidade       | 0.15 | Pontuação de frescor com decaimento temporal      |
| Consolidação        | 0.10 | Força de recorrência em múltiplos dias            |
| Riqueza conceitual  | 0.06 | Densidade de tags de conceito do snippet/caminho  |

Acertos das fases Light e REM adicionam um pequeno impulso com decaimento de recenticidade a partir de `memory/.dreams/phase-signals.json`.

Resultados de testes sombra podem ser sobrepostos a essa pontuação base como um sinal de revisão antes de qualquer escrita durável. Um teste útil dá ao candidato um pequeno impulso limitado, um teste neutro o mantém adiado, e um teste prejudicial o marca como rejeitado para aquela passagem de pontuação. Esse sinal ainda é somente de relatório: ele pode alterar a ordenação de candidatos ou metadados de revisão, mas não escreve em `MEMORY.md` nem promove o candidato por conta própria.

## Cobertura de relatório de teste sombra de QA

O QA Lab inclui um cenário somente de relatório para explorar como um futuro teste sombra de Dreaming poderia revisar uma memória candidata antes da promoção. O cenário pede que um agente compare uma resposta de baseline com uma resposta que pode usar a memória candidata e, então, escreva um relatório local com um veredito, motivo e flags de risco.

Essa cobertura é intencionalmente limitada ao QA. Ela verifica que o artefato de relatório permanece separado de `MEMORY.md` e que o agente não afirma que o candidato foi promovido. Ela não adiciona comportamento de teste sombra em produção nem altera o mecanismo de promoção da fase Deep.

O executor de teste sombra de `memory-core` mantém esse mesmo contrato somente de relatório para caminhos de código que precisam de um artefato estável. Ele aceita o candidato, prompt do teste, resultado de baseline, resultado do candidato, veredito, motivo, flags de risco e referências de evidência; então escreve um relatório com `promotion action: report-only`. Vereditos úteis mapeiam para uma recomendação `promote`, vereditos neutros mapeiam para `defer`, e vereditos prejudiciais mapeiam para `reject`; nenhuma dessas recomendações escreve em `MEMORY.md` nem aplica promoção da fase Deep.

## Agendamento

Quando habilitado, `memory-core` gerencia automaticamente um job de Cron para uma varredura completa de Dreaming. Cada varredura executa as fases em ordem: Light → REM → Deep.

A varredura inclui o workspace principal do runtime e quaisquer workspaces de agente configurados, deduplicados por caminho, para que o fan-out de workspace de subagente não exclua o `DREAMS.md` e o estado de memória do agente principal.

Comportamento de cadência padrão:

| Configuração         | Padrão        |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | modelo padrão |

## Início rápido

<Tabs>
  <Tab title="Habilitar Dreaming">
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

`/dreaming on` e `/dreaming off` alteram a configuração em todo o Gateway. Chamadores de canal devem ser proprietários, e clientes do Gateway devem ter `operator.admin`. `/dreaming status` e `/dreaming help` permanecem somente leitura.

## Fluxo de trabalho da CLI

<Tabs>
  <Tab title="Prévia / aplicação de promoção">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual usa os limites da fase Deep por padrão, a menos que sejam substituídos por flags da CLI.

  </Tab>
  <Tab title="Explicar promoção">
    Explique por que um candidato específico seria ou não promovido:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Prévia do harness REM">
    Pré-visualize reflexões REM, verdades candidatas e saída de promoção Deep sem escrever nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Padrões principais

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Habilita ou desabilita a varredura de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadência de Cron para a varredura completa de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Substituição opcional do modelo do subagente do Diário de Sonhos. Use um valor canônico `provider/model` ao também definir uma lista de permissões `allowedModels` de subagente.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Contagem máxima estimada de tokens mantida de cada snippet de recall de curto prazo promovido para `MEMORY.md`. A proveniência do ranqueamento permanece visível.
</ParamField>

<Warning>
`dreaming.model` exige `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringi-lo, defina também `plugins.entries.memory-core.subagent.allowedModels`. Falhas de confiança ou de lista de permissões permanecem visíveis em vez de cair silenciosamente para fallback; a nova tentativa cobre apenas erros de modelo indisponível.
</Warning>

<Note>
A maior parte da política de fases, limites e comportamento de armazenamento são detalhes internos de implementação. Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#dreaming) para a lista completa de chaves.
</Note>

## UI de Sonhos

Quando habilitada, a aba **Sonhos** do Gateway mostra:

- estado atual de habilitação do Dreaming
- status em nível de fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e promovidas hoje
- horário da próxima execução agendada
- uma pista de Cena fundamentada distinta para entradas preparadas de replay histórico
- um leitor expansível do Diário de Sonhos baseado em `doctor.memory.dreamDiary`

## Dreaming nunca executa: status mostra bloqueado

Se `openclaw memory status` relatar `Dreaming status: blocked`, o Cron gerenciado existe, mas o Heartbeat do agente padrão não está disparando. Verifique se o Heartbeat está habilitado para o agente padrão e se o destino dele não é `none`; então execute `openclaw memory status --deep` novamente após o próximo intervalo de Heartbeat.

## Relacionado

- [Memória](/pt-BR/concepts/memory)
- [CLI de memória](/pt-BR/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
