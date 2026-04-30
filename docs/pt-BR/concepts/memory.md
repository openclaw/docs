---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória deve escrever
summary: Como o OpenClaw lembra de informações entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-04-30T09:44:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw lembra coisas escrevendo **arquivos Markdown simples** no espaço de trabalho do seu agente. O modelo só "lembra" o que é salvo em disco — não há estado oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** — memória de longo prazo. Fatos, preferências e decisões duráveis. Carregado no início de cada sessão de DM.
- **`memory/YYYY-MM-DD.md`** — notas diárias. Contexto contínuo e observações. As notas de hoje e de ontem são carregadas automaticamente.
- **`DREAMS.md`** (opcional) — Diário de Sonhos e resumos de varredura de dreaming para revisão humana, incluindo entradas fundamentadas de preenchimento histórico.

Esses arquivos ficam no espaço de trabalho do agente (padrão `~/.openclaw/workspace`).

<Tip>
Se quiser que seu agente lembre de algo, basta pedir: "Lembre que eu prefiro TypeScript." Ele gravará isso no arquivo apropriado.
</Tip>

## Compromissos inferidos

Alguns acompanhamentos futuros não são fatos duráveis. Se você mencionar uma entrevista amanhã, a memória útil pode ser "verificar depois da entrevista", não "armazenar isso para sempre em `MEMORY.md`."

[Compromissos](/pt-BR/concepts/commitments) são memórias de acompanhamento opcionais e de curta duração para esse caso. O OpenClaw as infere em uma passagem de fundo oculta, limita-as ao mesmo agente e canal, e entrega check-ins vencidos por meio de heartbeat. Lembretes explícitos ainda usam [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** — encontra notas relevantes usando busca semântica, mesmo quando a redação difere da original.
- **`memory_get`** — lê um arquivo de memória específico ou um intervalo de linhas.

As duas ferramentas são fornecidas pelo plugin de active memory (padrão: `memory-core`).

## Plugin complementar Memory Wiki

Se quiser que a memória durável se comporte mais como uma base de conhecimento mantida do que apenas notas brutas, use o plugin incluído `memory-wiki`.

`memory-wiki` compila conhecimento durável em um cofre wiki com:

- estrutura de página determinística
- alegações e evidências estruturadas
- rastreamento de contradição e atualidade
- painéis gerados
- resumos compilados para consumidores do agente/runtime
- ferramentas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Ele não substitui o plugin de active memory. O plugin de active memory ainda é responsável por recuperação, promoção e dreaming. `memory-wiki` adiciona uma camada de conhecimento rica em proveniência ao lado dele.

Consulte [Memory Wiki](/pt-BR/plugins/memory-wiki).

## Busca de memória

Quando um provedor de embeddings está configurado, `memory_search` usa **busca híbrida** — combinando similaridade vetorial (significado semântico) com correspondência por palavras-chave (termos exatos como IDs e símbolos de código). Isso funciona imediatamente assim que você tem uma chave de API para qualquer provedor compatível.

<Info>
O OpenClaw detecta automaticamente seu provedor de embeddings a partir das chaves de API disponíveis. Se você tiver uma chave da OpenAI, Gemini, Voyage ou Mistral configurada, a busca de memória será habilitada automaticamente.
</Info>

Para detalhes sobre como a busca funciona, opções de ajuste e configuração de provedores, consulte [Busca de memória](/pt-BR/concepts/memory-search).

## Backends de memória

<CardGroup cols={3}>
<Card title="Integrado (padrão)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavras-chave, similaridade vetorial e busca híbrida. Sem dependências extras.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Sidecar local-first com reranking, expansão de consulta e capacidade de indexar diretórios fora do espaço de trabalho.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória entre sessões nativa de IA com modelagem de usuário, busca semântica e consciência multiagente. Instalação por plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/pt-BR/plugins/memory-lancedb">
Memória incluída baseada em LanceDB com embeddings compatíveis com OpenAI, recuperação automática, captura automática e suporte a embeddings locais do Ollama.
</Card>
</CardGroup>

## Camada de wiki de conhecimento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pt-BR/plugins/memory-wiki">
Compila memória durável em um cofre wiki rico em proveniência com alegações, painéis, modo ponte e fluxos de trabalho compatíveis com Obsidian.
</Card>
</CardGroup>

## Descarga automática da memória

Antes que a [compaction](/pt-BR/concepts/compaction) resuma sua conversa, o OpenClaw executa um turno silencioso que lembra o agente de salvar contexto importante em arquivos de memória. Isso vem ativado por padrão — você não precisa configurar nada.

Para manter esse turno de manutenção em um modelo local, defina uma substituição exata do modelo de descarga de memória:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

A substituição se aplica apenas ao turno de descarga de memória e não herda a cadeia de fallback da sessão ativa.

<Tip>
A descarga de memória evita perda de contexto durante a compaction. Se seu agente tiver fatos importantes na conversa que ainda não foram gravados em um arquivo, eles serão salvos automaticamente antes que o resumo aconteça.
</Tip>

## Dreaming

Dreaming é uma passagem opcional de consolidação em segundo plano para memória. Ele coleta sinais de curto prazo, pontua candidatos e promove apenas itens qualificados para a memória de longo prazo (`MEMORY.md`).

Ele foi projetado para manter a memória de longo prazo com alto sinal:

- **Opcional**: desativado por padrão.
- **Agendado**: quando ativado, `memory-core` gerencia automaticamente um job cron recorrente para uma varredura completa de dreaming.
- **Com limiares**: promoções devem passar por gates de pontuação, frequência de recuperação e diversidade de consulta.
- **Revisável**: resumos de fase e entradas de diário são gravados em `DREAMS.md` para revisão humana.

Para comportamento de fases, sinais de pontuação e detalhes do Diário de Sonhos, consulte [Dreaming](/pt-BR/concepts/dreaming).

## Preenchimento fundamentado e promoção ao vivo

O sistema de dreaming agora tem duas trilhas de revisão intimamente relacionadas:

- **Dreaming ao vivo** trabalha a partir do armazenamento de dreaming de curto prazo em `memory/.dreams/` e é o que a fase profunda normal usa ao decidir o que pode se graduar para `MEMORY.md`.
- **Preenchimento fundamentado** lê notas históricas `memory/YYYY-MM-DD.md` como arquivos de dia independentes e grava saída de revisão estruturada em `DREAMS.md`.

O preenchimento fundamentado é útil quando você quer reproduzir notas antigas e inspecionar o que o sistema considera durável sem editar manualmente `MEMORY.md`.

Quando você usa:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

os candidatos duráveis fundamentados não são promovidos diretamente. Eles são preparados no mesmo armazenamento de dreaming de curto prazo que a fase profunda normal já usa. Isso significa:

- `DREAMS.md` continua sendo a superfície de revisão humana.
- o armazenamento de curto prazo continua sendo a superfície de ranqueamento voltada à máquina.
- `MEMORY.md` ainda é gravado apenas pela promoção profunda.

Se você decidir que a reprodução não foi útil, pode remover os artefatos preparados sem tocar em entradas comuns de diário ou no estado normal de recuperação:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Leitura adicional

- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin): backend SQLite padrão.
- [Mecanismo de memória QMD](/pt-BR/concepts/memory-qmd): sidecar local-first avançado.
- [Memória Honcho](/pt-BR/concepts/memory-honcho): memória entre sessões nativa de IA.
- [Memory LanceDB](/pt-BR/plugins/memory-lancedb): plugin baseado em LanceDB com embeddings compatíveis com OpenAI.
- [Memory Wiki](/pt-BR/plugins/memory-wiki): cofre de conhecimento compilado e ferramentas nativas de wiki.
- [Busca de memória](/pt-BR/concepts/memory-search): pipeline de busca, provedores e ajustes.
- [Dreaming](/pt-BR/concepts/dreaming): promoção em segundo plano da recuperação de curto prazo para memória de longo prazo.
- [Referência de configuração de memória](/pt-BR/reference/memory-config): todos os controles de configuração.
- [Compaction](/pt-BR/concepts/compaction): como a compaction interage com a memória.

## Relacionado

- [Active memory](/pt-BR/concepts/active-memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
- [Memória Honcho](/pt-BR/concepts/memory-honcho)
- [Memory LanceDB](/pt-BR/plugins/memory-lancedb)
- [Compromissos](/pt-BR/concepts/commitments)
