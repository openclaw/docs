---
read_when:
    - Você quer entender o que "contexto" significa no OpenClaw
    - Você está depurando por que o modelo "sabe" algo (ou se esqueceu disso)
    - Você quer reduzir a sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: o que o modelo vê, como ele é construído e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-05-10T19:30:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

"Contexto" é **tudo que o OpenClaw envia ao modelo para uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt do sistema** (criado pelo OpenClaw): regras, ferramentas, lista de Skills, hora/runtime e arquivos de workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente nesta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leituras de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que "memória": a memória pode ser armazenada em disco e recarregada depois; contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar contexto)

- `/status` → visualização rápida de "quão cheia está minha janela?" + configurações da sessão.
- `/context list` → o que foi injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: tamanhos por arquivo, por esquema de ferramenta, por entrada de Skill e tamanho do prompt do sistema.
- `/context map` → imagem de mapa em árvore no estilo WinDirStat dos contribuidores de contexto rastreados da sessão atual.
- `/usage tokens` → adiciona um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos de barra](/pt-BR/tools/slash-commands), [Uso de tokens e custos](/pt-BR/reference/token-use), [Compaction](/pt-BR/concepts/compaction).

## Saída de exemplo

Os valores variam conforme o modelo, o provedor, a política de ferramentas e o que existe no seu workspace.

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

### `/context map`

Envia uma imagem gerada a partir do relatório de execução em cache mais recente. Antes que uma mensagem normal tenha produzido um relatório de execução na sessão, `/context map` retorna uma mensagem de indisponibilidade em vez de renderizar uma estimativa. A área do retângulo é proporcional aos caracteres de prompt rastreados:

- arquivos de workspace injetados
- texto base do prompt do sistema
- entradas de prompt de Skills
- esquemas JSON de ferramentas

`/context list`, `/context detail` e `/context json` ainda conseguem inspecionar uma estimativa sob demanda quando nenhum relatório de execução está em cache.

## O que conta para a janela de contexto

Tudo que o modelo recebe conta, incluindo:

- Prompt do sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramentas + resultados de ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de Compaction e artefatos de poda.
- "Wrappers" ou cabeçalhos ocultos do provedor (não visíveis, mas ainda contados).

## Como o OpenClaw constrói o prompt do sistema

O prompt do sistema é **controlado pelo OpenClaw** e reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (apenas metadados; veja abaixo).
- Localização do workspace.
- Hora (UTC + hora convertida do usuário, se configurada).
- Metadados de runtime (host/SO/modelo/raciocínio).
- Arquivos de bootstrap do workspace injetados em **Contexto do Projeto**.

Detalhamento completo: [Prompt do sistema](/pt-BR/concepts/system-prompt).

## Arquivos de workspace injetados (Contexto do Projeto)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do workspace (se presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão de `12000` caracteres). O OpenClaw também aplica um limite total de injeção de bootstrap entre arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão de `60000` caracteres). `/context` mostra os tamanhos **bruto vs injetado** e se houve truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso dentro do prompt em Contexto do Projeto. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: injetadas vs carregadas sob demanda

O prompt do sistema inclui uma **lista de Skills** compacta (nome + descrição + localização). Essa lista tem overhead real.

As instruções de Skill _não_ são incluídas por padrão. Espera-se que o modelo faça `read` do `SKILL.md` da Skill **somente quando necessário**.

## Ferramentas: há dois custos

Ferramentas afetam o contexto de duas formas:

1. **Texto da lista de ferramentas** no prompt do sistema (o que você vê como "Ferramentas").
2. **Esquemas de ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Eles contam para o contexto, embora você não os veja como texto simples.

`/context detail` detalha os maiores esquemas de ferramentas para que você veja o que domina.

## Comandos, diretivas e "atalhos inline"

Comandos de barra são tratados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos autônomos**: uma mensagem que é apenas `/...` é executada como comando.
- **Diretivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidas antes que o modelo veja a mensagem.
  - Mensagens contendo apenas diretivas persistem as configurações da sessão.
  - Diretivas inline em uma mensagem normal atuam como dicas por mensagem.
- **Atalhos inline** (somente remetentes permitidos): certos tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: "hey /status") e são removidos antes que o modelo veja o texto restante.

Detalhes: [Comandos de barra](/pt-BR/tools/slash-commands).

## Sessões, Compaction e poda (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/podado pela política.
- **Compaction** persiste um resumo na transcrição e mantém as mensagens recentes intactas.
- **Poda** remove resultados antigos de ferramentas do prompt _em memória_ para liberar espaço na janela de contexto, mas não reescreve a transcrição da sessão - o histórico completo ainda pode ser inspecionado em disco.

Documentação: [Sessão](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Poda de sessão](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto integrado `legacy` para montagem e
Compaction. Se você instalar um Plugin que fornece `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delega a montagem de
contexto, `/compact` e hooks relacionados do ciclo de vida de contexto de subagentes para esse
mecanismo. `ownsCompaction: false` não faz fallback automático para o mecanismo
legado; o mecanismo ativo ainda deve implementar `compact()` corretamente. Veja
[Mecanismo de contexto](/pt-BR/concepts/context-engine) para a interface plugável
completa, hooks de ciclo de vida e configuração.

## O que `/context` realmente relata

`/context` prefere o relatório de prompt do sistema **construído pela execução** mais recente quando disponível:

- `System prompt (run)` = capturado da última execução incorporada (com suporte a ferramentas) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = calculado em tempo real quando não há relatório de execução (ou ao executar por um backend de CLI que não gera o relatório).

De qualquer forma, ele relata tamanhos e principais contribuidores; ele **não** despeja o prompt do sistema completo nem esquemas de ferramentas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Mecanismo de contexto" href="/pt-BR/concepts/context-engine" icon="puzzle-piece">
    Injeção de contexto personalizada via plugins.
  </Card>
  <Card title="Compaction" href="/pt-BR/concepts/compaction" icon="compress">
    Resumir conversas longas para mantê-las dentro da janela do modelo.
  </Card>
  <Card title="Prompt do sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    Como o prompt do sistema é construído e o que ele injeta em cada turno.
  </Card>
  <Card title="Loop do agente" href="/pt-BR/concepts/agent-loop" icon="arrows-rotate">
    O ciclo completo de execução do agente, da mensagem recebida à resposta final.
  </Card>
</CardGroup>
