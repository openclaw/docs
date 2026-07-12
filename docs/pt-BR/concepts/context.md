---
read_when:
    - Você quer entender o que significa “contexto” no OpenClaw
    - Você está investigando por que o modelo "sabe" algo (ou se esqueceu disso)
    - Você quer reduzir a sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: o que o modelo vê, como ele é criado e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-07-11T23:51:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"Contexto" é **tudo o que o OpenClaw envia ao modelo durante uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt do sistema** (criado pelo OpenClaw): regras, ferramentas, lista de Skills, horário/ambiente de execução e arquivos do espaço de trabalho injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente nesta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leitura de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que "memória": a memória pode ser armazenada em disco e recarregada posteriormente; o contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar o contexto)

- `/status` → visão rápida de "quanto da minha janela está ocupado?" + configurações da sessão.
- `/context list` → o que está injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais aprofundado: tamanhos por arquivo, por esquema de ferramenta, por entrada de Skill, tamanho do prompt do sistema e contagens de mensagens da transcrição que podem passar por Compaction.
- `/context map` → imagem de mapa de árvore no estilo WinDirStat com os elementos rastreados que contribuem para o contexto da sessão atual.
- `/usage tokens` → adiciona um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos de barra](/pt-BR/tools/slash-commands), [Uso e custos de tokens](/pt-BR/reference/token-use), [Compaction](/pt-BR/concepts/compaction).

## Exemplo de saída

Os valores variam conforme o modelo, o provedor, a política de ferramentas e o conteúdo do seu espaço de trabalho.

### `/context list`

```text
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

```text
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

Envia uma imagem gerada a partir do relatório mais recente de execução armazenado em cache e da transcrição da sessão. Antes que uma mensagem normal produza um relatório de execução na sessão, `/context map` retorna uma mensagem de indisponibilidade em vez de renderizar uma estimativa. A área de cada retângulo é proporcional aos caracteres rastreados do prompt:

- transcrição da conversa (mensagens do usuário, respostas do assistente, resultados de ferramentas, resumos de Compaction), além do contexto de execução por turno e das adições de prompt de hooks que chegam apenas ao modelo
- arquivos injetados do espaço de trabalho
- texto-base do prompt do sistema
- entradas de prompt de Skills
- esquemas JSON das ferramentas

O grupo da conversa cresce junto com a sessão, portanto o mapa muda a cada turno; após a Compaction, ele se reduz a um bloco de resumos.

`/context list`, `/context detail` e `/context json` ainda podem inspecionar uma estimativa sob demanda quando nenhum relatório de execução está armazenado em cache.

## O que conta para a janela de contexto

Tudo o que o modelo recebe conta, incluindo:

- Prompt do sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramentas + resultados das ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de Compaction e artefatos de poda.
- "Wrappers" do provedor ou cabeçalhos ocultos (não visíveis, mas ainda contabilizados).

## Como o OpenClaw cria o prompt do sistema

O prompt do sistema é **controlado pelo OpenClaw** e recriado a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (apenas metadados; veja abaixo).
- Localização do espaço de trabalho.
- Horário (UTC + horário convertido do usuário, se configurado).
- Metadados do ambiente de execução (host/SO/modelo/raciocínio).
- Arquivos de inicialização do espaço de trabalho injetados em **Contexto do projeto**.

Detalhamento completo: [Prompt do sistema](/pt-BR/concepts/system-prompt).

## Arquivos injetados do espaço de trabalho (Contexto do projeto)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do espaço de trabalho (se estiverem presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente na primeira execução)

Arquivos grandes são truncados individualmente conforme `agents.defaults.bootstrapMaxChars` (padrão: `20000` caracteres). O OpenClaw também aplica um limite total à injeção de arquivos de inicialização por meio de `agents.defaults.bootstrapTotalMaxChars` (padrão: `60000` caracteres). `/context` mostra os tamanhos **bruto e injetado** e se houve truncamento.

Quando ocorre truncamento, o ambiente de execução pode injetar um bloco de aviso no próprio prompt, em Contexto do projeto. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão: `always`).

## Skills: injetadas versus carregadas sob demanda

O prompt do sistema inclui uma **lista de Skills** compacta (nome + descrição + localização). Essa lista tem uma sobrecarga real.

As instruções das Skills _não_ são incluídas por padrão. Espera-se que o modelo use `read` no arquivo `SKILL.md` da Skill **somente quando necessário**.

## Ferramentas: há dois custos

As ferramentas afetam o contexto de duas maneiras:

1. **Texto da lista de ferramentas** no prompt do sistema (o que você vê como "Ferramentas").
2. **Esquemas das ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar as ferramentas. Contam para o contexto, embora você não os veja como texto simples.

`/context detail` detalha os maiores esquemas de ferramentas para que você possa identificar o que predomina.

## Comandos, diretivas e "atalhos embutidos"

Os comandos de barra são processados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos independentes**: uma mensagem que contém apenas `/...` é executada como comando.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` são removidas antes que o modelo veja a mensagem.
  - Mensagens que contêm apenas diretivas mantêm as configurações da sessão.
  - Diretivas embutidas em uma mensagem normal funcionam como sugestões específicas para essa mensagem.
- **Atalhos embutidos** (somente remetentes incluídos na lista de permissões): determinados tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: "olá /status") e são removidos antes que o modelo veja o texto restante.

Detalhes: [Comandos de barra](/pt-BR/tools/slash-commands).

## Sessões, Compaction e poda (o que persiste)

O que persiste entre as mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até passar por Compaction ou ser podado pela política.
- **Compaction** mantém um resumo na transcrição e preserva intactas as mensagens recentes.
- **Poda** remove resultados antigos de ferramentas do prompt _em memória_ para liberar espaço na janela de contexto, mas não reescreve a transcrição da sessão — o histórico completo ainda pode ser inspecionado no disco.

Documentação: [Sessão](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Poda da sessão](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto `legacy` integrado para montagem e
Compaction. Se você instalar um Plugin que forneça `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delegará a montagem
do contexto, `/compact` e os hooks relacionados ao ciclo de vida do contexto de subagentes a esse
mecanismo. `ownsCompaction: false` não aciona automaticamente o mecanismo
`legacy` como alternativa; o mecanismo ativo ainda precisa implementar `compact()` corretamente. Consulte
[Mecanismo de contexto](/pt-BR/concepts/context-engine) para conhecer a interface
completa conectável, os hooks de ciclo de vida e a configuração.

## O que `/context` realmente informa

`/context` dá preferência ao relatório mais recente do prompt do sistema **criado pela execução**, quando disponível:

- `System prompt (run)` = capturado da última execução incorporada (com suporte a ferramentas) e mantido no armazenamento da sessão.
- `System prompt (estimate)` = calculado dinamicamente quando não existe um relatório de execução (ou quando a execução ocorre por meio de um backend de CLI que não gera o relatório).

Em ambos os casos, ele informa tamanhos e os principais elementos contribuintes; ele **não** exibe o prompt completo do sistema nem os esquemas das ferramentas. No modo detalhado, também compara a transcrição da sessão com o mesmo predicado de mensagens de conversa real usado pela Compaction, facilitando distinguir o uso elevado de prompt/cache do histórico de conversa que pode passar por Compaction.

## Relacionados

<CardGroup cols={2}>
  <Card title="Mecanismo de contexto" href="/pt-BR/concepts/context-engine" icon="puzzle-piece">
    Injeção personalizada de contexto por meio de Plugins.
  </Card>
  <Card title="Compaction" href="/pt-BR/concepts/compaction" icon="compress">
    Resumo de conversas longas para mantê-las dentro da janela do modelo.
  </Card>
  <Card title="Prompt do sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    Como o prompt do sistema é criado e o que ele injeta a cada turno.
  </Card>
  <Card title="Loop do agente" href="/pt-BR/concepts/agent-loop" icon="arrows-rotate">
    O ciclo completo de execução do agente, desde a mensagem recebida até a resposta final.
  </Card>
</CardGroup>
