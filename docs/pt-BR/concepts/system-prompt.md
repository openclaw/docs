---
read_when:
    - Editando o texto do prompt de sistema, a lista de ferramentas ou as seções de hora/Heartbeat
    - Alterando o comportamento de bootstrap do workspace ou de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt de sistema
x-i18n:
    generated_at: "2026-04-25T13:45:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

O OpenClaw monta um prompt de sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provider podem contribuir com orientações de prompt com reconhecimento de cache sem substituir
o prompt completo de propriedade do OpenClaw. O runtime do provider pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provider para ajuste específico de família de modelo. Mantenha a mutação
legada de prompt `before_prompt_build` para compatibilidade ou mudanças de prompt realmente globais, não para comportamento normal de provider.

A sobreposição da família OpenAI GPT-5 mantém a regra principal de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
consulta paralela, cobertura de entregáveis, verificação, contexto ausente e higiene de ferramentas de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Tooling**: lembrete da fonte da verdade de ferramentas estruturadas, além de orientação de uso de ferramentas em runtime.
- **Execution Bias**: orientação compacta de continuidade: agir na mesma interação em
  solicitações acionáveis, continuar até concluir ou ser bloqueado, recuperar-se de resultados
  fracos de ferramentas, verificar estado mutável ao vivo e verificar antes de finalizar.
- **Safety**: lembrete curto de guardrails para evitar comportamento de busca de poder ou desvio de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **OpenClaw Self-Update**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a
  configuração completa com `config.apply` e executar `update.run` apenas mediante solicitação
  explícita do usuário. A ferramenta `gateway`, restrita ao proprietário, também se recusa a regravar
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos de exec protegidos.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentation**: caminho local para a documentação do OpenClaw (repo ou pacote npm) e quando lê-la.
- **Workspace Files (injected)**: indica que os arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando ativado): indica runtime em sandbox, caminhos do sandbox e se exec elevado está disponível.
- **Current Date & Time**: hora local do usuário, fuso horário e formato de hora.
- **Reply Tags**: sintaxe opcional de tags de resposta para providers compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de ack, quando Heartbeats estão ativados para o agente padrão.
- **Runtime**: host, SO, node, modelo, raiz do repo (quando detectada), nível de raciocínio (uma linha).
- **Reasoning**: nível atual de visibilidade + dica de alternância `/reasoning`.

A seção Tooling também inclui orientação de runtime para trabalho de longa duração:

- usar Cron para acompanhamentos futuros (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de sleep com `exec`, truques de atraso com `yieldMs` ou polling repetido de `process`
- usar `exec` / `process` apenas para comandos que começam agora e continuam em execução
  em segundo plano
- quando o despertar automático por conclusão estiver ativado, iniciar o comando uma vez e contar com
  o caminho de despertar baseado em push quando ele emitir saída ou falhar
- usar `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, preferir `sessions_spawn`; a conclusão do subagente é
  baseada em push e se anuncia automaticamente ao solicitante
- não fazer polling de `subagents list` / `sessions_list` em loop apenas para esperar
  a conclusão

Quando a ferramenta experimental `update_plan` está ativada, Tooling também informa ao
modelo para usá-la apenas em trabalhos não triviais de várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

Os guardrails de Safety no prompt de sistema são consultivos. Eles orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e allowlists de canal para imposição rígida; operadores podem desativá-los por design.

Em canais com cartões/botões nativos de aprovação, o prompt de runtime agora informa ao
agente que deve depender primeiro dessa interface nativa de aprovação. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações no chat não estão disponíveis ou
quando a aprovação manual for o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando conhecido), Runtime e contexto
  injetado continuam disponíveis.
- `none`: retorna apenas a linha base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Subagent
Context** em vez de **Group Chat Context**.

## Injeção de bootstrap do workspace

Os arquivos de bootstrap são aparados e anexados em **Project Context** para que o modelo veja contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces totalmente novos)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em toda interação, a menos que
se aplique um portão específico do arquivo. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desativados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos
injetados concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso de contexto inesperadamente alto e Compaction mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** fazem parte do bootstrap normal
> de Project Context. Em interações comuns, eles são acessados sob demanda via as
> ferramentas `memory_search` e `memory_get`, então não contam contra a janela de
> contexto a menos que o modelo os leia explicitamente. Interações simples de `/new` e
> `/reset` são a exceção: o runtime pode prefixar memória diária recente
> como um bloco único de contexto de inicialização para essa primeira interação.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total injetado de bootstrap
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Project Context; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (os outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar essa etapa via `agent:bootstrap` para alterar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com o
[Guia de personalidade do SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs injetado, truncamento, além da sobrecarga de schema de ferramenta), use `/context list` ou `/context detail`. Consulte [Context](/pt-BR/concepts/context).

## Tratamento de hora

O prompt de sistema inclui uma seção dedicada **Current Date & Time** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui apenas
o **fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta também pode opcionalmente definir uma substituição
de modelo por sessão (`model=default` a remove).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Date & Time](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando existem Skills elegíveis, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou incluído). Se não houver Skills elegíveis, a
seção Skills é omitida.

A elegibilidade inclui portões de metadados da Skill, verificações de ambiente/configuração em runtime
e a allowlist efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills incluídas por Plugin são elegíveis apenas quando o Plugin proprietário está ativado.
Isso permite que Plugins de ferramentas exponham guias operacionais mais profundos sem incorporar toda
essa orientação diretamente em cada descrição de ferramenta.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Isso mantém o prompt base pequeno e ainda permite uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados em runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa divisão mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção em runtime, como
`memory_get`, resultados de ferramentas ao vivo e atualização de `AGENTS.md` após Compaction.

## Documentation

O prompt de sistema inclui uma seção **Documentation**. Quando a documentação local está disponível,
ela aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout Git ou a documentação incluída no
pacote npm). Se a documentação local não estiver disponível, faz fallback para
[https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui o local do código-fonte do OpenClaw. Checkouts Git expõem a raiz local do
código-fonte para que o agente possa inspecionar o código diretamente. Instalações por pacote incluem a URL do
código-fonte no GitHub e informam ao agente que revise o código ali sempre que a documentação estiver incompleta ou
desatualizada. O prompt também menciona o espelho público da documentação, o Discord da comunidade e o ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele instrui o modelo a
consultar a documentação primeiro para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a
executar `openclaw status` por conta própria quando possível (pedindo ao usuário apenas quando não tiver acesso).

## Relacionado

- [Runtime de agente](/pt-BR/concepts/agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
