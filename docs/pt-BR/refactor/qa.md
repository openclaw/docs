---
x-i18n:
    generated_at: "2026-04-08T02:18:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e156cc8e2fe946a0423862f937754a7caa1fe7e6863b50a80bff49a1c86e1e8
    source_path: refactor/qa.md
    workflow: 15
---

# Refatoração de QA

Status: migração fundamental concluída.

## Objetivo

Mover o QA do OpenClaw de um modelo de definição dividido para uma única fonte de verdade:

- metadados do cenário
- prompts enviados ao modelo
- setup e teardown
- lógica do harness
- asserções e critérios de sucesso
- artefatos e dicas de relatório

O estado final desejado é um harness de QA genérico que carregue arquivos poderosos de definição de cenário em vez de codificar a maior parte do comportamento em TypeScript.

## Estado atual

A principal fonte de verdade agora vive em `qa/scenarios.md`.

Implementado:

- `qa/scenarios.md`
  - pacote canônico de QA
  - identidade do operador
  - missão de kickoff
  - metadados do cenário
  - vínculos de handler
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser de pacote Markdown + validação com zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderização de plano a partir do pacote Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - semeia arquivos de compatibilidade gerados mais `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - seleciona cenários executáveis por meio de vínculos de handler definidos em Markdown
- Protocolo + UI do barramento de QA
  - anexos inline genéricos para renderização de imagem/vídeo/áudio/arquivo

Superfícies divididas restantes:

- `extensions/qa-lab/src/suite.ts`
  - ainda controla a maior parte da lógica executável personalizada de handlers
- `extensions/qa-lab/src/report.ts`
  - ainda deriva a estrutura do relatório a partir das saídas de runtime

Então a divisão da fonte de verdade foi corrigida, mas a execução ainda é majoritariamente apoiada por handlers, em vez de totalmente declarativa.

## Como é a superfície real do cenário

Ler a suite atual mostra algumas classes distintas de cenário.

### Interação simples

- baseline de canal
- baseline de DM
- acompanhamento em thread
- troca de modelo
- continuação de aprovação
- reação/edição/exclusão

### Mutação de configuração e runtime

- desativação de Skill por patch de configuração
- despertar após reinício com aplicação de configuração
- mudança de capacidade após reinício de configuração
- verificação de drift do inventário de runtime

### Asserções de sistema de arquivos e repositório

- relatório de descoberta de código/docs
- build de Lobster Invaders
- busca de artefato de imagem gerada

### Orquestração de memória

- recordação de memória
- ferramentas de memória em contexto de canal
- fallback de falha de memória
- classificação de memória de sessão
- isolamento de memória por thread
- varredura de dreaming de memória

### Integração de ferramenta e plugin

- chamada de plugin-tools MCP
- visibilidade de Skills
- instalação hot de Skill
- geração nativa de imagem
- roundtrip de imagem
- compreensão de imagem a partir de anexo

### Multiturno e múltiplos atores

- handoff de subagent
- síntese de fanout de subagent
- fluxos no estilo recuperação após reinício

Essas categorias importam porque elas orientam os requisitos da DSL. Uma lista simples de prompt + texto esperado não é suficiente.

## Direção

### Fonte única de verdade

Use `qa/scenarios.md` como a fonte de verdade criada manualmente.

O pacote deve continuar sendo:

- legível por humanos em revisão
- parseável por máquina
- rico o suficiente para orientar:
  - execução da suite
  - bootstrap do workspace de QA
  - metadados da UI do QA Lab
  - prompts de docs/discovery
  - geração de relatório

### Formato de autoria preferido

Use Markdown como formato de nível superior, com YAML estruturado dentro dele.

Formato recomendado:

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - refs de docs
  - refs de código
  - substituições de modelo/provider
  - pré-requisitos
- seções em prosa
  - objetivo
  - observações
  - dicas de depuração
- blocos YAML delimitados
  - setup
  - steps
  - assertions
  - cleanup

Isso oferece:

- melhor legibilidade em PRs do que JSON gigante
- contexto mais rico do que YAML puro
- parsing estrito e validação com zod

JSON bruto é aceitável apenas como uma forma intermediária gerada.

## Formato proposto do arquivo de cenário

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

# Objective

Verify generated media is reattached on the follow-up turn.

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
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capacidades do runner que a DSL precisa cobrir

Com base na suite atual, o runner genérico precisa de mais do que execução de prompt.

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

### Ações de memória e cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Ações de MCP

- `mcp.callTool`

### Asserções

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

Exemplos da suite atual:

- criar uma thread e depois reutilizar `threadId`
- criar uma sessão e depois reutilizar `sessionKey`
- gerar uma imagem e depois anexar o arquivo no próximo turno
- gerar uma string de marcador de wake e depois verificar se ela aparece mais tarde

Capacidades necessárias:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referências tipadas para caminhos, chaves de sessão, IDs de thread, marcadores, saídas de ferramenta

Sem suporte a variáveis, o harness continuará vazando lógica de cenário de volta para o TypeScript.

## O que deve continuar como escape hatch

Um runner totalmente declarativo puro não é realista na fase 1.

Alguns cenários são inerentemente pesados em orquestração:

- varredura de dreaming de memória
- despertar após reinício com aplicação de configuração
- mudança de capacidade após reinício de configuração
- resolução de artefato de imagem gerada por timestamp/caminho
- avaliação de discovery-report

Por enquanto, estes devem usar handlers personalizados explícitos.

Regra recomendada:

- 85-90% declarativo
- etapas `customHandler` explícitas para o restante mais difícil
- somente custom handlers nomeados e documentados
- nenhum código inline anônimo no arquivo de cenário

Isso mantém o mecanismo genérico limpo e ainda permite progresso.

## Mudança de arquitetura

### Atual

O Markdown de cenário já é a fonte de verdade para:

- execução da suite
- arquivos de bootstrap do workspace
- catálogo de cenários da UI do QA Lab
- metadados de relatório
- prompts de discovery

Compatibilidade gerada:

- o workspace semeado ainda inclui `QA_KICKOFF_TASK.md`
- o workspace semeado ainda inclui `QA_SCENARIO_PLAN.md`
- o workspace semeado agora também inclui `QA_SCENARIOS.md`

## Plano de refatoração

### Fase 1: loader e schema

Concluído.

- adicionado `qa/scenarios.md`
- adicionado parser para conteúdo nomeado de pacote YAML em Markdown
- validado com zod
- consumidores alterados para o pacote parseado
- removidos `qa/seed-scenarios.json` e `qa/QA_KICKOFF_TASK.md` no nível do repositório

### Fase 2: mecanismo genérico

- dividir `extensions/qa-lab/src/suite.ts` em:
  - loader
  - engine
  - registro de ações
  - registro de asserções
  - custom handlers
- manter funções auxiliares existentes como operações do engine

Entregável:

- engine executa cenários declarativos simples

Começar com cenários que são majoritariamente prompt + espera + asserção:

- acompanhamento em thread
- compreensão de imagem a partir de anexo
- visibilidade e invocação de Skill
- baseline de canal

Entregável:

- primeiros cenários reais definidos em Markdown sendo entregues pelo mecanismo genérico

### Fase 4: migrar cenários intermediários

- roundtrip de geração de imagem
- ferramentas de memória em contexto de canal
- classificação de memória de sessão
- handoff de subagent
- síntese de fanout de subagent

Entregável:

- variáveis, artefatos, asserções de ferramenta e asserções de request log comprovadas

### Fase 5: manter cenários difíceis em custom handlers

- varredura de dreaming de memória
- despertar após reinício com aplicação de configuração
- mudança de capacidade após reinício de configuração
- inventário de runtime

Entregável:

- mesmo formato de autoria, mas com blocos explícitos de etapa personalizada onde necessário

### Fase 6: excluir mapa de cenários hardcoded

Quando a cobertura do pacote estiver boa o suficiente:

- remover a maior parte da lógica condicional específica de cenário em TypeScript de `extensions/qa-lab/src/suite.ts`

## Fake Slack / suporte a rich media

O barramento de QA atual é focado em texto.

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

Adicione um modelo genérico de anexo do barramento de QA:

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

Depois adicione `attachments?: QaBusAttachment[]` a:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Por que genérico primeiro

Não construa um modelo de mídia exclusivo para Slack.

Em vez disso:

- um modelo de transporte de QA genérico
- múltiplos renderizadores sobre ele
  - chat atual do QA Lab
  - futuro fake Slack web
  - quaisquer outras visualizações de transporte simulado

Isso evita lógica duplicada e permite que cenários de mídia permaneçam agnósticos ao transporte.

### Trabalho de UI necessário

Atualize a UI de QA para renderizar:

- prévia de imagem inline
- player de áudio inline
- player de vídeo inline
- chip de anexo de arquivo

A UI atual já consegue renderizar threads e reações, então a renderização de anexos deve ser adicionada sobre o mesmo modelo de card de mensagem.

### Trabalho de cenário viabilizado pelo transporte de mídia

Quando os anexos passarem pelo barramento de QA, poderemos adicionar cenários mais ricos de chat simulado:

- resposta inline com imagem no fake Slack
- compreensão de anexo de áudio
- compreensão de anexo de vídeo
- ordenação mista de anexos
- resposta em thread com mídia preservada

## Recomendação

O próximo bloco de implementação deve ser:

1. adicionar loader de cenário em Markdown + schema zod
2. gerar o catálogo atual a partir do Markdown
3. migrar primeiro alguns cenários simples
4. adicionar suporte genérico a anexos no barramento de QA
5. renderizar imagem inline na UI de QA
6. depois expandir para áudio e vídeo

Este é o menor caminho que comprova ambos os objetivos:

- QA genérico definido em Markdown
- superfícies de mensagens simuladas mais ricas

## Questões em aberto

- se arquivos de cenário devem permitir templates de prompt em Markdown embutidos com interpolação de variáveis
- se setup/cleanup devem ser seções nomeadas ou apenas listas ordenadas de ações
- se referências de artefato devem ser fortemente tipadas no schema ou baseadas em string
- se custom handlers devem viver em um único registro ou em registros por superfície
- se o arquivo gerado de compatibilidade em JSON deve continuar versionado durante a migração
