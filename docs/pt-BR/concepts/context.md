---
read_when:
    - Você quer entender o que “contexto” significa no OpenClaw
    - Você está depurando por que o modelo “sabe” algo (ou se esqueceu disso)
    - Você quer reduzir a sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: o que o modelo vê, como ele é construído e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-04-12T23:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3620db1a8c1956d91a01328966df491388d3a32c4003dc4447197eb34316c77d
    source_path: concepts/context.md
    workflow: 15
---

# Contexto

“Contexto” é **tudo o que o OpenClaw envia ao modelo para uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt do sistema** (construído pelo OpenClaw): regras, ferramentas, lista de Skills, tempo/runtime e arquivos do workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente nesta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leituras de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que “memória”: a memória pode ser armazenada em disco e recarregada depois; contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar o contexto)

- `/status` → visão rápida de “quão cheia está minha janela?” + configurações da sessão.
- `/context list` → o que está sendo injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: por arquivo, tamanhos de schema de ferramenta, tamanhos de entrada por skill e tamanho do prompt do sistema.
- `/usage tokens` → adiciona um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos de barra](/pt-BR/tools/slash-commands), [Uso de tokens e custos](/pt-BR/reference/token-use), [Compaction](/pt-BR/concepts/compaction).

## Exemplo de saída

Os valores variam conforme o modelo, provedor, política de ferramentas e o que está no seu workspace.

### `/context list`

```
🧠 Detalhamento do contexto
Workspace: <workspaceDir>
Bootstrap máx./arquivo: 20,000 chars
Sandbox: mode=non-main sandboxed=false
Prompt do sistema (execução): 38,412 chars (~9,603 tok) (Contexto do projeto 23,901 chars (~5,976 tok))

Arquivos do workspace injetados:
- AGENTS.md: OK | bruto 1,742 chars (~436 tok) | injetado 1,742 chars (~436 tok)
- SOUL.md: OK | bruto 912 chars (~228 tok) | injetado 912 chars (~228 tok)
- TOOLS.md: TRUNCADO | bruto 54,210 chars (~13,553 tok) | injetado 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | bruto 211 chars (~53 tok) | injetado 211 chars (~53 tok)
- USER.md: OK | bruto 388 chars (~97 tok) | injetado 388 chars (~97 tok)
- HEARTBEAT.md: AUSENTE | bruto 0 | injetado 0
- BOOTSTRAP.md: OK | bruto 0 chars (~0 tok) | injetado 0 chars (~0 tok)

Lista de Skills (texto do prompt do sistema): 2,184 chars (~546 tok) (12 skills)
Ferramentas: read, edit, write, exec, process, browser, message, sessions_send, …
Lista de ferramentas (texto do prompt do sistema): 1,032 chars (~258 tok)
Schemas de ferramentas (JSON): 31,988 chars (~7,997 tok) (contam para o contexto; não mostrados como texto)
Ferramentas: (mesmas acima)

Tokens da sessão (em cache): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Detalhamento do contexto (detalhado)
…
Principais skills (tamanho da entrada no prompt):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 mais skills)

Principais ferramentas (tamanho do schema):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N mais ferramentas)
```

## O que conta para a janela de contexto

Tudo o que o modelo recebe conta, incluindo:

- Prompt do sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramentas + resultados de ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de compaction e artefatos de pruning.
- “Wrappers” do provedor ou cabeçalhos ocultos (não visíveis, mas ainda contam).

## Como o OpenClaw constrói o prompt do sistema

O prompt do sistema é **de propriedade do OpenClaw** e reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (apenas metadados; veja abaixo).
- Local do workspace.
- Hora (UTC + hora do usuário convertida, se configurada).
- Metadados de runtime (host/OS/modelo/thinking).
- Arquivos bootstrap do workspace injetados em **Contexto do projeto**.

Detalhamento completo: [Prompt do sistema](/pt-BR/concepts/system-prompt).

## Arquivos do workspace injetados (Contexto do projeto)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do workspace (se presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão `20000` chars). O OpenClaw também impõe um limite total de injeção de bootstrap entre os arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão `150000` chars). `/context` mostra os tamanhos **bruto vs injetado** e se houve truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso dentro do prompt em Contexto do projeto. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: injetadas vs carregadas sob demanda

O prompt do sistema inclui uma **lista de Skills** compacta (nome + descrição + local). Essa lista tem uma sobrecarga real.

As instruções de Skill _não_ são incluídas por padrão. Espera-se que o modelo use `read` no `SKILL.md` da skill **somente quando necessário**.

## Ferramentas: há dois custos

As ferramentas afetam o contexto de duas formas:

1. **Texto da lista de ferramentas** no prompt do sistema (o que você vê como “Tooling”).
2. **Schemas de ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Eles contam para o contexto mesmo que você não os veja como texto simples.

`/context detail` detalha os maiores schemas de ferramentas para que você possa ver o que mais pesa.

## Comandos, diretivas e "atalhos inline"

Os comandos de barra são tratados pelo Gateway. Existem alguns comportamentos diferentes:

- **Comandos autônomos**: uma mensagem que contém apenas `/...` é executada como comando.
- **Diretivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidos antes que o modelo veja a mensagem.
  - Mensagens com apenas diretivas persistem as configurações da sessão.
  - Diretivas inline em uma mensagem normal funcionam como dicas por mensagem.
- **Atalhos inline** (apenas remetentes permitidos): certos tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: “hey /status”) e são removidos antes que o modelo veja o texto restante.

Detalhes: [Comandos de barra](/pt-BR/tools/slash-commands).

## Sessões, compaction e pruning (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/removido pela política.
- **Compaction** persiste um resumo na transcrição e mantém intactas as mensagens recentes.
- **Pruning** remove resultados antigos de ferramentas do prompt _em memória_ de uma execução, mas não reescreve a transcrição.

Documentação: [Sessão](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Session pruning](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto `legacy` integrado para montagem e
compaction. Se você instalar um plugin que fornece `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delega a montagem do contexto, `/compact` e hooks relacionados ao ciclo de vida do contexto de subagentes a esse
mecanismo. `ownsCompaction: false` não faz fallback automático para o
mecanismo legado; o mecanismo ativo ainda precisa implementar `compact()` corretamente. Veja
[Context Engine](/pt-BR/concepts/context-engine) para a interface conectável completa,
hooks de ciclo de vida e configuração.

## O que `/context` realmente informa

`/context` prefere o relatório mais recente do prompt do sistema **construído na execução**, quando disponível:

- `System prompt (run)` = capturado da última execução embutida (com suporte a ferramentas) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = calculado dinamicamente quando não existe relatório de execução (ou ao executar por um backend de CLI que não gera o relatório).

De qualquer forma, ele informa tamanhos e principais contribuintes; ele **não** exibe o prompt do sistema completo nem os schemas das ferramentas.

## Relacionado

- [Context Engine](/pt-BR/concepts/context-engine) — injeção de contexto personalizada via plugins
- [Compaction](/pt-BR/concepts/compaction) — resumindo conversas longas
- [Prompt do sistema](/pt-BR/concepts/system-prompt) — como o prompt do sistema é construído
- [Agent Loop](/pt-BR/concepts/agent-loop) — o ciclo completo de execução do agente
