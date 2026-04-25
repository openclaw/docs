---
read_when:
    - Revisando a série de PRs de paridade GPT-5.4 / Codex
    - Mantendo a arquitetura agêntica de seis contratos por trás do programa de paridade
summary: Como revisar o programa de paridade GPT-5.4 / Codex como quatro unidades de merge
title: Observações do maintainer de paridade GPT-5.4 / Codex
x-i18n:
    generated_at: "2026-04-25T13:48:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 162ea68476880d4dbf9b8c3b9397a51a2732c3eb10ac52e421a9c9d90e04eec2
    source_path: help/gpt54-codex-agentic-parity-maintainers.md
    workflow: 15
---

Esta observação explica como revisar o programa de paridade GPT-5.4 / Codex como quatro unidades de merge sem perder a arquitetura original de seis contratos.

## Unidades de merge

### PR A: execução estritamente agêntica

É responsável por:

- `executionContract`
- continuidade no mesmo turno com GPT-5 em primeiro lugar
- `update_plan` como rastreamento de progresso não terminal
- estados explícitos de bloqueio em vez de paradas silenciosas só com plano

Não é responsável por:

- classificação de falhas de autenticação/runtime
- veracidade de permissões
- reformulação de replay/continuação
- benchmarking de paridade

### PR B: veracidade do runtime

É responsável por:

- correção do escopo OAuth do Codex
- classificação tipada de falhas de provedor/runtime
- disponibilidade verdadeira de `/elevated full` e motivos de bloqueio

Não é responsável por:

- normalização de schema de ferramenta
- estado de replay/liveness
- gating de benchmark

### PR C: correção da execução

É responsável por:

- compatibilidade de ferramentas OpenAI/Codex pertencentes ao provedor
- tratamento estrito de schema sem parâmetros
- exposição de replay inválido
- visibilidade de estado para tarefas longas pausadas, bloqueadas e abandonadas

Não é responsável por:

- continuação autoeleita
- comportamento genérico do dialeto Codex fora de hooks do provedor
- gating de benchmark

### PR D: harness de paridade

É responsável por:

- primeiro pacote de cenários GPT-5.4 vs Opus 4.6
- documentação de paridade
- mecânica de relatório de paridade e gate de release

Não é responsável por:

- mudanças de comportamento de runtime fora do QA-lab
- simulação de auth/proxy/DNS dentro do harness

## Mapeamento de volta para os seis contratos originais

| Contrato original                         | Unidade de merge |
| ----------------------------------------- | ---------------- |
| Correção de transporte/auth do provedor   | PR B             |
| Compatibilidade de contrato/schema de ferramenta | PR C       |
| Execução no mesmo turno                   | PR A             |
| Veracidade de permissões                  | PR B             |
| Correção de replay/continuação/liveness   | PR C             |
| Benchmark/gate de release                 | PR D             |

## Ordem de revisão

1. PR A
2. PR B
3. PR C
4. PR D

PR D é a camada de prova. Não deve ser o motivo para atrasar PRs de correção de runtime.

## O que observar

### PR A

- execuções GPT-5 agem ou falham de forma segura em vez de parar em comentário
- `update_plan` não parece mais progresso por si só
- o comportamento continua com GPT-5 em primeiro lugar e com escopo limitado ao Pi embutido

### PR B

- falhas de auth/proxy/runtime deixam de colapsar em tratamento genérico de “falha do modelo”
- `/elevated full` só é descrito como disponível quando realmente está disponível
- motivos de bloqueio são visíveis tanto para o modelo quanto para o runtime visível ao usuário

### PR C

- o registro estrito de ferramentas OpenAI/Codex se comporta de forma previsível
- ferramentas sem parâmetros não falham em verificações de schema estrito
- resultados de replay e Compaction preservam um estado verdadeiro de liveness

### PR D

- o pacote de cenários é compreensível e reproduzível
- o pacote inclui uma lane mutável de segurança de replay, não apenas fluxos somente leitura
- relatórios são legíveis por humanos e automação
- afirmações de paridade são apoiadas por evidências, não por anedotas

Artefatos esperados da PR D:

- `qa-suite-report.md` / `qa-suite-summary.json` para cada execução de modelo
- `qa-agentic-parity-report.md` com comparação agregada e por cenário
- `qa-agentic-parity-summary.json` com um veredito legível por máquina

## Gate de release

Não afirme paridade ou superioridade do GPT-5.4 sobre o Opus 4.6 até que:

- PR A, PR B e PR C tenham sido mergeadas
- PR D execute o primeiro pacote de paridade sem falhas
- suítes de regressão de veracidade do runtime permaneçam verdes
- o relatório de paridade não mostre casos de sucesso falso nem regressão no comportamento de parada

```mermaid
flowchart LR
    A["PR A-C merged"] --> B["Run GPT-5.4 parity pack"]
    A --> C["Run Opus 4.6 parity pack"]
    B --> D["qa-suite-summary.json"]
    C --> E["qa-suite-summary.json"]
    D --> F["qa parity-report"]
    E --> F
    F --> G["Markdown report + JSON verdict"]
    G --> H{"Pass?"}
    H -- "yes" --> I["Parity claim allowed"]
    H -- "no" --> J["Keep runtime fixes / review loop open"]
```

O harness de paridade não é a única fonte de evidência. Mantenha essa divisão explícita na revisão:

- PR D é responsável pela comparação baseada em cenários entre GPT-5.4 e Opus 4.6
- suítes determinísticas da PR B continuam responsáveis por evidências de auth/proxy/DNS e veracidade de acesso total

## Fluxo rápido de merge para maintainer

Use isto quando você estiver pronto para fazer o merge de uma PR de paridade e quiser uma sequência repetível e de baixo risco.

1. Confirme que o nível de evidência foi atingido antes do merge:
   - sintoma reproduzível ou teste falhando
   - causa raiz verificada no código alterado
   - correção no caminho implicado
   - teste de regressão ou observação explícita de verificação manual
2. Faça triagem/rotulagem antes do merge:
   - aplique quaisquer rótulos `r:*` de fechamento automático quando a PR não deva entrar
   - mantenha candidatos a merge livres de threads bloqueadoras não resolvidas
3. Valide localmente a superfície alterada:
   - `pnpm check:changed`
   - `pnpm test:changed` quando testes tiverem mudado ou quando a confiança na correção do bug depender da cobertura de testes
4. Faça o merge com o fluxo padrão de maintainer (processo `/landpr`) e depois verifique:
   - comportamento de fechamento automático de issues vinculadas
   - status de CI e pós-merge em `main`
5. Após o merge, pesquise duplicatas entre PRs/issues abertas relacionadas e feche apenas com uma referência canônica.

Se qualquer um dos itens do nível de evidência estiver faltando, solicite mudanças em vez de fazer o merge.

## Mapa de objetivo para evidência

| Item do gate de conclusão                 | Responsável principal | Artefato de revisão                                                  |
| ----------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| Sem travamentos apenas com plano          | PR A                  | testes de runtime estritamente agêntico e `approval-turn-tool-followthrough` |
| Sem progresso falso ou conclusão falsa de ferramenta | PR A + PR D | contagem de sucesso falso de paridade mais detalhes do relatório por cenário |
| Sem orientação falsa de `/elevated full`  | PR B                  | suítes determinísticas de veracidade do runtime                      |
| Falhas de replay/liveness permanecem explícitas | PR C + PR D      | suítes de ciclo de vida/replay mais `compaction-retry-mutating-tool` |
| GPT-5.4 iguala ou supera Opus 4.6         | PR D                  | `qa-agentic-parity-report.md` e `qa-agentic-parity-summary.json`     |

## Atalho para revisores: antes vs depois

| Problema visível ao usuário antes                         | Sinal de revisão depois                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| GPT-5.4 parava após o planejamento                        | PR A mostra comportamento de agir-ou-bloquear em vez de conclusão apenas por comentário |
| O uso de ferramentas parecia frágil com schemas estritos OpenAI/Codex | PR C mantém previsíveis o registro de ferramentas e a invocação sem parâmetros |
| Dicas de `/elevated full` às vezes eram enganosas         | PR B vincula a orientação à capacidade real do runtime e aos motivos de bloqueio        |
| Tarefas longas podiam desaparecer em ambiguidade de replay/Compaction | PR C emite estado explícito de pausado, bloqueado, abandonado e replay inválido |
| Afirmações de paridade eram anedóticas                    | PR D produz um relatório mais veredito JSON com a mesma cobertura de cenários em ambos os modelos |

## Relacionado

- [Paridade agêntica GPT-5.4 / Codex](/pt-BR/help/gpt54-codex-agentic-parity)
