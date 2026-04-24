---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória escrever
summary: Como o OpenClaw se lembra das coisas entre sessões
title: Visão geral de memória
x-i18n:
    generated_at: "2026-04-24T05:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

O OpenClaw se lembra das coisas escrevendo **arquivos Markdown simples** no
workspace do seu agente. O modelo só "se lembra" do que é salvo em disco -- não
existe estado oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** -- memória de longo prazo. Fatos duradouros, preferências e
  decisões. Carregado no início de toda sessão de DM.
- **`memory/YYYY-MM-DD.md`** -- anotações diárias. Contexto em andamento e observações.
  As anotações de hoje e de ontem são carregadas automaticamente.
- **`DREAMS.md`** (opcional) -- Diário de Sonhos e resumos de varreduras de Dreaming
  para revisão humana, incluindo entradas históricas de backfill fundamentado.

Esses arquivos ficam no workspace do agente (padrão `~/.openclaw/workspace`).

<Tip>
Se você quiser que seu agente se lembre de algo, basta pedir: "Lembre que eu
prefiro TypeScript." Ele gravará isso no arquivo apropriado.
</Tip>

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** -- encontra anotações relevantes usando busca semântica, mesmo quando
  a redação é diferente da original.
- **`memory_get`** -- lê um arquivo de memória específico ou um intervalo de linhas.

Ambas as ferramentas são fornecidas pelo Plugin de memória ativo (padrão: `memory-core`).

## Plugin complementar Memory Wiki

Se você quiser que a memória durável se comporte mais como uma base de conhecimento mantida do que
apenas anotações brutas, use o Plugin empacotado `memory-wiki`.

`memory-wiki` compila conhecimento durável em um vault wiki com:

- estrutura de página determinística
- claims e evidências estruturadas
- rastreamento de contradição e atualização
- dashboards gerados
- digests compilados para consumidores de agente/runtime
- ferramentas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Ele não substitui o Plugin de memória ativo. O Plugin de memória ativo ainda
é responsável por recall, promoção e Dreaming. `memory-wiki` adiciona uma camada de
conhecimento rica em proveniência ao lado dele.

Consulte [Memory Wiki](/pt-BR/plugins/memory-wiki).

## Busca de memória

Quando um provedor de embeddings está configurado, `memory_search` usa **busca
híbrida** -- combinando similaridade vetorial (significado semântico) com correspondência por palavra-chave
(termos exatos como IDs e símbolos de código). Isso funciona imediatamente assim que você tiver
uma chave de API para qualquer provedor compatível.

<Info>
O OpenClaw detecta automaticamente seu provedor de embeddings a partir das chaves de API disponíveis. Se você
tiver configurada uma chave de OpenAI, Gemini, Voyage ou Mistral, a busca de memória será
habilitada automaticamente.
</Info>

Para detalhes sobre como a busca funciona, opções de ajuste e configuração de provedor, consulte
[Memory Search](/pt-BR/concepts/memory-search).

## Backends de memória

<CardGroup cols={3}>
<Card title="Integrado (padrão)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavra-chave, similaridade vetorial e
busca híbrida. Sem dependências extras.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Sidecar local-first com reranking, expansão de consulta e capacidade de indexar
diretórios fora do workspace.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória cross-session nativa de IA com modelagem de usuário, busca semântica e
consciência multiagente. Instalação por Plugin.
</Card>
</CardGroup>

## Camada wiki de conhecimento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pt-BR/plugins/memory-wiki">
Compila memória durável em um vault wiki rico em proveniência com claims,
dashboards, bridge mode e fluxos compatíveis com Obsidian.
</Card>
</CardGroup>

## Flush automático de memória

Antes que a [Compaction](/pt-BR/concepts/compaction) resuma sua conversa, o OpenClaw
executa um turno silencioso que lembra o agente de salvar contexto importante em arquivos
de memória. Isso fica ativado por padrão -- você não precisa configurar nada.

<Tip>
O flush de memória evita perda de contexto durante a Compaction. Se seu agente tiver
fatos importantes na conversa que ainda não foram gravados em um arquivo, eles
serão salvos automaticamente antes que o resumo aconteça.
</Tip>

## Dreaming

Dreaming é uma passagem opcional de consolidação em segundo plano para memória. Ela coleta
sinais de curto prazo, pontua candidatos e promove apenas itens qualificados para a
memória de longo prazo (`MEMORY.md`).

Ela foi projetada para manter a memória de longo prazo com alto sinal:

- **Opt-in**: desabilitada por padrão.
- **Agendada**: quando habilitada, `memory-core` gerencia automaticamente uma tarefa Cron recorrente
  para uma varredura completa de Dreaming.
- **Com limiar**: promoções precisam passar por controles de pontuação, frequência de recall e diversidade
  de consulta.
- **Revisável**: resumos de fase e entradas de diário são gravados em `DREAMS.md`
  para revisão humana.

Para comportamento por fase, sinais de pontuação e detalhes do Diário de Sonhos, consulte
[Dreaming](/pt-BR/concepts/dreaming).

## Backfill fundamentado e promoção ao vivo

O sistema de Dreaming agora tem duas trilhas de revisão intimamente relacionadas:

- **Dreaming ao vivo** funciona a partir do armazenamento de Dreaming de curto prazo em
  `memory/.dreams/` e é o que a fase profunda normal usa ao decidir o que
  pode ser promovido para `MEMORY.md`.
- **Backfill fundamentado** lê anotações históricas `memory/YYYY-MM-DD.md` como
  arquivos de dia independentes e grava saída estruturada de revisão em `DREAMS.md`.

O backfill fundamentado é útil quando você quer reproduzir anotações antigas e inspecionar o que
o sistema considera durável sem editar manualmente `MEMORY.md`.

Quando você usa:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

os candidatos duráveis fundamentados não são promovidos diretamente. Eles são preparados no
mesmo armazenamento de Dreaming de curto prazo que a fase profunda normal já usa. Isso
significa:

- `DREAMS.md` continua sendo a superfície de revisão humana.
- o armazenamento de curto prazo continua sendo a superfície de classificação voltada para a máquina.
- `MEMORY.md` continua sendo gravado apenas pela promoção profunda.

Se você decidir que a reprodução não foi útil, pode remover os artefatos preparados
sem tocar em entradas normais de diário ou no estado normal de recall:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Verificar status do índice e provedor
openclaw memory search "query"  # Buscar pela linha de comando
openclaw memory index --force   # Reconstruir o índice
```

## Leitura adicional

- [Builtin Memory Engine](/pt-BR/concepts/memory-builtin) -- backend padrão baseado em SQLite
- [QMD Memory Engine](/pt-BR/concepts/memory-qmd) -- sidecar local-first avançado
- [Honcho Memory](/pt-BR/concepts/memory-honcho) -- memória cross-session nativa de IA
- [Memory Wiki](/pt-BR/plugins/memory-wiki) -- vault de conhecimento compilado e ferramentas nativas de wiki
- [Memory Search](/pt-BR/concepts/memory-search) -- pipeline de busca, provedores e
  ajuste
- [Dreaming](/pt-BR/concepts/dreaming) -- promoção em segundo plano
  de recall de curto prazo para memória de longo prazo
- [Memory configuration reference](/pt-BR/reference/memory-config) -- todos os controles de configuração
- [Compaction](/pt-BR/concepts/compaction) -- como a Compaction interage com a memória

## Relacionados

- [Active Memory](/pt-BR/concepts/active-memory)
- [Memory Search](/pt-BR/concepts/memory-search)
- [Builtin memory engine](/pt-BR/concepts/memory-builtin)
- [Honcho memory](/pt-BR/concepts/memory-honcho)
