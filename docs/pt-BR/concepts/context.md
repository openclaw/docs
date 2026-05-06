---
read_when:
    - Você quer entender o que "contexto" significa no OpenClaw
    - Você está investigando por que o modelo "sabe" algo (ou se esqueceu disso)
    - Você quer reduzir a sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: o que o modelo vê, como ele é construído e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-05-06T05:50:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

"Contexto" é **tudo o que o OpenClaw envia ao modelo para uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt do sistema** (construído pelo OpenClaw): regras, ferramentas, lista de Skills, horário/runtime e arquivos do workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente nesta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leituras de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que "memória": a memória pode ser armazenada em disco e recarregada depois; contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar contexto)

- `/status` → visualização rápida de "quão cheia está minha janela?" + configurações da sessão.
- `/context list` → o que está injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: tamanhos por arquivo, por esquema de ferramenta, por entrada de Skill e do prompt do sistema.
- `/usage tokens` → adiciona um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos de barra](/pt-BR/tools/slash-commands), [Uso de tokens e custos](/pt-BR/reference/token-use), [Compaction](/pt-BR/concepts/compaction).

## Exemplo de saída

Os valores variam por modelo, provedor, política de ferramentas e pelo que há no seu workspace.

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
- Chamadas de ferramentas + resultados de ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de Compaction e artefatos de poda.
- "Wrappers" ou cabeçalhos ocultos do provedor (não visíveis, mas ainda contados).

## Como o OpenClaw constrói o prompt do sistema

O prompt do sistema é **propriedade do OpenClaw** e é reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (apenas metadados; veja abaixo).
- Localização do workspace.
- Horário (UTC + horário convertido do usuário, se configurado).
- Metadados de runtime (host/SO/modelo/raciocínio).
- Arquivos de bootstrap do workspace injetados em **Contexto do projeto**.

Detalhamento completo: [Prompt do sistema](/pt-BR/concepts/system-prompt).

## Arquivos do workspace injetados (Contexto do projeto)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do workspace (se presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão de `12000` caracteres). O OpenClaw também impõe um limite total de injeção de bootstrap entre arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão de `60000` caracteres). `/context` mostra os tamanhos **brutos vs injetados** e se ocorreu truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso no prompt em Contexto do projeto. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: injetadas vs carregadas sob demanda

O prompt do sistema inclui uma **lista de Skills** compacta (nome + descrição + localização). Essa lista tem overhead real.

As instruções de Skill _não_ são incluídas por padrão. Espera-se que o modelo use `read` no `SKILL.md` da Skill **somente quando necessário**.

## Ferramentas: há dois custos

Ferramentas afetam o contexto de duas maneiras:

1. **Texto da lista de ferramentas** no prompt do sistema (o que você vê como "Ferramentas").
2. **Esquemas de ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Eles contam para o contexto, embora você não os veja como texto simples.

`/context detail` detalha os maiores esquemas de ferramentas para que você veja o que domina.

## Comandos, diretivas e "atalhos inline"

Comandos de barra são tratados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos independentes**: uma mensagem que é somente `/...` é executada como comando.
- **Diretivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidas antes de o modelo ver a mensagem.
  - Mensagens contendo apenas diretivas persistem configurações da sessão.
  - Diretivas inline em uma mensagem normal agem como dicas por mensagem.
- **Atalhos inline** (somente remetentes permitidos): certos tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: "ei /status") e são removidos antes de o modelo ver o texto restante.

Detalhes: [Comandos de barra](/pt-BR/tools/slash-commands).

## Sessões, Compaction e poda (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/podado pela política.
- **Compaction** persiste um resumo na transcrição e mantém as mensagens recentes intactas.
- **Poda** descarta resultados antigos de ferramentas do prompt _em memória_ para liberar espaço na janela de contexto, mas não reescreve a transcrição da sessão - o histórico completo ainda pode ser inspecionado em disco.

Docs: [Sessão](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Poda de sessão](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto `legacy` integrado para montagem e
Compaction. Se você instalar um plugin que fornece `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delegará a montagem
do contexto, `/compact` e os hooks relacionados de ciclo de vida de contexto de subagente a esse
mecanismo. `ownsCompaction: false` não faz fallback automático para o mecanismo
`legacy`; o mecanismo ativo ainda deve implementar `compact()` corretamente. Veja
[Mecanismo de contexto](/pt-BR/concepts/context-engine) para a interface
plugável completa, hooks de ciclo de vida e configuração.

## O que `/context` realmente relata

`/context` prefere o relatório mais recente do prompt do sistema **construído pela execução** quando disponível:

- `System prompt (run)` = capturado da última execução incorporada (capaz de usar ferramentas) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = computado em tempo real quando não existe relatório de execução (ou ao executar por um backend de CLI que não gera o relatório).

De qualquer forma, ele relata tamanhos e principais contribuidores; ele **não** despeja o prompt do sistema completo nem os esquemas de ferramentas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Mecanismo de contexto" href="/pt-BR/concepts/context-engine" icon="puzzle-piece">
    Injeção de contexto personalizada via plugins.
  </Card>
  <Card title="Compaction" href="/pt-BR/concepts/compaction" icon="compress">
    Resumo de conversas longas para mantê-las dentro da janela do modelo.
  </Card>
  <Card title="Prompt do sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    Como o prompt do sistema é construído e o que ele injeta a cada turno.
  </Card>
  <Card title="Loop do agente" href="/pt-BR/concepts/agent-loop" icon="arrows-rotate">
    O ciclo completo de execução do agente, da mensagem recebida à resposta final.
  </Card>
</CardGroup>
