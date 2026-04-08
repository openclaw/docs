---
read_when:
    - Ao editar o texto do prompt do sistema, a lista de ferramentas ou as seções de hora/heartbeat
    - Ao alterar o bootstrap do workspace ou o comportamento de injeção de Skills
summary: O que o prompt do sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-04-08T02:14:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e55fc886bc8ec47584d07c9e60dfacd964dc69c7db976ea373877dc4fe09a79a
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt do sistema

O OpenClaw cria um prompt do sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt com reconhecimento de cache sem substituir
todo o prompt de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provedor para ajustes específicos por família de modelos. Mantenha a mutação legada de prompt
`before_prompt_build` para compatibilidade ou mudanças de prompt verdadeiramente globais,
não para o comportamento normal do provedor.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete estruturado da fonte de verdade das ferramentas, além de orientações de uso de ferramentas em tempo de execução.
- **Segurança**: lembrete curto de proteção para evitar comportamento de busca por poder ou desvio de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de skill sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração inteira
  com `config.apply` e executar `update.run` apenas sob solicitação explícita do usuário. A ferramenta
  `gateway`, disponível apenas para o proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do workspace (injetados)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos da sandbox e se exec elevado está disponível.
- **Data e hora atuais**: hora local do usuário, fuso horário e formato de hora.
- **Tags de resposta**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de heartbeat e comportamento de ack, quando heartbeats estão habilitados para o agente padrão.
- **Runtime**: host, SO, node, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível atual de visibilidade + dica para alternância com /reasoning.

A seção Ferramentas também inclui orientações de runtime para trabalhos de longa duração:

- use cron para acompanhamentos futuros (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de sleep com `exec`, truques de atraso com `yieldMs` ou sondagem repetida de `process`
- use `exec` / `process` apenas para comandos que começam agora e continuam em execução
  em segundo plano
- quando o wake automático na conclusão estiver habilitado, inicie o comando uma vez e conte com
  o caminho de wake baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é
  baseada em push e é anunciada automaticamente de volta ao solicitante
- não faça polling de `subagents list` / `sessions_list` em loop apenas para esperar
  a conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Ferramentas também informa ao
modelo para usá-la apenas em trabalhos não triviais de várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt do sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e listas de permissão de canais para imposição rígida; operadores podem desativá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora informa ao
agente que ele deve depender primeiro dessa interface nativa de aprovação. Ele só deve incluir um
comando manual `/approve` quando o resultado da ferramenta disser que aprovações no chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts do sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de memória**, **Autoatualização do OpenClaw**, **Aliases de modelo**, **Identidade do usuário**, **Tags de resposta**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e hora atuais (quando conhecidas), Runtime e contexto
  injetado continuam disponíveis.
- `none`: retorna apenas a linha base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto do subagente**
em vez de **Contexto do chat em grupo**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são recortados e anexados em **Contexto do projeto** para que o modelo veja o contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces totalmente novos)
- `MEMORY.md` quando presente; caso contrário, `memory.md` como fallback em minúsculas

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
uma regra específica do arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
heartbeats estão desabilitados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos
injetados concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso de contexto inesperadamente alto e compactação mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** são injetados automaticamente. Eles
> são acessados sob demanda por meio das ferramentas `memory_search` e `memory_get`, portanto
> não contam contra a janela de contexto, a menos que o modelo os leia explicitamente.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 20000). O conteúdo total de bootstrap injetado
entre os arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 150000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Contexto do projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (os outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para mutar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser tornar o agente menos genérico, comece com o
[Guia de personalidade do SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além do overhead de schema de ferramenta), use `/context list` ou `/context detail`. Veja [Contexto](/pt-BR/concepts/context).

## Tratamento de hora

O prompt do sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter a estabilidade do cache do prompt, ele agora inclui apenas
o **fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta pode opcionalmente definir uma substituição
de modelo por sessão (`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e hora](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando há Skills elegíveis, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou empacotado). Se nenhuma skill for elegível, a seção
Skills é omitida.

A elegibilidade inclui regras de metadados da skill, verificações de ambiente/configuração de runtime
e a lista de permissão efetiva de skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Isso mantém o prompt base pequeno, ao mesmo tempo em que ainda permite uso direcionado de skills.

## Documentação

Quando disponível, o prompt do sistema inclui uma seção **Documentação** que aponta para o
diretório local da documentação do OpenClaw (seja `docs/` no workspace do repositório ou a
documentação empacotada do pacote npm) e também menciona o espelho público, o repositório de origem, o Discord da comunidade e o
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de skills. O prompt instrui o modelo a consultar primeiro a documentação local
para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar
`openclaw status` por conta própria quando possível (pedindo ao usuário apenas quando não tiver acesso).
