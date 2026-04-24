---
read_when:
    - Editando o texto do prompt de sistema, a lista de ferramentas ou as seções de horário/Heartbeat
    - Alterando o bootstrap do workspace ou o comportamento de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt de sistema
x-i18n:
    generated_at: "2026-04-24T05:49:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

O OpenClaw constrói um prompt de sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientação de prompt sensível a cache sem substituir
o prompt completo de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções nomeadas do núcleo (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provedor para ajuste específico de famílias de modelos. Mantenha a mutação legada de prompt `before_prompt_build` para compatibilidade ou mudanças de prompt realmente globais, não para comportamento normal do provedor.

A sobreposição da família OpenAI GPT-5 mantém pequena a regra central de execução e adiciona
orientação específica do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
busca paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene de ferramentas de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Tooling**: lembrete da fonte da verdade para ferramentas estruturadas mais orientação de runtime para uso de ferramentas.
- **Execution Bias**: orientação compacta de continuidade: agir no turno atual em
  solicitações acionáveis, continuar até concluir ou ser bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Safety**: lembrete curto de proteção para evitar comportamento de busca de poder ou desvio de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de skill sob demanda.
- **OpenClaw Self-Update**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a
  configuração inteira com `config.apply` e executar `update.run` apenas mediante solicitação explícita
  do usuário. A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de execução.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentation**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Workspace Files (injected)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando ativado): indica runtime em sandbox, caminhos da sandbox e se execução elevada está disponível.
- **Current Date & Time**: horário local do usuário, fuso horário e formato de hora.
- **Reply Tags**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de ack, quando Heartbeats estão ativados para o agente padrão.
- **Runtime**: host, SO, node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Reasoning**: nível atual de visibilidade + dica de alternância via /reasoning.

A seção Tooling também inclui orientação de runtime para trabalhos longos:

- usar Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de `exec` com sleep, truques de atraso com `yieldMs` ou polling repetido de `process`
- usar `exec` / `process` apenas para comandos que começam agora e continuam em execução
  em segundo plano
- quando o despertar automático por conclusão estiver ativado, iniciar o comando uma vez e confiar no
  caminho de despertar baseado em push quando ele emitir saída ou falhar
- usar `process` para logs, status, entrada ou intervenção quando você precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão de subagente é
  baseada em push e se anuncia automaticamente de volta ao solicitante
- não fazer polling de `subagents list` / `sessions_list` em loop apenas para aguardar
  a conclusão

Quando a ferramenta experimental `update_plan` está ativada, Tooling também informa ao
modelo para usá-la apenas em trabalhos não triviais com várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de Safety no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não aplicam política. Use política de ferramentas, aprovações de execução, sandboxing e allowlists de canal para aplicação rígida; operadores podem desativá-las por design.

Em canais com cartões/botões nativos de aprovação, o prompt de runtime agora informa ao
agente para confiar primeiro nessa UI nativa de aprovação. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações via chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando conhecido), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna apenas a linha-base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Subagent
Context** em vez de **Group Chat Context**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são aparados e anexados em **Project Context** para que o modelo veja o contexto de identidade e perfil sem precisar lê-los explicitamente:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces totalmente novos)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
se aplique uma regra específica do arquivo. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desativados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos
injetados concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso de contexto inesperadamente alto e Compaction mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** fazem parte do bootstrap normal de
> Project Context. Em turnos comuns, eles são acessados sob demanda via as
> ferramentas `memory_search` e `memory_get`, portanto não contam contra a
> janela de contexto a menos que o modelo os leia explicitamente. Turnos simples de `/new` e
> `/reset` são a exceção: o runtime pode prefixar memory diária recente
> como um bloco único de contexto de inicialização para esse primeiro turno.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap
injetado entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um pequeno marcador de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Project Context; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar essa etapa via `agent:bootstrap` para alterar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece por
[SOUL.md Personality Guide](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, mais overhead de schema de ferramenta), use `/context list` ou `/context detail`. Consulte [Context](/pt-BR/concepts/context).

## Tratamento de horário

O prompt de sistema inclui uma seção dedicada **Current Date & Time** quando o
fuso horário do usuário é conhecido. Para manter estável o cache do prompt, agora ele inclui apenas
o **fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar do horário atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta também pode opcionalmente definir uma
substituição de modelo por sessão (`model=default` limpa isso).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Date & Time](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando existem Skills elegíveis, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou incluído). Se não houver Skills elegíveis, a
seção Skills é omitida.

A elegibilidade inclui regras de metadados da skill, verificações de ambiente/configuração de runtime
e a allowlist efetiva de Skills do agente quando `agents.defaults.skills` ou
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

Isso mantém pequeno o prompt-base enquanto ainda permite uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados de runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa divisão mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção de runtime, como
`memory_get`, resultados ativos de ferramenta e atualizações de `AGENTS.md` após Compaction.

## Documentation

Quando disponível, o prompt de sistema inclui uma seção **Documentation** que aponta para o
diretório local de documentação do OpenClaw (seja `docs/` no workspace do repositório ou a documentação incluída
do pacote npm) e também observa o espelho público, o repositório-fonte, a comunidade no Discord e o
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. O prompt instrui o modelo a consultar primeiro a documentação local
para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar
`openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).

## Relacionado

- [Agent runtime](/pt-BR/concepts/agent)
- [Agent workspace](/pt-BR/concepts/agent-workspace)
- [Context engine](/pt-BR/concepts/context-engine)
