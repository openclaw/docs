---
read_when:
    - Você quer entender o que “contexto” significa no OpenClaw
    - Você está depurando por que o modelo "sabe" algo (ou se esqueceu disso)
    - Você quer reduzir a sobrecarga de contexto (/context, /status, /compact)
summary: 'Contexto: o que o modelo vê, como ele é construído e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-07-12T15:08:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"Contexto" é **tudo o que o OpenClaw envia ao modelo para uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt do sistema** (criado pelo OpenClaw): regras, ferramentas, lista de Skills, hora/ambiente de execução e arquivos injetados do espaço de trabalho.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente nesta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leituras de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que "memória": a memória pode ser armazenada em disco e recarregada posteriormente; o contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar o contexto)

- `/status` → visão rápida de "quão cheia está minha janela?" + configurações da sessão.
- `/context list` → o que foi injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento maior: tamanhos por arquivo, por esquema de ferramenta e por entrada de Skill, tamanho do prompt do sistema e contagens de mensagens da transcrição que podem passar por Compaction.
- `/context map` → imagem em formato de mapa de árvore, no estilo WinDirStat, dos elementos rastreados que contribuem para o contexto da sessão atual.
- `/usage tokens` → adiciona um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos de barra](/pt-BR/tools/slash-commands), [Uso de tokens e custos](/pt-BR/reference/token-use), [Compaction](/pt-BR/concepts/compaction).

## Exemplo de saída

Os valores variam conforme o modelo, o provedor, a política de ferramentas e o conteúdo do seu espaço de trabalho.

### `/context list`

```text
🧠 Detalhamento do contexto
Espaço de trabalho: <workspaceDir>
Máximo de inicialização/arquivo: 12,000 caracteres
Sandbox: mode=non-main sandboxed=false
Prompt do sistema (execução): 38,412 caracteres (~9,603 tok) (Contexto do projeto 23,901 caracteres (~5,976 tok))

Arquivos injetados do espaço de trabalho:
- AGENTS.md: OK | original 1,742 caracteres (~436 tok) | injetado 1,742 caracteres (~436 tok)
- SOUL.md: OK | original 912 caracteres (~228 tok) | injetado 912 caracteres (~228 tok)
- TOOLS.md: TRUNCADO | original 54,210 caracteres (~13,553 tok) | injetado 20,962 caracteres (~5,241 tok)
- IDENTITY.md: OK | original 211 caracteres (~53 tok) | injetado 211 caracteres (~53 tok)
- USER.md: OK | original 388 caracteres (~97 tok) | injetado 388 caracteres (~97 tok)
- HEARTBEAT.md: AUSENTE | original 0 | injetado 0
- BOOTSTRAP.md: OK | original 0 caracteres (~0 tok) | injetado 0 caracteres (~0 tok)

Lista de Skills (texto do prompt do sistema): 2,184 caracteres (~546 tok) (12 Skills)
Ferramentas: read, edit, write, exec, process, browser, message, sessions_send, …
Lista de ferramentas (texto do prompt do sistema): 1,032 caracteres (~258 tok)
Esquemas de ferramentas (JSON): 31,988 caracteres (~7,997 tok) (contam para o contexto; não exibidos como texto)
Ferramentas: (as mesmas acima)

Tokens da sessão (em cache): 14,250 no total / ctx=32,000
```

### `/context detail`

```text
🧠 Detalhamento do contexto (detalhado)
…
Principais Skills (tamanho da entrada no prompt):
- frontend-design: 412 caracteres (~103 tok)
- oracle: 401 caracteres (~101 tok)
… (+10 Skills adicionais)

Principais ferramentas (tamanho do esquema):
- browser: 9,812 caracteres (~2,453 tok)
- exec: 6,240 caracteres (~1,560 tok)
… (+N ferramentas adicionais)
```

### `/context map`

Envia uma imagem gerada com base no relatório de execução em cache mais recente e na transcrição da sessão. Antes que uma mensagem normal tenha produzido um relatório de execução na sessão, `/context map` retorna uma mensagem de indisponibilidade em vez de renderizar uma estimativa. A área de cada retângulo é proporcional aos caracteres rastreados do prompt:

- transcrição da conversa (mensagens do usuário, respostas do assistente, resultados de ferramentas, resumos de Compaction), além do contexto do ambiente de execução por turno e das adições ao prompt por hooks que chegam apenas ao modelo
- arquivos injetados do espaço de trabalho
- texto base do prompt do sistema
- entradas de prompt de Skills
- esquemas JSON de ferramentas

O grupo da conversa cresce junto com a sessão, portanto o mapa muda a cada turno; após a Compaction, ele se reduz a um bloco de resumos.

`/context list`, `/context detail` e `/context json` ainda podem inspecionar uma estimativa sob demanda quando não há nenhum relatório de execução em cache.

## O que conta para a janela de contexto

Tudo o que o modelo recebe conta, incluindo:

- Prompt do sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramentas + resultados de ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de Compaction e artefatos de poda.
- "Wrappers" do provedor ou cabeçalhos ocultos (não visíveis, mas ainda contabilizados).

## Como o OpenClaw cria o prompt do sistema

O prompt do sistema é **controlado pelo OpenClaw** e recriado a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (somente metadados; veja abaixo).
- Localização do espaço de trabalho.
- Hora (UTC + hora convertida do usuário, se configurada).
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

Arquivos grandes são truncados individualmente usando `agents.defaults.bootstrapMaxChars` (padrão: `20000` caracteres). O OpenClaw também impõe um limite total de injeção de bootstrap entre os arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão: `60000` caracteres). `/context` mostra os tamanhos **bruto e injetado** e se houve truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso no prompt em Contexto do Projeto. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão: `always`).

## Skills: injetadas versus carregadas sob demanda

O prompt do sistema inclui uma **lista de skills** compacta (nome + descrição + localização). Essa lista gera uma sobrecarga real.

As instruções das skills _não_ são incluídas por padrão. Espera-se que o modelo use `read` no arquivo `SKILL.md` da skill **somente quando necessário**.

## Ferramentas: há dois custos

As ferramentas afetam o contexto de duas maneiras:

1. **Texto da lista de ferramentas** no prompt do sistema (o que você vê como "Tooling").
2. **Esquemas das ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Eles contam para o contexto, embora você não os veja como texto simples.

`/context detail` detalha os maiores esquemas de ferramentas para que você possa ver o que predomina.

## Comandos, diretivas e "atalhos inline"

Os comandos de barra são processados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos independentes**: uma mensagem que contém apenas `/...` é executada como um comando.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` são removidas antes que o modelo veja a mensagem.
  - Mensagens que contêm apenas diretivas mantêm as configurações da sessão.
  - Diretivas embutidas em uma mensagem normal funcionam como instruções específicas para essa mensagem.
- **Atalhos embutidos** (somente remetentes incluídos na lista de permissões): determinados tokens `/...` em uma mensagem normal podem ser executados imediatamente (exemplo: "olá /status") e são removidos antes que o modelo veja o texto restante.

Detalhes: [Comandos de barra](/pt-BR/tools/slash-commands).

## Sessões, Compaction e remoção (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até passar por Compaction ou remoção conforme a política.
- **Compaction** mantém um resumo na transcrição e preserva intactas as mensagens recentes.
- **Remoção** descarta resultados antigos de ferramentas do prompt _em memória_ para liberar espaço na janela de contexto, mas não reescreve a transcrição da sessão — o histórico completo continua disponível para inspeção no disco.

Documentação: [Sessão](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Remoção da sessão](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto `legacy` integrado para montagem e
Compaction. Se você instalar um Plugin que forneça `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delegará a montagem
de contexto, `/compact` e os hooks relacionados ao ciclo de vida do contexto de
subagentes para esse mecanismo. `ownsCompaction: false` não aciona automaticamente
o fallback para o mecanismo legado; o mecanismo ativo ainda deve implementar
`compact()` corretamente. Consulte
[Mecanismo de contexto](/pt-BR/concepts/context-engine) para ver a interface
conectável completa, os hooks de ciclo de vida e a configuração.

## O que `/context` realmente relata

`/context` prioriza o relatório mais recente do prompt de sistema **gerado pela execução**, quando disponível:

- `System prompt (run)` = capturado da última execução incorporada (com capacidade de usar ferramentas) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = calculado dinamicamente quando não existe relatório de execução (ou durante a execução por meio de um backend de CLI que não gera o relatório).

Em ambos os casos, ele informa os tamanhos e os principais contribuintes; **não** exibe o prompt de sistema completo nem os esquemas das ferramentas. No modo detalhado, ele também compara a transcrição da sessão usando o mesmo predicado de mensagens de conversas reais usado pela Compaction, facilitando a distinção entre o uso elevado de prompt/cache e o histórico de conversas que pode ser compactado.

## Relacionados

<CardGroup cols={2}>
  <Card title="Mecanismo de contexto" href="/pt-BR/concepts/context-engine" icon="puzzle-piece">
    Injeção de contexto personalizada por meio de plugins.
  </Card>
  <Card title="Compaction" href="/pt-BR/concepts/compaction" icon="compress">
    Resumo de conversas longas para mantê-las dentro da janela do modelo.
  </Card>
  <Card title="Prompt de sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    Como o prompt de sistema é criado e o que ele injeta a cada turno.
  </Card>
  <Card title="Loop do agente" href="/pt-BR/concepts/agent-loop" icon="arrows-rotate">
    O ciclo completo de execução do agente, desde a mensagem recebida até a resposta final.
  </Card>
</CardGroup>
