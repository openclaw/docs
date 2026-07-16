---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória gravar
summary: Como o OpenClaw se lembra das coisas entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-07-16T12:24:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw se lembra das coisas gravando arquivos Markdown simples no espaço de trabalho do seu agente
(o padrão é `~/.openclaw/workspace`). O modelo só se lembra do que é
salvo em disco; não há estado oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** — memória de longo prazo. Fatos duradouros, preferências e
  decisões. Carregado no início de uma sessão.
- **`memory/YYYY-MM-DD.md`** (ou `memory/YYYY-MM-DD-<slug>.md`) — anotações diárias.
  Contexto contínuo e observações. As anotações datadas de hoje e de ontem são carregadas
  automaticamente em um `/new` ou `/reset` simples; variantes com slug, como as
  gravadas pelo hook de memória de sessão incluído, são carregadas junto com o
  arquivo que contém apenas a data.
- **`DREAMS.md`** (opcional) — Diário de Sonhos e resumos das varreduras de Dreaming para
  revisão humana, incluindo entradas históricas de preenchimento retroativo fundamentado.

<Tip>
Se quiser que seu agente se lembre de algo, basta pedir: "Lembre-se de que
prefiro TypeScript." Ele grava a anotação no arquivo apropriado.
</Tip>

## O que vai em cada lugar

`MEMORY.md` é a camada compacta e selecionada: fatos duradouros, preferências, decisões
permanentes e resumos curtos que devem estar disponíveis no início de uma
sessão. Não é uma transcrição bruta, um registro diário nem um arquivo exaustivo.

Os arquivos `memory/YYYY-MM-DD.md` são a camada de trabalho: anotações diárias detalhadas,
observações, resumos de sessões e contexto bruto que ainda pode ser útil
posteriormente. Eles são indexados para `memory_search` e `memory_get`, mas não são
injetados no prompt de inicialização a cada turno.

Com o tempo, o agente extrai material útil das anotações diárias para
`MEMORY.md` e remove entradas de longo prazo obsoletas. As instruções
geradas para o espaço de trabalho e o fluxo de Heartbeat fazem isso periodicamente; não é necessário
editar manualmente `MEMORY.md` para cada detalhe.

Se `MEMORY.md` ultrapassar o orçamento de arquivos de inicialização, o OpenClaw mantém o arquivo
intacto no disco, mas trunca a cópia injetada no contexto. Considere isso um
sinal para mover material detalhado para `memory/*.md`, manter apenas um
resumo duradouro em `MEMORY.md` ou aumentar os limites de inicialização caso queira usar mais
orçamento de prompt. Use `/context list`, `/context detail` ou `openclaw doctor` para
ver os tamanhos brutos e injetados e o status do truncamento.

## Importar de assistentes de programação

A IU de Controle pode importar memória local existente do Codex e do Claude Code.
Abra **Settings** → **Import Memory**, escolha o agente de destino, revise os
arquivos detectados e confirme a importação. O OpenClaw copia somente memória em Markdown:

- Codex: os arquivos consolidados `MEMORY.md` e `memory_summary.md` em
  `~/.codex/memories` (ou `CODEX_HOME/memories`). Arquivos brutos de execução e de transcrição
  não são importados.
- Claude Code: arquivos Markdown de cada diretório de memória automática do projeto em
  `~/.claude/projects/*/memory`, além de um
  `autoMemoryDirectory` configurado pelo usuário, quando presente. Instruções do projeto, sessões, configurações
  e credenciais não fazem parte desta ação exclusiva de memória.

Os arquivos importados permanecem separados em `memory/imports/codex/` e
`memory/imports/claude-code/` no espaço de trabalho do agente selecionado. Eles são indexados
para `memory_search` e ficam disponíveis por meio de `memory_get`; não são mesclados ao
`MEMORY.md` de inicialização do agente. Os arquivos de origem permanecem inalterados.

A visualização marca conflitos no destino. Ative **Replace existing imports** para
substituir esses arquivos; a aplicação cria um backup verificado anterior à importação e preserva
cópias individuais dos arquivos sobrescritos no relatório de migração.

## Memórias sensíveis a ações

A maioria das memórias são anotações Markdown comuns. Algumas afetam o que o agente deve
fazer posteriormente; nesses casos, registre quando é seguro agir com base na anotação, não apenas o
fato em si.

Registre esse limite de ação quando uma anotação envolver:

- requisitos de aprovação ou permissão,
- restrições temporárias,
- transferências para outra sessão, thread ou pessoa,
- condições de expiração,
- momento seguro para agir,
- autoridade da fonte ou do responsável,
- instruções para evitar uma ação tentadora.

Uma memória útil e sensível a ações deixa claro:

- o que altera o comportamento futuro,
- quando ou sob qual condição ela se aplica,
- quando ela expira ou o que libera a ação,
- o que o agente deve evitar fazer,
- quem é a fonte ou o responsável, caso isso afete a confiança ou a autoridade.

A memória pode preservar o contexto de aprovação, mas não impõe políticas. Use
as configurações de aprovação, o isolamento em sandbox e as tarefas agendadas do
OpenClaw para controles operacionais rígidos.

Exemplo:

```md
A migração da API está sendo projetada em outra sessão. Os próximos turnos não devem
editar a implementação da API a partir desta thread; use as descobertas daqui apenas como
informações para o projeto até que o plano de migração seja concluído.
```

Outro exemplo:

```md
Um relatório de uma fonte não confiável precisa ser revisado antes de ser promovido. Os próximos turnos
devem tratá-lo apenas como evidência; não o armazene como memória duradoura até que um
revisor confiável confirme o conteúdo.
```

Esse não é um esquema obrigatório para toda memória; fatos simples podem permanecer concisos.
Use limites sensíveis a ações quando a perda do momento, da autoridade, da expiração ou do
contexto de quando é seguro agir puder levar o agente a fazer algo errado posteriormente.

Use [compromissos](/pt-BR/concepts/commitments) para acompanhamentos inferidos e de curta duração.
Use [tarefas agendadas](/pt-BR/automation/cron-jobs) para lembretes exatos, verificações programadas
e trabalho recorrente. A memória ainda pode resumir o contexto duradouro relacionado a
qualquer um desses caminhos.

## Compromissos inferidos

Alguns acompanhamentos futuros não são fatos duradouros. Se você mencionar uma entrevista
amanhã, a memória útil pode ser "verificar como foi após a entrevista", não "armazenar
isso para sempre em `MEMORY.md`."

[Compromissos](/pt-BR/concepts/commitments) são memórias opcionais de acompanhamento
de curta duração para esse caso. O OpenClaw as infere em uma passagem oculta em segundo plano,
limita-as ao mesmo agente e canal e entrega as verificações devidas por meio do
Heartbeat. Lembretes explícitos ainda usam [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** — encontra anotações relevantes usando pesquisa semântica, mesmo quando
  a redação difere da original.
- **`memory_get`** — lê um arquivo de memória ou intervalo de linhas específico.

As duas ferramentas são fornecidas pelo Plugin de memória ativo (padrão: `memory-core`).

## Pesquisa de memória

Quando um provedor de embeddings está configurado, `memory_search` usa pesquisa híbrida:
similaridade vetorial (significado semântico) combinada com correspondência de palavras-chave (termos exatos,
como IDs e símbolos de código). Isso funciona imediatamente com uma chave de API
de qualquer provedor compatível.

<Info>
O OpenClaw usa embeddings da OpenAI por padrão. Defina
`agents.defaults.memorySearch.provider` explicitamente para usar Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF local, Ollama, LM Studio, GitHub Copilot ou
um endpoint genérico compatível com OpenAI.
</Info>

Consulte [Pesquisa de memória](/pt-BR/concepts/memory-search) para saber como a pesquisa funciona, as opções de
ajuste e a configuração do provedor.

## Backends de memória

<CardGroup cols={3}>
<Card title="Integrado (padrão)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com pesquisa por palavras-chave, similaridade vetorial e
pesquisa híbrida. Sem dependências adicionais.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Sidecar local-first com reordenação, expansão de consultas e capacidade de indexar
diretórios fora do espaço de trabalho.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória entre sessões nativa de IA, com modelagem de usuários, pesquisa semântica e
percepção multiagente. Instalação de Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/pt-BR/plugins/memory-lancedb">
Memória baseada em LanceDB com embeddings compatíveis com OpenAI, recuperação automática,
captura automática e suporte a embeddings locais do Ollama. Instalação de Plugin.
</Card>
</CardGroup>

## Camada de wiki de conhecimento

Se quiser que a memória duradoura se comporte mais como uma base de conhecimento mantida
do que como anotações brutas, use o Plugin `memory-wiki` incluído. Ele compila conhecimento
duradouro em um cofre de wiki com estrutura de páginas determinística, afirmações e
evidências estruturadas, rastreamento de contradições e atualidade, painéis
gerados, resumos compilados e ferramentas nativas de wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` não substitui o Plugin de memória ativo; o Plugin de memória
ativo ainda é responsável pela recuperação, promoção e Dreaming. `memory-wiki` adiciona uma
camada de conhecimento rica em proveniência ao lado dele.

<CardGroup cols={1}>
<Card title="Wiki de Memória" icon="book" href="/pt-BR/plugins/memory-wiki">
Compila memória duradoura em um cofre de wiki rico em proveniência, com afirmações,
painéis, modo de ponte e fluxos de trabalho compatíveis com Obsidian.
</Card>
</CardGroup>

## Descarregamento automático da memória

Antes de [Compaction](/pt-BR/concepts/compaction) resumir sua conversa,
o OpenClaw executa um turno silencioso que lembra o agente de salvar contextos importantes
nos arquivos de memória. Isso fica ativado por padrão; defina
`agents.defaults.compaction.memoryFlush.enabled: false` para desativá-lo.

Para manter esse turno de manutenção em um modelo local, defina uma substituição exata que
se aplique apenas ao turno de descarregamento da memória (ele não herda a cadeia de fallback
do modelo da sessão ativa):

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

<Tip>
O descarregamento da memória evita a perda de contexto durante a Compaction. Se o agente tiver
fatos importantes na conversa que ainda não tenham sido gravados em um arquivo, eles
serão salvos automaticamente antes que o resumo seja feito.
</Tip>

## Dreaming

Dreaming é uma passagem opcional de consolidação da memória em segundo plano. Ela coleta
sinais de recuperação de curto prazo, pontua candidatos e promove apenas itens
qualificados para a memória de longo prazo (`MEMORY.md`):

- **Opcional**: desativado por padrão.
- **Agendado**: quando ativado, `memory-core` gerencia automaticamente um trabalho Cron
  recorrente para uma varredura completa de Dreaming.
- **Com limites**: as promoções devem passar pelos critérios de pontuação, frequência de recuperação e
  diversidade de consultas.
- **Revisável**: resumos de fases e entradas do diário são gravados em
  `DREAMS.md` para revisão humana.

Consulte [Dreaming](/pt-BR/concepts/dreaming) para saber mais sobre o comportamento das fases, os sinais de pontuação e
os detalhes do Diário de Sonhos.

## Preenchimento retroativo fundamentado e promoção em tempo real

O sistema de Dreaming tem dois fluxos de revisão relacionados:

- **Dreaming em tempo real** funciona a partir do armazenamento de Dreaming de curto prazo em
  `memory/.dreams/` e é o que a fase profunda normal usa para decidir o que
  passa para `MEMORY.md`.
- **Preenchimento retroativo fundamentado** lê anotações históricas de `memory/YYYY-MM-DD.md` como
  arquivos diários independentes e grava a saída estruturada da revisão em `DREAMS.md`.

O preenchimento retroativo fundamentado é útil para reproduzir anotações antigas e inspecionar o que o
sistema considera duradouro, sem editar manualmente `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

A flag `--stage-short-term` prepara candidatos duradouros fundamentados no mesmo
armazenamento de Dreaming de curto prazo que a fase profunda normal já usa; ela não
os promove diretamente. Portanto:

- `DREAMS.md` continua sendo a superfície de revisão humana.
- O armazenamento de curto prazo continua sendo a superfície de classificação voltada para a máquina.
- `MEMORY.md` ainda é gravado apenas pela promoção profunda.

Para desfazer uma reprodução sem alterar entradas comuns do diário nem o estado normal de
recuperação:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Verifica o status do índice e o provedor
openclaw memory search "query"  # Pesquisa pela linha de comando
openclaw memory index --force   # Reconstrói o índice
```

## Leitura adicional

- [Busca na memória](/pt-BR/concepts/memory-search): pipeline de busca, provedores e ajustes.
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin): backend SQLite padrão.
- [Mecanismo de memória QMD](/pt-BR/concepts/memory-qmd): sidecar avançado com prioridade para execução local.
- [Memória Honcho](/pt-BR/concepts/memory-honcho): memória nativa de IA entre sessões.
- [Memória LanceDB](/pt-BR/plugins/memory-lancedb): plugin baseado em LanceDB com embeddings compatíveis com OpenAI.
- [Wiki de memória](/pt-BR/plugins/memory-wiki): repositório de conhecimento compilado e ferramentas nativas de wiki.
- [Dreaming](/pt-BR/concepts/dreaming): promoção em segundo plano da recuperação de curto prazo para a memória de longo prazo.
- [Referência de configuração de memória](/pt-BR/reference/memory-config): todas as opções de configuração.
- [Compaction](/pt-BR/concepts/compaction): como a compactação interage com a memória.
- [Memória ativa](/pt-BR/concepts/active-memory): memória de subagentes para sessões de chat interativas.
