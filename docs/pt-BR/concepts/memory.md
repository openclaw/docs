---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória escrever
summary: Como o OpenClaw lembra informações entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-05-10T19:30:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw lembra coisas gravando **arquivos Markdown simples** no workspace do seu agente. O modelo só "lembra" o que é salvo em disco — não há estado oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** — memória de longo prazo. Fatos duráveis, preferências e decisões. Carregado no início de toda sessão de DM.
- **`memory/YYYY-MM-DD.md`** — notas diárias. Contexto em andamento e observações. As notas de hoje e de ontem são carregadas automaticamente.
- **`DREAMS.md`** (opcional) — Diário de Dreaming e resumos de varreduras de dreaming para revisão humana, incluindo entradas de preenchimento histórico fundamentado.

Esses arquivos ficam no workspace do agente (padrão `~/.openclaw/workspace`).

## O que vai onde

`MEMORY.md` é a camada compacta e curada. Use-o para fatos duráveis, preferências, decisões permanentes e resumos curtos que devem estar disponíveis no início de uma sessão privada principal. Ele não foi feito para ser uma transcrição bruta, um registro diário ou um arquivo exaustivo.

Os arquivos `memory/YYYY-MM-DD.md` são a camada de trabalho. Use-os para notas diárias detalhadas, observações, resumos de sessão e contexto bruto que ainda pode ser útil mais tarde. Esses arquivos são indexados para `memory_search` e `memory_get`, mas não são injetados no prompt normal de bootstrap a cada turno.

Com o tempo, espera-se que o agente destile material útil das notas diárias para `MEMORY.md` e remova entradas antigas de longo prazo. As instruções geradas do workspace e o fluxo de Heartbeat podem fazer isso periodicamente; você não precisa editar manualmente `MEMORY.md` para cada detalhe lembrado.

Se `MEMORY.md` ultrapassar o orçamento de arquivo de bootstrap, o OpenClaw mantém o arquivo intacto em disco, mas trunca a cópia injetada no contexto do modelo. Trate isso como um sinal para mover material detalhado de volta para `memory/*.md`, manter apenas o resumo durável em `MEMORY.md` ou aumentar os limites de bootstrap se você explicitamente quiser gastar mais orçamento de prompt. Use `/context list`, `/context detail` ou `openclaw doctor` para ver tamanhos brutos versus injetados e o status de truncamento.

<Tip>
Se quiser que seu agente lembre algo, basta pedir: "Lembre que eu prefiro TypeScript." Ele gravará isso no arquivo apropriado.
</Tip>

## Compromissos inferidos

Alguns acompanhamentos futuros não são fatos duráveis. Se você mencionar uma entrevista amanhã, a memória útil pode ser "verificar depois da entrevista", não "armazenar isto para sempre em `MEMORY.md`."

[Compromissos](/pt-BR/concepts/commitments) são memórias de acompanhamento opt-in e de curta duração para esse caso. O OpenClaw os infere em uma passagem oculta em segundo plano, delimita-os ao mesmo agente e canal, e entrega check-ins vencidos por meio de Heartbeat. Lembretes explícitos ainda usam [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** — encontra notas relevantes usando busca semântica, mesmo quando a formulação difere da original.
- **`memory_get`** — lê um arquivo de memória específico ou intervalo de linhas.

As duas ferramentas são fornecidas pelo plugin de Active Memory (padrão: `memory-core`).

## Plugin complementar Memory Wiki

Se você quiser que a memória durável se comporte mais como uma base de conhecimento mantida do que apenas notas brutas, use o plugin integrado `memory-wiki`.

`memory-wiki` compila conhecimento durável em um cofre wiki com:

- estrutura de páginas determinística
- afirmações e evidências estruturadas
- rastreamento de contradições e atualidade
- dashboards gerados
- resumos compilados para consumidores de agente/runtime
- ferramentas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Ele não substitui o plugin de Active Memory. O plugin de Active Memory ainda é responsável por recuperação, promoção e dreaming. `memory-wiki` adiciona uma camada de conhecimento rica em proveniência ao lado dele.

Consulte [Memory Wiki](/pt-BR/plugins/memory-wiki).

## Busca de memória

Quando um provedor de embeddings está configurado, `memory_search` usa **busca híbrida** — combinando similaridade vetorial (significado semântico) com correspondência por palavras-chave (termos exatos como IDs e símbolos de código). Isso funciona imediatamente assim que você tiver uma chave de API para qualquer provedor compatível.

<Info>
O OpenClaw detecta automaticamente seu provedor de embeddings a partir das chaves de API disponíveis. Se você tiver uma chave OpenAI, Gemini, Voyage ou Mistral configurada, a busca de memória será ativada automaticamente.
</Info>

Para detalhes sobre como a busca funciona, opções de ajuste e configuração de provedores, consulte [Busca de memória](/pt-BR/concepts/memory-search).

## Backends de memória

<CardGroup cols={3}>
<Card title="Integrado (padrão)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavra-chave, similaridade vetorial e busca híbrida. Sem dependências extras.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Sidecar local-first com reranking, expansão de consulta e capacidade de indexar diretórios fora do workspace.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória cross-session nativa de IA com modelagem de usuário, busca semântica e consciência multiagente. Instalação de Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/pt-BR/plugins/memory-lancedb">
Memória integrada baseada em LanceDB com embeddings compatíveis com OpenAI, recuperação automática, captura automática e suporte a embeddings locais do Ollama.
</Card>
</CardGroup>

## Camada de wiki de conhecimento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pt-BR/plugins/memory-wiki">
Compila memória durável em um cofre wiki rico em proveniência com afirmações, dashboards, modo ponte e fluxos de trabalho compatíveis com Obsidian.
</Card>
</CardGroup>

## Descarga automática de memória

Antes de [Compaction](/pt-BR/concepts/compaction) resumir sua conversa, o OpenClaw executa um turno silencioso que lembra o agente de salvar contexto importante em arquivos de memória. Isso fica ativado por padrão — você não precisa configurar nada.

Para manter esse turno de manutenção em um modelo local, defina uma substituição exata de modelo para descarga de memória:

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
A descarga de memória evita perda de contexto durante a Compaction. Se seu agente tiver fatos importantes na conversa que ainda não foram gravados em um arquivo, eles serão salvos automaticamente antes que o resumo aconteça.
</Tip>

## Dreaming

Dreaming é uma passagem opcional de consolidação em segundo plano para memória. Ele coleta sinais de curto prazo, pontua candidatos e promove apenas itens qualificados para a memória de longo prazo (`MEMORY.md`).

Ele foi projetado para manter a memória de longo prazo com alto sinal:

- **Opt-in**: desativado por padrão.
- **Agendado**: quando ativado, `memory-core` gerencia automaticamente um trabalho de cron recorrente para uma varredura completa de dreaming.
- **Com limiares**: promoções devem passar por portas de pontuação, frequência de recuperação e diversidade de consultas.
- **Revisável**: resumos de fase e entradas de diário são gravados em `DREAMS.md` para revisão humana.

Para comportamento de fases, sinais de pontuação e detalhes do Diário de Dreaming, consulte [Dreaming](/pt-BR/concepts/dreaming).

## Preenchimento fundamentado e promoção ao vivo

O sistema de dreaming agora tem duas trilhas de revisão estreitamente relacionadas:

- **Dreaming ao vivo** trabalha a partir do armazenamento de dreaming de curto prazo em `memory/.dreams/` e é o que a fase profunda normal usa ao decidir o que pode se graduar para `MEMORY.md`.
- **Preenchimento fundamentado** lê notas históricas `memory/YYYY-MM-DD.md` como arquivos diários independentes e grava saída de revisão estruturada em `DREAMS.md`.

O preenchimento fundamentado é útil quando você quer reproduzir notas antigas e inspecionar o que o sistema considera durável sem editar manualmente `MEMORY.md`.

Quando você usa:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

os candidatos duráveis fundamentados não são promovidos diretamente. Eles são preparados no mesmo armazenamento de dreaming de curto prazo que a fase profunda normal já usa. Isso significa que:

- `DREAMS.md` continua sendo a superfície de revisão humana.
- o armazenamento de curto prazo continua sendo a superfície de ranqueamento voltada à máquina.
- `MEMORY.md` ainda é gravado apenas por promoção profunda.

Se você decidir que a reprodução não foi útil, pode remover os artefatos preparados sem tocar nas entradas comuns do diário ou no estado normal de recuperação:

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

- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin): backend SQLite padrão.
- [Mecanismo de memória QMD](/pt-BR/concepts/memory-qmd): sidecar local-first avançado.
- [Memória Honcho](/pt-BR/concepts/memory-honcho): memória cross-session nativa de IA.
- [Memory LanceDB](/pt-BR/plugins/memory-lancedb): plugin baseado em LanceDB com embeddings compatíveis com OpenAI.
- [Memory Wiki](/pt-BR/plugins/memory-wiki): cofre de conhecimento compilado e ferramentas nativas de wiki.
- [Busca de memória](/pt-BR/concepts/memory-search): pipeline de busca, provedores e ajustes.
- [Dreaming](/pt-BR/concepts/dreaming): promoção em segundo plano de recuperação de curto prazo para memória de longo prazo.
- [Referência de configuração de memória](/pt-BR/reference/memory-config): todos os controles de configuração.
- [Compaction](/pt-BR/concepts/compaction): como a Compaction interage com a memória.

## Relacionado

- [Active Memory](/pt-BR/concepts/active-memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
- [Memória Honcho](/pt-BR/concepts/memory-honcho)
- [Memory LanceDB](/pt-BR/plugins/memory-lancedb)
- [Compromissos](/pt-BR/concepts/commitments)
