---
read_when:
    - Você quer entender o que “contexto” significa no OpenClaw
    - Você está depurando por que o modelo “sabe” algo (ou se esqueceu disso)
    - Você quer reduzir a sobrecarga de contexto (`/context`, `/status`, `/compact`)
summary: 'Contexto: o que o modelo vê, como ele é construído e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-04-06T03:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe7dfe52cb1a64df229c8622feed1804df6c483a6243e0d2f309f6ff5c9fe521
    source_path: concepts/context.md
    workflow: 15
---

# Contexto

“Contexto” é **tudo o que o OpenClaw envia ao modelo em uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt de sistema** (construído pelo OpenClaw): regras, ferramentas, lista de Skills, hora/tempo de execução e arquivos do workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente desta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leituras de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que “memória”: a memória pode ser armazenada em disco e recarregada depois; o contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar contexto)

- `/status` → visão rápida de “quão cheia está minha janela?” + configurações da sessão.
- `/context list` → o que está sendo injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: tamanhos por arquivo, por schema de ferramenta, por entrada de Skill e tamanho do prompt de sistema.
- `/usage tokens` → adiciona um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos slash](/pt-BR/tools/slash-commands), [Uso de tokens e custos](/pt-BR/reference/token-use), [Compactação](/pt-BR/concepts/compaction).

## Exemplo de saída

Os valores variam conforme o modelo, o provedor, a política de ferramentas e o que está no seu workspace.

### `/context list`

```
🧠 Detalhamento do contexto
Workspace: <workspaceDir>
Máx. bootstrap/arquivo: 20,000 chars
Sandbox: mode=non-main sandboxed=false
Prompt de sistema (execução): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Arquivos de workspace injetados:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Lista de Skills (texto do prompt de sistema): 2,184 chars (~546 tok) (12 skills)
Ferramentas: read, edit, write, exec, process, browser, message, sessions_send, …
Lista de ferramentas (texto do prompt de sistema): 1,032 chars (~258 tok)
Schemas de ferramentas (JSON): 31,988 chars (~7,997 tok) (conta para o contexto; não é mostrado como texto)
Ferramentas: (igual ao acima)

Tokens da sessão (em cache): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Detalhamento do contexto (detalhado)
…
Principais Skills (tamanho da entrada no prompt):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Principais ferramentas (tamanho do schema):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## O que conta para a janela de contexto

Tudo o que o modelo recebe conta, incluindo:

- Prompt de sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramentas + resultados de ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de compactação e artefatos de poda.
- “Wrappers” do provedor ou cabeçalhos ocultos (não visíveis, mas ainda contam).

## Como o OpenClaw constrói o prompt de sistema

O prompt de sistema é **controlado pelo OpenClaw** e reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (apenas metadados; veja abaixo).
- Localização do workspace.
- Hora (UTC + hora convertida do usuário, se configurada).
- Metadados de execução (host/OS/modelo/raciocínio).
- Arquivos bootstrap do workspace injetados em **Project Context**.

Detalhamento completo: [Prompt de sistema](/pt-BR/concepts/system-prompt).

## Arquivos de workspace injetados (Project Context)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do workspace (se presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão `20000` chars). O OpenClaw também aplica um limite total de injeção de bootstrap entre os arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão `150000` chars). `/context` mostra os tamanhos **brutos vs injetados** e se houve truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso no prompt em Project Context. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: injetadas vs carregadas sob demanda

O prompt de sistema inclui uma **lista compacta de Skills** (nome + descrição + localização). Essa lista tem sobrecarga real.

As instruções das Skills _não_ são incluídas por padrão. Espera-se que o modelo use `read` no `SKILL.md` da Skill **apenas quando necessário**.

## Ferramentas: há dois custos

As ferramentas afetam o contexto de duas formas:

1. **Texto da lista de ferramentas** no prompt de sistema (o que você vê como “Tooling”).
2. **Schemas de ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Contam para o contexto mesmo que você não os veja como texto simples.

`/context detail` detalha os maiores schemas de ferramentas para que você veja o que mais pesa.

## Comandos, diretivas e "atalhos inline"

Os comandos slash são tratados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos independentes**: uma mensagem que é apenas `/...` é executada como comando.
- **Diretivas**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidos antes que o modelo veja a mensagem.
  - Mensagens compostas apenas por diretivas persistem as configurações da sessão.
  - Diretivas inline em uma mensagem normal funcionam como dicas por mensagem.
- **Atalhos inline** (apenas remetentes na allowlist): certos tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: “hey /status”) e são removidos antes que o modelo veja o texto restante.

Detalhes: [Comandos slash](/pt-BR/tools/slash-commands).

## Sessões, compactação e poda (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/podado pela política.
- **Compactação** persiste um resumo na transcrição e mantém as mensagens recentes intactas.
- **Poda** remove resultados antigos de ferramentas do prompt _em memória_ de uma execução, mas não reescreve a transcrição.

Docs: [Sessão](/pt-BR/concepts/session), [Compactação](/pt-BR/concepts/compaction), [Poda de sessão](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto `legacy` integrado para montagem e
compactação. Se você instalar um plugin que forneça `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delega a montagem do contexto,
`/compact` e os hooks relacionados do ciclo de vida do contexto de subagentes para esse
mecanismo. `ownsCompaction: false` não faz fallback automático para o
mecanismo legado; o mecanismo ativo ainda precisa implementar `compact()` corretamente. Veja
[Context Engine](/pt-BR/concepts/context-engine) para a interface conectável completa,
hooks de ciclo de vida e configuração.

## O que `/context` realmente informa

`/context` prefere o relatório mais recente do prompt de sistema **construído em execução** quando disponível:

- `System prompt (run)` = capturado da última execução incorporada (capaz de usar ferramentas) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = calculado em tempo real quando ainda não existe um relatório de execução.

De qualquer forma, ele informa tamanhos e principais contribuintes; ele **não** exibe o prompt de sistema completo nem os schemas de ferramentas.

## Relacionados

- [Context Engine](/pt-BR/concepts/context-engine) — injeção de contexto personalizada via plugins
- [Compactação](/pt-BR/concepts/compaction) — resumindo conversas longas
- [Prompt de sistema](/pt-BR/concepts/system-prompt) — como o prompt de sistema é construído
- [Loop do agente](/pt-BR/concepts/agent-loop) — o ciclo completo de execução do agente
