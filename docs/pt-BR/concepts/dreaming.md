---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase do Dreaming faz
    - Você quer ajustar a consolidação sem poluir o MEMORY.md
sidebarTitle: Dreaming
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming
x-i18n:
    generated_at: "2026-07-12T15:04:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming é o sistema de consolidação de memória em segundo plano do `memory-core`. Ele transfere sinais fortes de curto prazo para a memória durável, mantendo o processo explicável e passível de revisão.

<Note>
Dreaming é **opcional** e vem desativado por padrão.
</Note>

## O que o Dreaming grava

- **Estado da máquina** em `memory/.dreams/` (armazenamento de recuperação, sinais de fase, pontos de verificação de ingestão, bloqueios).
- **Saída legível por humanos** em `DREAMS.md` (ou em um `dreams.md` existente) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção de longo prazo continua gravando apenas em `MEMORY.md`.

## Modelo de fases

O Dreaming executa três fases cooperativas por varredura, nesta ordem: leve -> REM -> profunda. Essas são fases internas de implementação, não modos separados configurados pelo usuário.

| Fase     | Finalidade                                      | Gravação durável  |
| -------- | ----------------------------------------------- | ----------------- |
| Leve     | Organizar e preparar material recente de curto prazo | Não          |
| REM      | Refletir sobre temas e ideias recorrentes       | Não               |
| Profunda | Pontuar e promover candidatos duráveis          | Sim (`MEMORY.md`)  |

<AccordionGroup>
  <Accordion title="Fase leve">
    - Lê o estado recente de recuperação de curto prazo, arquivos diários de memória e transcrições de sessão com dados confidenciais removidos, quando disponíveis.
    - Elimina sinais duplicados e prepara linhas candidatas.
    - Grava um bloco gerenciado `## Light Sleep` quando o armazenamento inclui saída em linha.
    - Registra sinais de reforço para a classificação profunda posterior.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase REM">
    - Cria resumos temáticos e reflexivos a partir de rastros recentes de curto prazo.
    - Grava um bloco gerenciado `## REM Sleep` quando o armazenamento inclui saída em linha.
    - Registra sinais de reforço REM usados pela classificação profunda.
    - Nunca grava em `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase profunda">
    - Classifica candidatos com pontuação ponderada e limites mínimos (`minScore`, `minRecallCount` e `minUniqueQueries` devem ser todos atendidos).
    - Reidrata trechos de arquivos diários ativos antes da gravação, portanto trechos obsoletos ou excluídos são ignorados.
    - Acrescenta entradas promovidas a `MEMORY.md`.
    - Grava um resumo `## Deep Sleep` em `DREAMS.md` e, opcionalmente, em `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Ingestão de transcrições de sessão

O Dreaming pode ingerir transcrições de sessão com dados confidenciais removidos no corpus do Dreaming. Quando disponíveis, as transcrições alimentam a fase leve junto com sinais diários de memória e rastros de recuperação. Conteúdo pessoal e confidencial é removido antes da ingestão.

## Diário de sonhos

O Dreaming mantém um **Diário de sonhos** narrativo em `DREAMS.md`. Depois que cada fase reúne material suficiente, o `memory-core` executa, em segundo plano e com melhor esforço, um turno de subagente e acrescenta uma entrada curta ao diário, usando o modelo padrão do runtime, a menos que `dreaming.model` esteja configurado. Se o modelo configurado estiver indisponível, a execução do diário tentará novamente uma vez com o modelo padrão da sessão; falhas de confiança ou de lista de permissões não serão repetidas e permanecerão visíveis nos logs, em vez de recorrer silenciosamente a uma entrada genérica no diário.

<Note>
O diário destina-se à leitura humana na interface de sonhos, não serve como fonte de promoção. Os artefatos de diário e de relatório são excluídos da promoção de curto prazo; somente trechos de memória fundamentados podem ser promovidos para `MEMORY.md`.
</Note>

Também há um fluxo de preenchimento retroativo histórico fundamentado para trabalhos de revisão e recuperação:

<AccordionGroup>
  <Accordion title="Comandos de preenchimento retroativo">
    - `memory rem-harness --path ... --grounded` mostra uma prévia da saída fundamentada do diário a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` grava entradas fundamentadas e reversíveis do diário em `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo usado pela fase profunda normal.
    - `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos preparados de preenchimento retroativo sem alterar entradas comuns do diário nem a recuperação ativa de curto prazo.

  </Accordion>
</AccordionGroup>

A interface de controle oferece o mesmo fluxo de preenchimento retroativo e redefinição do diário na aba Memory do agente (página Agents), para que você possa inspecionar os resultados na cena de sonhos antes de decidir se os candidatos fundamentados merecem promoção. Um fluxo distinto de cena fundamentada mostra quais entradas de curto prazo preparadas vieram da reprodução histórica, quais itens promovidos foram conduzidos por conteúdo fundamentado e permite limpar apenas entradas preparadas exclusivamente fundamentadas sem alterar o estado ativo de curto prazo.

## Sinais da classificação profunda

A classificação profunda usa seis sinais básicos ponderados, além do reforço das fases:

| Sinal                | Peso | Descrição                                                  |
| -------------------- | ---- | ---------------------------------------------------------- |
| Relevância           | 0.30 | Qualidade média de recuperação da entrada                   |
| Frequência           | 0.24 | Quantos sinais de curto prazo a entrada acumulou            |
| Diversidade de consultas | 0.15 | Contextos distintos de consulta/dia que a revelaram     |
| Recenticidade        | 0.15 | Pontuação de atualidade reduzida com o tempo                 |
| Consolidação         | 0.10 | Intensidade da recorrência ao longo de vários dias          |
| Riqueza conceitual   | 0.06 | Densidade de tags conceituais do trecho/caminho             |

Ocorrências nas fases leve e REM acrescentam um pequeno reforço reduzido com o tempo, proveniente de `memory/.dreams/phase-signals.json`.

Os resultados de testes paralelos podem ser sobrepostos à pontuação básica como sinal de revisão antes de qualquer gravação durável: um teste útil concede ao candidato um pequeno reforço limitado, um teste neutro mantém o candidato adiado e um teste prejudicial o marca como rejeitado naquela avaliação. Esse sinal serve apenas para relatórios — ele pode alterar a ordem dos candidatos ou os metadados de revisão, mas nunca grava em `MEMORY.md` nem promove um candidato por conta própria.

### Cobertura do relatório de teste paralelo de QA

O QA Lab inclui um cenário exclusivo para relatórios destinado a explorar como um futuro teste paralelo do Dreaming poderia revisar uma memória candidata antes da promoção: um agente compara uma resposta de referência com uma resposta que pode usar a memória candidata e, em seguida, grava um relatório local com um veredito, motivo e indicadores de risco. Essa cobertura limita-se ao QA — ela verifica se o artefato de relatório permanece separado de `MEMORY.md` e se o agente nunca afirma que o candidato foi promovido. Ela não adiciona comportamento de teste paralelo à produção nem altera o mecanismo de promoção da fase profunda.

O executor de testes paralelos do `memory-core` mantém o mesmo contrato exclusivo para relatórios nos caminhos de código que precisam de um artefato estável. Ele aceita o candidato, o prompt do teste, o resultado de referência, o resultado do candidato, o veredito, o motivo, os indicadores de risco e as referências de evidência; em seguida, grava um relatório com `promotion action: report-only`. Vereditos úteis correspondem a uma recomendação `promote`, vereditos neutros correspondem a `defer` e vereditos prejudiciais correspondem a `reject` — nenhum deles grava em `MEMORY.md` nem aplica a promoção da fase profunda.

## Agendamento

Quando ativado, o `memory-core` gerencia automaticamente um trabalho Cron para uma varredura completa do Dreaming, sem duplicações entre o workspace principal do runtime e qualquer workspace de agente configurado, para que a distribuição entre workspaces de subagentes não exclua o `DREAMS.md` e o estado de memória do agente principal.

| Configuração          | Padrão        |
| --------------------- | ------------- |
| `dreaming.frequency`  | `0 3 * * *`   |
| `dreaming.model`      | modelo padrão |

## Início rápido

<Tabs>
  <Tab title="Ativar o Dreaming">
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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` e `/dreaming off` exigem status de proprietário para chamadores de canal ou `operator.admin` para clientes do Gateway. `/dreaming status` e `/dreaming help` são somente leitura.

## Fluxo de trabalho da CLI

<Tabs>
  <Tab title="Prévia/aplicação da promoção">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    O comando manual `memory promote` usa os limites da fase profunda por padrão, a menos que sejam substituídos por flags da CLI.

  </Tab>
  <Tab title="Explicar a promoção">
    Explique por que um candidato específico seria ou não promovido:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Prévia do ambiente de teste REM">
    Visualize previamente as reflexões REM, as verdades candidatas e a saída de promoção profunda sem gravar nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Principais padrões

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Ativa ou desativa a varredura do Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadência Cron da varredura completa do Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Substituição opcional do modelo do subagente do Diário de sonhos. Use um valor canônico `provider/model` ao também definir uma lista de permissões `allowedModels` para o subagente.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Número máximo estimado de tokens preservados de cada trecho de recuperação de curto prazo promovido para `MEMORY.md`. A proveniência da classificação permanece visível.
</ParamField>

<Warning>
`dreaming.model` exige `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringi-lo, defina também `plugins.entries.memory-core.subagent.allowedModels`. A repetição automática abrange apenas erros de modelo indisponível; falhas de confiança ou de lista de permissões permanecem visíveis nos logs, em vez de recorrer silenciosamente a outra opção.
</Warning>

<Note>
A maior parte das políticas de fase, dos limites e do comportamento de armazenamento consiste em detalhes internos de implementação. Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#dreaming) para ver a lista completa de chaves.
</Note>

## Interface de sonhos

Quando ativada, a aba **Dreams** do Gateway mostra:

- estado atual de ativação do Dreaming
- status por fase e presença da varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e de itens promovidos hoje
- horário da próxima execução agendada
- um fluxo distinto de cena fundamentada para entradas preparadas de reprodução histórica
- um leitor expansível do Diário de sonhos, fornecido por `doctor.memory.dreamDiary`

## Relacionados

- [Memória](/pt-BR/concepts/memory)
- [CLI de memória](/pt-BR/cli/memory)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
