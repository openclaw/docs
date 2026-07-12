---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória deve gravar
summary: Como o OpenClaw se lembra das coisas entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-07-11T23:52:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

O OpenClaw se lembra das coisas escrevendo arquivos Markdown simples no espaço de trabalho do seu agente (padrão: `~/.openclaw/workspace`). O modelo só se lembra do que é salvo em disco; não há estado oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** — memória de longo prazo. Fatos duradouros, preferências e decisões. Carregado no início de uma sessão.
- **`memory/YYYY-MM-DD.md`** (ou `memory/YYYY-MM-DD-<slug>.md`) — anotações diárias. Contexto em andamento e observações. As anotações datadas de hoje e de ontem são carregadas automaticamente ao usar `/new` ou `/reset` sem argumentos; variantes com slug, como as gravadas pelo hook de memória de sessão incluído, são carregadas junto com o arquivo que contém apenas a data.
- **`DREAMS.md`** (opcional) — Diário de Sonhos e resumos das varreduras de Dreaming para revisão humana, incluindo registros históricos retroativos fundamentados.

<Tip>
Se quiser que seu agente se lembre de algo, basta pedir: "Lembre-se de que prefiro TypeScript." Ele grava a anotação no arquivo apropriado.
</Tip>

## O que vai em cada lugar

`MEMORY.md` é a camada compacta e selecionada: fatos duradouros, preferências, decisões permanentes e resumos breves que devem estar disponíveis no início de uma sessão. Não é uma transcrição bruta, um registro diário nem um arquivo exaustivo.

Os arquivos `memory/YYYY-MM-DD.md` são a camada de trabalho: anotações diárias detalhadas, observações, resumos de sessões e contexto bruto que ainda pode ser útil posteriormente. Eles são indexados para `memory_search` e `memory_get`, mas não são inseridos no prompt de inicialização a cada turno.

Com o tempo, o agente extrai material útil das anotações diárias para `MEMORY.md` e remove registros de longo prazo obsoletos. As instruções geradas para o espaço de trabalho e o fluxo de Heartbeat fazem isso periodicamente; você não precisa editar manualmente `MEMORY.md` para cada detalhe.

Se `MEMORY.md` ultrapassar o limite de tamanho dos arquivos de inicialização, o OpenClaw mantém o arquivo intacto em disco, mas trunca a cópia inserida no contexto. Considere isso um sinal para mover o material detalhado para `memory/*.md`, manter apenas um resumo duradouro em `MEMORY.md` ou aumentar os limites de inicialização se quiser gastar mais do orçamento do prompt. Use `/context list`, `/context detail` ou `openclaw doctor` para consultar os tamanhos brutos e inseridos, além do estado de truncamento.

## Memórias sensíveis a ações

A maioria das memórias são anotações comuns em Markdown. Algumas afetam o que o agente deve fazer posteriormente; nesses casos, registre quando é seguro agir com base na anotação, e não apenas o fato em si.

Registre esse limite de ação quando uma anotação envolver:

- requisitos de aprovação ou permissão;
- restrições temporárias;
- transferências para outra sessão, conversa ou pessoa;
- condições de expiração;
- momento seguro para agir;
- autoridade da fonte ou do responsável;
- instruções para evitar uma ação tentadora.

Uma memória útil e sensível a ações deixa claro:

- o que altera o comportamento futuro;
- quando ou sob qual condição ela se aplica;
- quando expira ou o que libera a ação;
- o que o agente deve evitar fazer;
- quem é a fonte ou o responsável, caso isso afete a confiança ou a autoridade.

A memória pode preservar o contexto de aprovação, mas não impõe políticas. Use as configurações de aprovação do OpenClaw, o isolamento em sandbox e as tarefas agendadas para controles operacionais rígidos.

Exemplo:

```md
A migração da API está sendo projetada em outra sessão. Turnos futuros não
devem editar a implementação da API nesta conversa; use as descobertas daqui
apenas como informações para o projeto até que o plano de migração seja aprovado.
```

Outro exemplo:

```md
Um relatório de uma fonte não confiável precisa ser revisado antes de ser
promovido. Turnos futuros devem tratá-lo apenas como evidência; não o armazene
como memória duradoura até que um revisor confiável confirme o conteúdo.
```

Este não é um esquema obrigatório para todas as memórias; fatos simples podem permanecer concisos. Use limites sensíveis a ações quando a perda de informações sobre momento, autoridade, expiração ou contexto seguro para agir puder levar o agente a fazer algo errado posteriormente.

Use [compromissos](/pt-BR/concepts/commitments) para acompanhamentos inferidos e de curta duração. Use [tarefas agendadas](/pt-BR/automation/cron-jobs) para lembretes exatos, verificações programadas e trabalhos recorrentes. A memória ainda pode resumir o contexto duradouro em torno de qualquer um desses caminhos.

## Compromissos inferidos

Alguns acompanhamentos futuros não são fatos duradouros. Se você mencionar uma entrevista amanhã, a memória útil pode ser "perguntar como foi depois da entrevista", e não "armazenar isso para sempre em `MEMORY.md`".

Os [compromissos](/pt-BR/concepts/commitments) são memórias opcionais e de curta duração para acompanhamentos desse tipo. O OpenClaw os infere em uma etapa oculta em segundo plano, restringe-os ao mesmo agente e canal e envia os acompanhamentos devidos por meio do Heartbeat. Lembretes explícitos continuam usando [tarefas agendadas](/pt-BR/automation/cron-jobs).

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com a memória:

- **`memory_search`** — encontra anotações relevantes usando busca semântica, mesmo quando a redação difere do original.
- **`memory_get`** — lê um arquivo de memória específico ou um intervalo de linhas.

As duas ferramentas são fornecidas pelo Plugin de memória ativo (padrão: `memory-core`).

## Busca na memória

Quando um provedor de embeddings está configurado, `memory_search` usa busca híbrida: similaridade vetorial (significado semântico) combinada à correspondência de palavras-chave (termos exatos, como IDs e símbolos de código). Isso funciona imediatamente com uma chave de API de qualquer provedor compatível.

<Info>
O OpenClaw usa embeddings da OpenAI por padrão. Defina explicitamente `agents.defaults.memorySearch.provider` para usar Gemini, Voyage, Mistral, Bedrock, DeepInfra, GGUF local, Ollama, LM Studio, GitHub Copilot ou um endpoint genérico compatível com a OpenAI.
</Info>

Consulte [Busca na memória](/pt-BR/concepts/memory-search) para saber como a busca funciona e conhecer as opções de ajuste e configuração de provedores.

## Backends de memória

<CardGroup cols={3}>
<Card title="Integrado (padrão)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavras-chave, similaridade vetorial e busca híbrida. Sem dependências adicionais.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Processo auxiliar prioritariamente local, com reclassificação, expansão de consultas e capacidade de indexar diretórios fora do espaço de trabalho.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória nativa de IA entre sessões, com modelagem de usuários, busca semântica e percepção de múltiplos agentes. Instalação de Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/pt-BR/plugins/memory-lancedb">
Memória baseada em LanceDB, com embeddings compatíveis com a OpenAI, recuperação automática, captura automática e suporte a embeddings locais do Ollama. Instalação de Plugin.
</Card>
</CardGroup>

## Camada de wiki de conhecimento

Se quiser que a memória duradoura se comporte mais como uma base de conhecimento mantida do que como anotações brutas, use o Plugin `memory-wiki` incluído. Ele compila conhecimento duradouro em um repositório wiki com estrutura de páginas determinística, afirmações e evidências estruturadas, acompanhamento de contradições e atualidade, painéis gerados, resumos compilados e ferramentas nativas da wiki (`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` não substitui o Plugin de memória ativo; o Plugin de memória ativo continua responsável pela recuperação, promoção e Dreaming. `memory-wiki` acrescenta ao lado dele uma camada de conhecimento rica em procedência.

<CardGroup cols={1}>
<Card title="Wiki de memória" icon="book" href="/pt-BR/plugins/memory-wiki">
Compila a memória duradoura em um repositório wiki rico em procedência, com afirmações, painéis, modo de ponte e fluxos de trabalho compatíveis com o Obsidian.
</Card>
</CardGroup>

## Gravação automática da memória

Antes que a [Compaction](/pt-BR/concepts/compaction) resuma sua conversa, o OpenClaw executa um turno silencioso que lembra o agente de salvar o contexto importante nos arquivos de memória. Isso fica ativado por padrão; defina `agents.defaults.compaction.memoryFlush.enabled: false` para desativá-lo.

Para manter esse turno de manutenção em um modelo local, defina uma substituição exata que se aplique somente ao turno de gravação da memória (ele não herda a cadeia de modelos alternativos da sessão ativa):

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
A gravação da memória evita a perda de contexto durante a Compaction. Se o agente tiver fatos importantes na conversa que ainda não foram gravados em um arquivo, eles serão salvos automaticamente antes da criação do resumo.
</Tip>

## Dreaming

Dreaming é uma etapa opcional de consolidação da memória em segundo plano. Ela coleta sinais de recuperação de curto prazo, pontua candidatos e promove somente itens qualificados para a memória de longo prazo (`MEMORY.md`):

- **Opcional**: desativado por padrão.
- **Agendado**: quando ativado, `memory-core` gerencia automaticamente um trabalho Cron recorrente para uma varredura completa de Dreaming.
- **Com limites mínimos**: as promoções precisam passar pelos critérios de pontuação, frequência de recuperação e diversidade de consultas.
- **Revisável**: resumos das fases e registros do diário são gravados em `DREAMS.md` para revisão humana.

Consulte [Dreaming](/pt-BR/concepts/dreaming) para conhecer o comportamento das fases, os sinais de pontuação e os detalhes do Diário de Sonhos.

## Preenchimento retroativo fundamentado e promoção em tempo real

O sistema de Dreaming tem dois fluxos de revisão relacionados:

- **Dreaming em tempo real** trabalha com o armazenamento de Dreaming de curto prazo em `memory/.dreams/` e é usado pela fase profunda normal para decidir o que avança para `MEMORY.md`.
- **Preenchimento retroativo fundamentado** lê anotações históricas de `memory/YYYY-MM-DD.md` como arquivos diários independentes e grava uma saída estruturada para revisão em `DREAMS.md`.

O preenchimento retroativo fundamentado é útil para reprocessar anotações antigas e inspecionar o que o sistema considera duradouro, sem editar manualmente `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

A opção `--stage-short-term` prepara candidatos duradouros fundamentados no mesmo armazenamento de Dreaming de curto prazo que a fase profunda normal já usa; ela não os promove diretamente. Portanto:

- `DREAMS.md` continua sendo a área de revisão humana.
- O armazenamento de curto prazo continua sendo a área de classificação voltada para a máquina.
- `MEMORY.md` continua sendo gravado somente pela promoção profunda.

Para desfazer um reprocessamento sem alterar registros comuns do diário nem o estado normal de recuperação:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Verificar o estado do índice e o provedor
openclaw memory search "query"  # Pesquisar pela linha de comando
openclaw memory index --force   # Recriar o índice
```

## Leitura adicional

- [Busca na memória](/pt-BR/concepts/memory-search): pipeline de busca, provedores e ajustes.
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin): backend SQLite padrão.
- [Mecanismo de memória QMD](/pt-BR/concepts/memory-qmd): processo auxiliar avançado e prioritariamente local.
- [Memória Honcho](/pt-BR/concepts/memory-honcho): memória nativa de IA entre sessões.
- [Memória LanceDB](/pt-BR/plugins/memory-lancedb): Plugin baseado em LanceDB com embeddings compatíveis com a OpenAI.
- [Wiki de memória](/pt-BR/plugins/memory-wiki): repositório de conhecimento compilado e ferramentas nativas da wiki.
- [Dreaming](/pt-BR/concepts/dreaming): promoção em segundo plano da recuperação de curto prazo para a memória de longo prazo.
- [Referência de configuração da memória](/pt-BR/reference/memory-config): todas as opções de configuração.
- [Compaction](/pt-BR/concepts/compaction): como a Compaction interage com a memória.
- [Active Memory](/pt-BR/concepts/active-memory): memória de subagentes para sessões de chat interativas.
