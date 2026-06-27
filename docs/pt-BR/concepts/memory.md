---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória escrever
summary: Como o OpenClaw lembra coisas entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-06-27T17:25:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw lembra das coisas escrevendo **arquivos Markdown simples** no workspace
do seu agente. O modelo só "lembra" do que é salvo em disco — não há estado
oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** — memória de longo prazo. Fatos duráveis, preferências e
  decisões. Carregado no início de cada sessão de DM.
- **`memory/YYYY-MM-DD.md`** (ou **`memory/YYYY-MM-DD-<slug>.md`**) — notas diárias.
  Contexto em andamento e observações. As notas de hoje e de ontem são
  carregadas automaticamente, e variantes com slug, como as escritas pelo hook
  de memória de sessão incluído em `/new` ou `/reset`, agora são coletadas junto
  com o arquivo que tem apenas a data.
- **`DREAMS.md`** (opcional) — Diário de Dreaming e resumos de varreduras de
  Dreaming para revisão humana, incluindo entradas fundamentadas de preenchimento
  histórico.

Esses arquivos ficam no workspace do agente (padrão `~/.openclaw/workspace`).

## O que vai onde

`MEMORY.md` é a camada compacta e curada. Use-o para fatos duráveis,
preferências, decisões permanentes e resumos curtos que devem estar disponíveis
no início de uma sessão privada principal. Ele não foi feito para ser uma
transcrição bruta, um registro diário ou um arquivo exaustivo.

Os arquivos `memory/YYYY-MM-DD.md` são a camada de trabalho. Use-os para notas
diárias detalhadas, observações, resumos de sessão e contexto bruto que ainda
possa ser útil depois. Esses arquivos são indexados para `memory_search` e
`memory_get`, mas não são injetados no prompt normal de bootstrap a cada turno.

Com o tempo, espera-se que o agente destile material útil das notas diárias
para `MEMORY.md` e remova entradas obsoletas de longo prazo. As instruções
geradas do workspace e o fluxo de Heartbeat podem fazer isso periodicamente;
você não precisa editar manualmente `MEMORY.md` para cada detalhe lembrado.

Se `MEMORY.md` ultrapassar o orçamento de arquivo de bootstrap, o OpenClaw mantém
o arquivo em disco intacto, mas trunca a cópia injetada no contexto do modelo.
Trate isso como um sinal para mover material detalhado de volta para
`memory/*.md`, manter apenas o resumo durável em `MEMORY.md` ou aumentar os
limites de bootstrap se você quiser explicitamente gastar mais orçamento de
prompt. Use `/context list`, `/context detail` ou `openclaw doctor` para ver os
tamanhos brutos e injetados e o status de truncamento.

<Tip>
Se você quiser que seu agente lembre de algo, basta pedir: "Lembre que eu
prefiro TypeScript." Ele escreverá isso no arquivo apropriado.
</Tip>

## Memórias sensíveis a ações

A maioria das memórias pode ser escrita como notas Markdown comuns. Mas algumas memórias afetam o que o agente deve fazer depois. Para essas, registre quando é seguro agir com base na nota, não apenas o fato em si.

Registre esse limite de ação quando uma nota envolver:

- requisitos de aprovação ou permissão,
- restrições temporárias,
- handoffs para outra sessão, thread ou pessoa,
- condições de expiração,
- momento seguro para agir,
- autoridade da fonte ou do proprietário,
- instruções para evitar uma ação tentadora.

Uma memória sensível a ações útil deixa claro:

- o que muda o comportamento futuro,
- quando ou sob qual condição ela se aplica,
- quando ela expira, ou o que libera a ação,
- o que o agente deve evitar fazer,
- quem é a fonte ou o proprietário, se isso afetar confiança ou autoridade.

A memória pode preservar o contexto de aprovação, mas não aplica política. Use as configurações de aprovação, sandboxing e tarefas agendadas do OpenClaw para controles operacionais rígidos.

Exemplo:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Outro exemplo:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Use [compromissos](/pt-BR/concepts/commitments) para acompanhamentos inferidos e de curta duração. Use [tarefas agendadas](/pt-BR/automation/cron-jobs) para lembretes exatos, verificações temporizadas e trabalho recorrente. A memória ainda pode resumir o contexto durável em torno de qualquer um dos caminhos.

Este não é um esquema obrigatório para toda memória. Fatos simples podem continuar concisos. Use limites sensíveis a ações quando perder o contexto de momento, autoridade, expiração ou segurança para agir puder fazer o agente executar a ação errada depois.

## Compromissos inferidos

Alguns acompanhamentos futuros não são fatos duráveis. Se você mencionar uma
entrevista amanhã, a memória útil pode ser "verificar depois da entrevista", não
"armazenar isso para sempre em `MEMORY.md`."

[Compromissos](/pt-BR/concepts/commitments) são memórias de acompanhamento opcionais e
de curta duração para esse caso. O OpenClaw os infere em uma passagem oculta em
segundo plano, os limita ao mesmo agente e canal e entrega check-ins vencidos
por meio do Heartbeat. Lembretes explícitos ainda usam [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** — encontra notas relevantes usando busca semântica, mesmo
  quando a redação é diferente da original.
- **`memory_get`** — lê um arquivo de memória específico ou um intervalo de linhas.

As duas ferramentas são fornecidas pelo plugin de memória ativa (padrão: `memory-core`).

## Plugin complementar Memory Wiki

Se você quiser que a memória durável se comporte mais como uma base de
conhecimento mantida do que apenas notas brutas, use o plugin incluído
`memory-wiki`.

`memory-wiki` compila conhecimento durável em um cofre wiki com:

- estrutura de páginas determinística
- alegações e evidências estruturadas
- rastreamento de contradições e atualidade
- dashboards gerados
- digests compilados para consumidores de agente/runtime
- ferramentas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Ele não substitui o plugin de memória ativa. O plugin de memória ativa ainda
controla recuperação, promoção e Dreaming. `memory-wiki` adiciona uma camada de
conhecimento rica em proveniência ao lado dele.

Veja [Memory Wiki](/pt-BR/plugins/memory-wiki).

## Busca de memória

Quando um provedor de embeddings está configurado, `memory_search` usa **busca
híbrida** — combinando similaridade vetorial (significado semântico) com
correspondência por palavras-chave (termos exatos como IDs e símbolos de código).
Isso funciona imediatamente depois que você tem uma chave de API para qualquer
provedor compatível.

<Info>
O OpenClaw usa embeddings da OpenAI por padrão. Defina
`agents.defaults.memorySearch.provider` explicitamente para usar embeddings do
Gemini, Voyage, Mistral, local, Ollama, Bedrock, GitHub Copilot ou compatíveis
com OpenAI.
</Info>

Para detalhes sobre como a busca funciona, opções de ajuste e configuração de
provedores, veja [Busca de memória](/pt-BR/concepts/memory-search).

## Backends de memória

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavras-chave, similaridade vetorial e
busca híbrida. Sem dependências extras.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Sidecar local-first com reranking, expansão de consultas e capacidade de indexar
diretórios fora do workspace.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória AI-native entre sessões com modelagem de usuário, busca semântica e
consciência multiagente. Instalação de plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/pt-BR/plugins/memory-lancedb">
Memória incluída baseada em LanceDB com embeddings compatíveis com OpenAI,
recuperação automática, captura automática e suporte a embeddings locais do Ollama.
</Card>
</CardGroup>

## Camada wiki de conhecimento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pt-BR/plugins/memory-wiki">
Compila memória durável em um cofre wiki rico em proveniência, com alegações,
dashboards, modo ponte e fluxos de trabalho compatíveis com Obsidian.
</Card>
</CardGroup>

## Descarga automática de memória

Antes de [Compaction](/pt-BR/concepts/compaction) resumir sua conversa, o OpenClaw
executa um turno silencioso que lembra o agente de salvar contexto importante em
arquivos de memória. Isso vem ativado por padrão — você não precisa configurar nada.

Para manter esse turno de manutenção em um modelo local, defina uma substituição
exata de modelo para descarga de memória:

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

A substituição se aplica apenas ao turno de descarga de memória e não herda a
cadeia de fallback da sessão ativa.

<Tip>
A descarga de memória evita perda de contexto durante a Compaction. Se seu agente
tiver fatos importantes na conversa que ainda não foram escritos em um arquivo,
eles serão salvos automaticamente antes que o resumo aconteça.
</Tip>

## Dreaming

Dreaming é uma passagem opcional de consolidação em segundo plano para memória. Ela coleta
sinais de curto prazo, pontua candidatos e promove apenas itens qualificados para
a memória de longo prazo (`MEMORY.md`).

Ela foi projetada para manter a memória de longo prazo com alto sinal:

- **Opt-in**: desativada por padrão.
- **Agendada**: quando ativada, `memory-core` gerencia automaticamente um job de Cron
  recorrente para uma varredura completa de Dreaming.
- **Com limiar**: as promoções precisam passar por critérios de pontuação, frequência de recuperação e
  diversidade de consultas.
- **Revisável**: resumos de fase e entradas de diário são escritos em `DREAMS.md`
  para revisão humana.

Para comportamento de fases, sinais de pontuação e detalhes do Diário de Dreaming, veja
[Dreaming](/pt-BR/concepts/dreaming).

## Preenchimento fundamentado e promoção ao vivo

O sistema de Dreaming agora tem dois caminhos de revisão estreitamente relacionados:

- **Dreaming ao vivo** trabalha a partir do armazenamento de Dreaming de curto prazo em
  `memory/.dreams/` e é o que a fase profunda normal usa ao decidir o que
  pode se graduar para `MEMORY.md`.
- **Preenchimento fundamentado** lê notas históricas `memory/YYYY-MM-DD.md` como
  arquivos de dia independentes e grava saída de revisão estruturada em `DREAMS.md`.

O preenchimento fundamentado é útil quando você quer reproduzir notas antigas e inspecionar o que
o sistema considera durável sem editar manualmente `MEMORY.md`.

Quando você usa:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

os candidatos duráveis fundamentados não são promovidos diretamente. Eles são preparados no
mesmo armazenamento de Dreaming de curto prazo que a fase profunda normal já usa. Isso
significa:

- `DREAMS.md` continua sendo a superfície de revisão humana.
- o armazenamento de curto prazo continua sendo a superfície de ranqueamento voltada para máquina.
- `MEMORY.md` ainda é escrito apenas pela promoção profunda.

Se você decidir que a reprodução não foi útil, pode remover os artefatos preparados
sem tocar nas entradas de diário comuns ou no estado normal de recuperação:

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
- [Memória Honcho](/pt-BR/concepts/memory-honcho): memória AI-native entre sessões.
- [Memory LanceDB](/pt-BR/plugins/memory-lancedb): plugin baseado em LanceDB com embeddings compatíveis com OpenAI.
- [Memory Wiki](/pt-BR/plugins/memory-wiki): cofre de conhecimento compilado e ferramentas nativas de wiki.
- [Busca de memória](/pt-BR/concepts/memory-search): pipeline de busca, provedores e ajuste.
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
