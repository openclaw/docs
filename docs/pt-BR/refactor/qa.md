---
read_when:
    - Refatorando definições de cenários de QA ou código do harness qa-lab
    - Movendo comportamento de QA entre cenários em Markdown e lógica do harness em TypeScript
summary: Plano de refatoração de QA para consolidação do catálogo de cenários e do harness
title: Refatoração de QA
x-i18n:
    generated_at: "2026-04-23T14:07:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# Refatoração de QA

Status: migração fundamental concluída.

## Objetivo

Mover o QA do OpenClaw de um modelo de definição dividida para uma única fonte de verdade:

- metadados do cenário
- prompts enviados ao modelo
- setup e teardown
- lógica do harness
- assertions e critérios de sucesso
- artefatos e dicas de relatório

O estado final desejado é um harness genérico de QA que carregue arquivos poderosos de definição de cenário em vez de codificar a maior parte do comportamento em TypeScript.

## Estado atual

A fonte principal de verdade agora vive em `qa/scenarios/index.md` mais um arquivo por
cenário em `qa/scenarios/<theme>/*.md`.

Implementado:

- `qa/scenarios/index.md`
  - metadados canônicos do pacote de QA
  - identidade do operador
  - missão de kickoff
- `qa/scenarios/<theme>/*.md`
  - um arquivo Markdown por cenário
  - metadados do cenário
  - bindings de handler
  - configuração de execução específica do cenário
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser do pacote Markdown + validação zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderização de plano a partir do pacote Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - inicializa arquivos de compatibilidade gerados mais `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - seleciona cenários executáveis por meio de bindings de handler definidos em Markdown
- Protocolo do barramento de QA + interface
  - anexos inline genéricos para renderização de imagem/vídeo/áudio/arquivo

Superfícies divididas restantes:

- `extensions/qa-lab/src/suite.ts`
  - ainda é responsável pela maior parte da lógica executável de handlers personalizados
- `extensions/qa-lab/src/report.ts`
  - ainda deriva a estrutura do relatório a partir de saídas de runtime

Então a divisão da fonte de verdade foi corrigida, mas a execução ainda é majoritariamente baseada em handlers em vez de totalmente declarativa.

## Como é a superfície real de cenários

Ler o suite atual mostra algumas classes distintas de cenário.

### Interação simples

- baseline de canal
- baseline de DM
- acompanhamento em thread
- troca de modelo
- continuidade de aprovação
- reação/edição/exclusão

### Mutação de configuração e runtime

- patch de configuração para desabilitar Skill
- apply de configuração com wake-up por reinício
- mudança de capacidade por reinício de configuração
- verificação de desvio de inventário de runtime

### Assertions de sistema de arquivos e repositório

- relatório de descoberta de source/docs
- compilar Lobster Invaders
- busca de artefato de imagem gerado

### Orquestração de memória

- recall de memória
- ferramentas de memória em contexto de canal
- fallback de falha de memória
- ranking de memória de sessão
- isolamento de memória por thread
- varredura de Dreaming da memória

### Integração de ferramenta e Plugin

- chamada de Plugin/ferramentas MCP
- visibilidade de Skill
- instalação dinâmica de Skill
- geração nativa de imagem
- roundtrip de imagem
- compreensão de imagem a partir de anexo

### Multi-turno e multiator

- handoff de subagente
- síntese com fanout de subagente
- fluxos no estilo recuperação após reinício

Essas categorias importam porque orientam os requisitos da DSL. Uma lista simples de prompt + texto esperado não é suficiente.

## Direção

### Fonte única de verdade

Use `qa/scenarios/index.md` mais `qa/scenarios/<theme>/*.md` como a
fonte de verdade criada manualmente.

O pacote deve continuar:

- legível por humanos em review
- analisável por máquina
- rico o bastante para orientar:
  - execução do suite
  - bootstrap do workspace de QA
  - metadados da interface do QA Lab
  - prompts de docs/discovery
  - geração de relatórios

### Formato de autoria preferido

Use Markdown como formato de nível superior, com YAML estruturado dentro dele.

Formato recomendado:

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - referências de docs
  - referências de código
  - substituições de modelo/provider
  - pré-requisitos
- seções em prosa
  - objetivo
  - observações
  - dicas de depuração
- blocos YAML com fence
  - setup
  - steps
  - assertions
  - cleanup

Isso oferece:

- melhor legibilidade em PR do que JSON gigante
- contexto mais rico do que YAML puro
- parsing estrito e validação zod

JSON bruto é aceitável apenas como formato intermediário gerado.

## Formato proposto para arquivo de cenário

Exemplo:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objetivo

Verificar se a mídia gerada é reenviada no turno de acompanhamento.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Verificação de geração de imagem: gere uma imagem de farol de QA e resuma-a em uma frase curta.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Verificação de geração de imagem
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Verificação de inspeção de roundtrip de imagem: descreva o anexo de imagem do farol gerado em uma frase curta.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Verificação de inspeção de roundtrip de imagem
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Recursos do executor que a DSL precisa cobrir

Com base no suite atual, o executor genérico precisa de mais do que execução de prompts.

### Ações de ambiente e setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Ações de turno do agente

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Ações de configuração e runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Ações de arquivo e artefato

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Ações de memória e Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Ações de MCP

- `mcp.callTool`

### Assertions

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variáveis e referências de artefato

A DSL precisa oferecer suporte a saídas salvas e referências posteriores.

Exemplos do suite atual:

- criar uma thread e depois reutilizar `threadId`
- criar uma sessão e depois reutilizar `sessionKey`
- gerar uma imagem e depois anexar o arquivo no próximo turno
- gerar uma string de marcador de wake e depois verificar que ela aparece mais tarde

Recursos necessários:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referências tipadas para caminhos, chaves de sessão, IDs de thread, marcadores, saídas de ferramentas

Sem suporte a variáveis, o harness continuará deixando vazar lógica de cenário de volta para o TypeScript.

## O que deve permanecer como rota de escape

Um executor totalmente declarativo não é realista na fase 1.

Alguns cenários são inerentemente pesados em orquestração:

- varredura de Dreaming da memória
- apply de configuração com wake-up por reinício
- mudança de capacidade por reinício de configuração
- resolução de artefato de imagem gerado por timestamp/caminho
- avaliação de relatório de discovery

Por enquanto, estes devem usar handlers personalizados explícitos.

Regra recomendada:

- 85-90% declarativo
- `customHandler` explícito para o restante mais difícil
- apenas handlers personalizados nomeados e documentados
- sem código inline anônimo no arquivo de cenário

Isso mantém o mecanismo genérico limpo e ainda permite avançar.

## Mudança de arquitetura

### Atual

O Markdown de cenário já é a fonte de verdade para:

- execução do suite
- arquivos de bootstrap do workspace
- catálogo de cenários da interface do QA Lab
- metadados de relatório
- prompts de discovery

Compatibilidade gerada:

- o workspace inicializado ainda inclui `QA_KICKOFF_TASK.md`
- o workspace inicializado ainda inclui `QA_SCENARIO_PLAN.md`
- o workspace inicializado agora também inclui `QA_SCENARIOS.md`

## Plano de refatoração

### Fase 1: loader e schema

Concluída.

- adicionado `qa/scenarios/index.md`
- cenários divididos em `qa/scenarios/<theme>/*.md`
- adicionado parser para conteúdo nomeado de pacote Markdown YAML
- validação com zod
- consumidores trocados para o pacote analisado
- removidos `qa/seed-scenarios.json` e `qa/QA_KICKOFF_TASK.md` do nível do repositório

### Fase 2: mecanismo genérico

- dividir `extensions/qa-lab/src/suite.ts` em:
  - loader
  - engine
  - registro de ações
  - registro de assertions
  - handlers personalizados
- manter funções auxiliares existentes como operações do mecanismo

Entregável:

- mecanismo executa cenários declarativos simples

Começar com cenários que são majoritariamente prompt + espera + assertion:

- acompanhamento em thread
- compreensão de imagem a partir de anexo
- visibilidade e invocação de Skill
- baseline de canal

Entregável:

- primeiros cenários reais definidos em Markdown sendo entregues pelo mecanismo genérico

### Fase 4: migrar cenários intermediários

- roundtrip de geração de imagem
- ferramentas de memória em contexto de canal
- ranking de memória de sessão
- handoff de subagente
- síntese com fanout de subagente

Entregável:

- variáveis, artefatos, assertions de ferramenta e assertions de request-log comprovados

### Fase 5: manter cenários difíceis em handlers personalizados

- varredura de Dreaming da memória
- apply de configuração com wake-up por reinício
- mudança de capacidade por reinício de configuração
- desvio de inventário de runtime

Entregável:

- mesmo formato de autoria, mas com blocos explícitos de etapa personalizada quando necessário

### Fase 6: excluir mapa de cenários hardcoded

Quando a cobertura do pacote estiver boa o suficiente:

- remover a maior parte da ramificação TypeScript específica por cenário de `extensions/qa-lab/src/suite.ts`

## Fake Slack / suporte a mídia rica

O barramento atual de QA é orientado a texto.

Arquivos relevantes:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Hoje o barramento de QA oferece suporte a:

- texto
- reações
- threads

Ele ainda não modela anexos de mídia inline.

### Contrato de transporte necessário

Adicionar um modelo genérico de anexo do barramento de QA:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Depois adicionar `attachments?: QaBusAttachment[]` a:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Por que genérico primeiro

Não construa um modelo de mídia específico de Slack.

Em vez disso:

- um modelo genérico de transporte de QA
- múltiplos renderizadores sobre ele
  - chat atual do QA Lab
  - futuro fake Slack web
  - quaisquer outras visualizações de transporte falso

Isso evita lógica duplicada e permite que cenários de mídia permaneçam agnósticos ao transporte.

### Trabalho de interface necessário

Atualizar a interface de QA para renderizar:

- pré-visualização inline de imagem
- player de áudio inline
- player de vídeo inline
- chip de anexo de arquivo

A interface atual já consegue renderizar threads e reações, então a renderização de anexos deve se encaixar sobre o mesmo modelo de cartão de mensagem.

### Trabalho de cenário habilitado pelo transporte de mídia

Quando os anexos passarem pelo barramento de QA, poderemos adicionar cenários mais ricos de chat falso:

- resposta inline com imagem no fake Slack
- compreensão de anexo de áudio
- compreensão de anexo de vídeo
- ordenação mista de anexos
- resposta em thread com mídia preservada

## Recomendação

O próximo bloco de implementação deve ser:

1. adicionar loader de cenário em Markdown + schema zod
2. gerar o catálogo atual a partir de Markdown
3. migrar primeiro alguns cenários simples
4. adicionar suporte genérico a anexos no barramento de QA
5. renderizar imagem inline na interface de QA
6. depois expandir para áudio e vídeo

Este é o menor caminho que comprova ambos os objetivos:

- QA genérico definido em Markdown
- superfícies mais ricas de mensagens falsas

## Questões em aberto

- se arquivos de cenário devem permitir templates de prompt em Markdown embutidos com interpolação de variáveis
- se setup/cleanup devem ser seções nomeadas ou apenas listas ordenadas de ações
- se referências de artefato devem ser fortemente tipadas no schema ou baseadas em string
- se handlers personalizados devem viver em um único registro ou em registros por superfície
- se o arquivo de compatibilidade JSON gerado deve permanecer versionado durante a migração
