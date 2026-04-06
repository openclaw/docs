---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber em quais arquivos de memória escrever
summary: Como o OpenClaw se lembra das coisas entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-04-06T03:06:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d19d4fa9c4b3232b7a97f7a382311d2a375b562040de15e9fe4a0b1990b825e7
    source_path: concepts/memory.md
    workflow: 15
---

# Visão geral da memória

O OpenClaw se lembra das coisas gravando **arquivos Markdown simples** no
workspace do seu agente. O modelo só "se lembra" do que é salvo em disco -- não
há estado oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** -- memória de longo prazo. Fatos duráveis, preferências e
  decisões. Carregado no início de toda sessão de DM.
- **`memory/YYYY-MM-DD.md`** -- notas diárias. Contexto em andamento e
  observações. As notas de hoje e de ontem são carregadas automaticamente.
- **`DREAMS.md`** (experimental, opcional) -- Diário de Sonhos e resumos das
  varreduras de sonho para revisão humana.

Esses arquivos ficam no workspace do agente (padrão `~/.openclaw/workspace`).

<Tip>
Se você quiser que seu agente se lembre de algo, basta pedir: "Lembre-se de que
eu prefiro TypeScript." Ele gravará isso no arquivo apropriado.
</Tip>

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** -- encontra notas relevantes usando busca semântica, mesmo
  quando a formulação difere da original.
- **`memory_get`** -- lê um arquivo de memória específico ou um intervalo de linhas.

Ambas as ferramentas são fornecidas pelo plugin de memória ativo (padrão: `memory-core`).

## Busca de memória

Quando um provedor de embeddings está configurado, `memory_search` usa **busca
híbrida** -- combinando similaridade vetorial (significado semântico) com
correspondência por palavra-chave (termos exatos como IDs e símbolos de código).
Isso funciona imediatamente assim que você tiver uma chave de API para qualquer
provedor compatível.

<Info>
O OpenClaw detecta automaticamente seu provedor de embeddings a partir das
chaves de API disponíveis. Se você tiver uma chave OpenAI, Gemini, Voyage ou
Mistral configurada, a busca de memória será ativada automaticamente.
</Info>

Para detalhes sobre como a busca funciona, opções de ajuste e configuração de
provedor, consulte [Busca de memória](/pt-BR/concepts/memory-search).

## Backends de memória

<CardGroup cols={3}>
<Card title="Integrado (padrão)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavra-chave, similaridade vetorial e
busca híbrida. Sem dependências extras.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Sidecar local-first com reranking, expansão de consulta e a capacidade de indexar
diretórios fora do workspace.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória entre sessões nativa para IA com modelagem de usuário, busca semântica e
consciência multiagente. Instalação por plugin.
</Card>
</CardGroup>

## Flush automático da memória

Antes que a [compactação](/pt-BR/concepts/compaction) resuma sua conversa, o OpenClaw
executa um turno silencioso que lembra o agente de salvar contexto importante em
arquivos de memória. Isso vem ativado por padrão -- você não precisa configurar nada.

<Tip>
O flush da memória evita perda de contexto durante a compactação. Se o seu
agente tiver fatos importantes na conversa que ainda não foram gravados em um
arquivo, eles serão salvos automaticamente antes de o resumo acontecer.
</Tip>

## Dreaming (experimental)

Dreaming é uma etapa opcional de consolidação de memória em segundo plano. Ela coleta
sinais de curto prazo, pontua candidatos e promove apenas itens qualificados para a
memória de longo prazo (`MEMORY.md`).

Ela foi projetada para manter a memória de longo prazo com alto sinal:

- **Opt-in**: desativada por padrão.
- **Agendada**: quando ativado, `memory-core` gerencia automaticamente um job cron recorrente
  para uma varredura completa de dreaming.
- **Com limiares**: as promoções precisam passar por critérios de pontuação, frequência de recuperação e
  diversidade de consultas.
- **Revisável**: resumos de fase e entradas de diário são gravados em `DREAMS.md`
  para revisão humana.

Para comportamento por fase, sinais de pontuação e detalhes do Diário de Sonhos, consulte
[Dreaming (experimental)](/concepts/dreaming).

## CLI

```bash
openclaw memory status          # Verifica o status do índice e do provedor
openclaw memory search "query"  # Pesquisa pela linha de comando
openclaw memory index --force   # Reconstrói o índice
```

## Leitura adicional

- [Builtin Memory Engine](/pt-BR/concepts/memory-builtin) -- backend SQLite padrão
- [QMD Memory Engine](/pt-BR/concepts/memory-qmd) -- sidecar local-first avançado
- [Honcho Memory](/pt-BR/concepts/memory-honcho) -- memória entre sessões nativa para IA
- [Busca de memória](/pt-BR/concepts/memory-search) -- pipeline de busca, provedores e
  ajuste
- [Dreaming (experimental)](/concepts/dreaming) -- promoção em segundo plano
  da recuperação de curto prazo para a memória de longo prazo
- [Referência de configuração de memória](/pt-BR/reference/memory-config) -- todos os parâmetros de configuração
- [Compactação](/pt-BR/concepts/compaction) -- como a compactação interage com a memória
