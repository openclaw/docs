---
read_when:
    - Refatorando definições de cenário de QA ou código do harness qa-lab
    - Movendo comportamento de QA entre cenários Markdown e lógica TypeScript do harness
summary: Plano de refatoração de QA para consolidação do catálogo de cenários e do harness
title: Refatoração de QA
x-i18n:
    generated_at: "2026-04-24T06:10:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Status: a migração fundamental foi concluída.

## Objetivo

Mover o QA do OpenClaw de um modelo de definição dividida para uma única fonte da verdade:

- metadados do cenário
- prompts enviados ao modelo
- setup e teardown
- lógica do harness
- assertions e critérios de sucesso
- artefatos e dicas de relatório

O estado final desejado é um harness de QA genérico que carregue arquivos poderosos de definição de cenário em vez de codificar a maior parte do comportamento em TypeScript.

## Estado atual

A fonte principal da verdade agora está em `qa/scenarios/index.md` mais um arquivo por
cenário em `qa/scenarios/<theme>/*.md`.

Implementado:

- `qa/scenarios/index.md`
  - metadados canônicos do pacote de QA
  - identidade do operador
  - missão de kickoff
- `qa/scenarios/<theme>/*.md`
  - um arquivo Markdown por cenário
  - metadados do cenário
  - bindings de manipulador
  - configuração de execução específica do cenário
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser de pacote Markdown + validação zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderização de plano a partir do pacote Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - gera arquivos de compatibilidade com seed mais `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - seleciona cenários executáveis por meio de bindings de manipulador definidos em Markdown
- Protocolo do barramento de QA + UI
  - anexos inline genéricos para renderização de imagem/vídeo/áudio/arquivo

Superfícies divididas restantes:

- `extensions/qa-lab/src/suite.ts`
  - ainda é responsável pela maior parte da lógica executável de manipuladores personalizados
- `extensions/qa-lab/src/report.ts`
  - ainda deriva a estrutura do relatório das saídas de runtime

Então a divisão da fonte da verdade foi corrigida, mas a execução ainda é em grande parte baseada em manipuladores em vez de totalmente declarativa.

## Como realmente é a superfície de cenários

Lendo a suíte atual, aparecem algumas classes distintas de cenário.

### Interação simples

- baseline de canal
- baseline de DM
- follow-up em thread
- troca de modelo
- continuidade de aprovação
- reaction/edit/delete

### Mutação de configuração e runtime

- desabilitar Skill via patch de config
- config apply restart wake-up
- mudança de capacidade por reinício de config
- verificação de desvio de inventário de runtime

### Assertions de sistema de arquivos e repositório

- relatório de descoberta de source/docs
- build do Lobster Invaders
- busca de artefato de imagem gerada

### Orquestração de memória

- recall de memória
- ferramentas de memória em contexto de canal
- fallback de falha de memória
- classificação de memória de sessão
- isolamento de memória por thread
- memory dreaming sweep

### Integração de ferramenta e Plugin

- chamada de plugin-tools do MCP
- visibilidade de Skill
- hot install de Skill
- geração nativa de imagem
- roundtrip de imagem
- entendimento de imagem a partir de anexo

### Multi-turno e multiator

- handoff de subagente
- síntese de fanout de subagente
- fluxos de recuperação após reinício

Essas categorias importam porque definem os requisitos da DSL. Uma lista plana de prompt + texto esperado não é suficiente.

## Direção

### Fonte única da verdade

Use `qa/scenarios/index.md` mais `qa/scenarios/<theme>/*.md` como a
fonte da verdade de autoria.

O pacote deve permanecer:

- legível por humanos em revisão
- analisável por máquina
- rico o suficiente para conduzir:
  - execução da suíte
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
  - docs refs
  - code refs
  - sobrescritas de modelo/provedor
  - pré-requisitos
- seções em prosa
  - objetivo
  - observações
  - dicas de depuração
- blocos YAML cercados por fence
  - setup
  - steps
  - assertions
  - cleanup

Isso oferece:

- melhor legibilidade em PR do que JSON gigante
- contexto mais rico do que YAML puro
- parsing estrito e validação zod

JSON bruto é aceitável apenas como forma intermediária gerada.

## Formato proposto do arquivo de cenário

Exemplo:

````md
---
id: image-generation-roundtrip
title: Roundtrip de geração de imagem
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

Verificar se a mídia gerada é reanexada no turno de follow-up.

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

# Etapas

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
    Verificação de inspeção de roundtrip da imagem: descreva o anexo de imagem do farol gerado em uma frase curta.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expectativa

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Verificação de inspeção de roundtrip da imagem
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capacidades do executor que a DSL precisa cobrir

Com base na suíte atual, o executor genérico precisa de mais do que execução de prompt.

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

Exemplos da suíte atual:

- criar uma thread e depois reutilizar `threadId`
- criar uma sessão e depois reutilizar `sessionKey`
- gerar uma imagem e depois anexar o arquivo no próximo turno
- gerar uma string de marcador de ativação e depois afirmar que ela aparece depois

Capacidades necessárias:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referências tipadas para caminhos, chaves de sessão, IDs de thread, marcadores, saídas de ferramenta

Sem suporte a variáveis, o harness continuará vazando lógica de cenário de volta para o TypeScript.

## O que deve continuar como escape hatch

Um executor totalmente declarativo e puro não é realista na fase 1.

Alguns cenários são inerentemente pesados em orquestração:

- memory dreaming sweep
- config apply restart wake-up
- mudança de capacidade por reinício de config
- resolução de artefato de imagem gerada por timestamp/caminho
- avaliação de relatório de discovery

Eles devem usar manipuladores personalizados explícitos por enquanto.

Regra recomendada:

- 85-90% declarativo
- etapas `customHandler` explícitas para o restante difícil
- apenas manipuladores personalizados nomeados e documentados
- nenhum código inline anônimo no arquivo de cenário

Isso mantém o mecanismo genérico limpo e ainda permite progresso.

## Mudança de arquitetura

### Atual

O Markdown de cenário já é a fonte da verdade para:

- execução da suíte
- arquivos de bootstrap do workspace
- catálogo de cenários da UI do QA Lab
- metadados de relatório
- prompts de discovery

Compatibilidade gerada:

- o workspace com seed ainda inclui `QA_KICKOFF_TASK.md`
- o workspace com seed ainda inclui `QA_SCENARIO_PLAN.md`
- o workspace com seed agora também inclui `QA_SCENARIOS.md`

## Plano de refatoração

### Fase 1: loader e schema

Concluído.

- adicionado `qa/scenarios/index.md`
- cenários divididos em `qa/scenarios/<theme>/*.md`
- adicionado parser para conteúdo nomeado de pacote Markdown YAML
- validado com zod
- consumidores alterados para o pacote analisado
- removidos `qa/seed-scenarios.json` e `qa/QA_KICKOFF_TASK.md` no nível do repositório

### Fase 2: mecanismo genérico

- dividir `extensions/qa-lab/src/suite.ts` em:
  - loader
  - engine
  - registro de ações
  - registro de assertions
  - manipuladores personalizados
- manter as funções helper existentes como operações do mecanismo

Entregável:

- o mecanismo executa cenários declarativos simples

Começar com cenários que são principalmente prompt + espera + assertion:

- follow-up em thread
- entendimento de imagem a partir de anexo
- visibilidade e invocação de Skill
- baseline de canal

Entregável:

- primeiros cenários reais definidos em Markdown passando pelo mecanismo genérico

### Fase 4: migrar cenários médios

- roundtrip de geração de imagem
- ferramentas de memória em contexto de canal
- classificação de memória de sessão
- handoff de subagente
- síntese de fanout de subagente

Entregável:

- variáveis, artefatos, assertions de ferramenta, assertions de request-log comprovados

### Fase 5: manter cenários difíceis em manipuladores personalizados

- memory dreaming sweep
- config apply restart wake-up
- mudança de capacidade por reinício de config
- desvio de inventário de runtime

Entregável:

- mesmo formato de autoria, mas com blocos explícitos de etapa personalizada onde necessário

### Fase 6: excluir mapa de cenários hardcoded

Quando a cobertura do pacote for boa o suficiente:

- remover a maior parte da lógica ramificada específica de cenário em TypeScript de `extensions/qa-lab/src/suite.ts`

## Slack falso / suporte a rich media

O barramento de QA atual é centrado em texto.

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

Não construa um modelo de mídia apenas para Slack.

Em vez disso:

- um modelo genérico de transporte de QA
- vários renderizadores em cima dele
  - chat atual do QA Lab
  - futuro fake Slack web
  - quaisquer outras views falsas de transporte

Isso evita lógica duplicada e permite que cenários de mídia permaneçam agnósticos ao transporte.

### Trabalho de UI necessário

Atualizar a UI de QA para renderizar:

- prévia inline de imagem
- player inline de áudio
- player inline de vídeo
- chip de anexo de arquivo

A UI atual já consegue renderizar threads e reações, então a renderização de anexos deve se sobrepor ao mesmo modelo de card de mensagem.

### Trabalho de cenário habilitado pelo transporte de mídia

Quando anexos passarem pelo barramento de QA, poderemos adicionar cenários mais ricos de chat falso:

- resposta inline com imagem em fake Slack
- entendimento de anexo de áudio
- entendimento de anexo de vídeo
- ordenação mista de anexos
- resposta em thread com mídia preservada

## Recomendação

O próximo bloco de implementação deve ser:

1. adicionar loader de cenário Markdown + schema zod
2. gerar o catálogo atual a partir de Markdown
3. migrar primeiro alguns cenários simples
4. adicionar suporte genérico a anexos no barramento de QA
5. renderizar imagem inline na UI de QA
6. então expandir para áudio e vídeo

Este é o menor caminho que comprova ambos os objetivos:

- QA genérico definido em Markdown
- superfícies de mensagens falsas mais ricas

## Questões em aberto

- se arquivos de cenário devem permitir templates de prompt em Markdown embutidos com interpolação de variáveis
- se setup/cleanup devem ser seções nomeadas ou apenas listas ordenadas de ações
- se referências de artefato devem ser fortemente tipadas no schema ou baseadas em string
- se manipuladores personalizados devem ficar em um único registro ou em registros por superfície
- se o arquivo gerado de compatibilidade JSON deve continuar versionado durante a migração

## Relacionados

- [QA E2E automation](/pt-BR/concepts/qa-e2e-automation)
