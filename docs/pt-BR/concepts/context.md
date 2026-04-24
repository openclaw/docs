---
read_when:
    - Você quer entender o que “contexto” significa no OpenClaw
    - Você está depurando por que o modelo “sabe” algo (ou se esqueceu disso)
    - Você quer reduzir a sobrecarga de contexto (`/context`, `/status`, `/compact`)
summary: 'Contexto: o que o modelo vê, como ele é montado e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-04-24T05:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

“Contexto” é **tudo o que o OpenClaw envia ao modelo para uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt do sistema** (montado pelo OpenClaw): regras, ferramentas, lista de Skills, horário/runtime e arquivos do workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente para esta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leituras de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que “memória”: a memória pode ser armazenada em disco e recarregada depois; contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar contexto)

- `/status` → visão rápida de “quão cheia está minha janela?” + configurações da sessão.
- `/context list` → o que está sendo injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: tamanhos por arquivo, por schema de ferramenta, por entrada de Skill e tamanho do prompt do sistema.
- `/usage tokens` → acrescenta um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Consulte também: [Comandos de barra](/pt-BR/tools/slash-commands), [Uso de tokens e custos](/pt-BR/reference/token-use), [Compaction](/pt-BR/concepts/compaction).

## Exemplo de saída

Os valores variam conforme o modelo, provider, política de ferramentas e o que existe no seu workspace.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## O que conta para a janela de contexto

Tudo o que o modelo recebe conta, incluindo:

- Prompt do sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramenta + resultados de ferramenta.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de Compaction e artefatos de pruning.
- “Wrappers” do provider ou cabeçalhos ocultos (não visíveis, mas ainda contabilizados).

## Como o OpenClaw monta o prompt do sistema

O prompt do sistema é **propriedade do OpenClaw** e é reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (apenas metadados; veja abaixo).
- Localização do workspace.
- Horário (UTC + horário do usuário convertido, se configurado).
- Metadados de runtime (host/OS/modelo/raciocínio).
- Arquivos bootstrap do workspace injetados em **Project Context**.

Detalhamento completo: [Prompt do sistema](/pt-BR/concepts/system-prompt).

## Arquivos do workspace injetados (Project Context)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do workspace (se existirem):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão `12000` caracteres). O OpenClaw também aplica um limite total de injeção de bootstrap entre arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão `60000` caracteres). `/context` mostra os tamanhos **bruto vs injetado** e se houve truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso no prompt em Project Context. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: injetadas vs carregadas sob demanda

O prompt do sistema inclui uma **lista compacta de Skills** (nome + descrição + localização). Essa lista tem sobrecarga real.

As instruções das Skills _não_ são incluídas por padrão. Espera-se que o modelo use `read` no `SKILL.md` da Skill **somente quando necessário**.

## Ferramentas: há dois custos

Ferramentas afetam o contexto de duas formas:

1. **Texto da lista de ferramentas** no prompt do sistema (o que você vê como “Tooling”).
2. **Schemas de ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Eles contam para o contexto, mesmo que você não os veja como texto simples.

`/context detail` detalha os maiores schemas de ferramentas para que você veja o que mais pesa.

## Comandos, diretivas e "atalhos inline"

Comandos de barra são tratados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos autônomos**: uma mensagem que contém apenas `/...` é executada como comando.
- **Diretivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidas antes que o modelo veja a mensagem.
  - Mensagens contendo apenas diretivas persistem configurações da sessão.
  - Diretivas inline em uma mensagem normal atuam como dicas por mensagem.
- **Atalhos inline** (apenas remetentes em allowlist): certos tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: “oi /status”) e são removidos antes que o modelo veja o texto restante.

Detalhes: [Comandos de barra](/pt-BR/tools/slash-commands).

## Sessões, Compaction e pruning (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/removido pela política.
- **Compaction** persiste um resumo na transcrição e mantém intactas as mensagens recentes.
- **Pruning** remove resultados antigos de ferramenta do prompt _em memória_ para liberar espaço na janela de contexto, mas não reescreve a transcrição da sessão — o histórico completo ainda pode ser inspecionado em disco.

Documentação: [Sessão](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Pruning de sessão](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto integrado `legacy` para montagem e
Compaction. Se você instalar um Plugin que forneça `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delegará a montagem
do contexto, `/compact` e hooks relacionados do ciclo de vida de contexto de subagentes a esse
mecanismo. `ownsCompaction: false` não faz fallback automático para o mecanismo
legado; o mecanismo ativo ainda deve implementar `compact()` corretamente. Consulte
[Context Engine](/pt-BR/concepts/context-engine) para a interface completa
conectável, hooks de ciclo de vida e configuração.

## O que `/context` realmente relata

`/context` prefere o relatório mais recente do prompt do sistema **montado em execução** quando disponível:

- `System prompt (run)` = capturado da última execução incorporada (com capacidade de ferramenta) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = calculado em tempo real quando não existe relatório de execução (ou ao executar por um backend de CLI que não gera o relatório).

Em ambos os casos, ele relata tamanhos e principais contribuintes; ele **não** despeja o prompt completo do sistema nem os schemas de ferramenta.

## Relacionado

- [Context Engine](/pt-BR/concepts/context-engine) — injeção de contexto personalizada via plugins
- [Compaction](/pt-BR/concepts/compaction) — resumir conversas longas
- [Prompt do sistema](/pt-BR/concepts/system-prompt) — como o prompt do sistema é montado
- [Ciclo do agente](/pt-BR/concepts/agent-loop) — o ciclo completo de execução do agente
