---
read_when:
    - Edição do texto do prompt do sistema, da lista de ferramentas ou das seções de tempo/Heartbeat
    - Alteração do comportamento de inicialização da área de trabalho ou de injeção de Skills
summary: O que o prompt do sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-04-30T09:46:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt cientes de cache sem substituir
o prompt completo de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições pertencentes ao provedor para ajustes específicos de famílias de modelos. Mantenha a mutação de prompt legada
`before_prompt_build` para compatibilidade ou mudanças de prompt realmente globais,
não para comportamento normal de provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra central de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
consulta paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene da ferramenta de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete de fonte da verdade de ferramenta estruturada, além de orientação de runtime para uso de ferramentas.
- **Viés de execução**: orientação compacta de acompanhamento: agir no turno em
  solicitações acionáveis, continuar até concluir ou ser bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Segurança**: breve lembrete de proteção para evitar comportamento de busca de poder ou desvio de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de skill sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração completa
  com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário.
  A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que normalizam para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do workspace (injetados)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos de sandbox e se exec elevado está disponível.
- **Data e hora atuais**: hora local do usuário, fuso horário e formato de hora.
- **Tags de resposta**: sintaxe opcional de tag de resposta para provedores compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão habilitados para o agente padrão.
- **Runtime**: host, SO, Node, modelo, raiz do repositório (quando detectada), nível de pensamento (uma linha).
- **Raciocínio**: nível atual de visibilidade + dica do alternador /reasoning.

O OpenClaw mantém conteúdo grande e estável, incluindo **Contexto do projeto**, acima do
limite interno do cache de prompt. Seções voláteis de canal/sessão, como
orientações de incorporação da Control UI, **Mensagens**, **Voz**, **Contexto de chat em grupo**,
**Reações**, **Heartbeats** e **Runtime**, são anexadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável do workspace
entre turnos de canal. As descrições de ferramentas também devem evitar incorporar nomes de canais atuais
quando o esquema aceito já contém esse detalhe de runtime.

A seção Ferramentas também inclui orientação de runtime para trabalhos de longa duração:

- use Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de espera com `exec`, truques de atraso com `yieldMs` ou sondagem repetida de `process`
- use `exec` / `process` somente para comandos que começam agora e continuam em execução
  em segundo plano
- quando o despertar automático por conclusão estiver habilitado, inicie o comando uma vez e conte com
  o caminho de despertar baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é
  baseada em push e anuncia automaticamente de volta ao solicitante
- não faça sondagem de `subagents list` / `sessions_list` em loop apenas para aguardar
  a conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Ferramentas também informa ao
modelo para usá-la somente em trabalhos não triviais de várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e allowlists de canais para aplicação rígida; operadores podem desativá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora informa ao
agente para usar primeiro essa UI de aprovação nativa. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações por chat estão indisponíveis ou que
a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de memória**, **Autoatualização do OpenClaw**,
  **Aliases de modelo**, **Identidade do usuário**, **Tags de resposta**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e hora atuais (quando conhecidas), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna somente a linha de identidade base.

Quando `promptMode=minimal`, prompts injetados extras são rotulados como **Contexto do subagente**
em vez de **Contexto de chat em grupo**.

Para execuções de resposta automática em canais, o OpenClaw pode omitir a seção genérica **Respostas silenciosas**
quando o contexto de chat direto/em grupo já inclui o comportamento `NO_REPLY`
específico da conversa resolvido. Isso evita repetir mecanismos de token
tanto no prompt global de sistema quanto no contexto do canal.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são aparados e anexados em **Contexto do projeto** para que o modelo veja contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em workspaces totalmente novos)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
uma regra específica de arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desabilitados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é falso. Mantenha os arquivos injetados
concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso de contexto inesperadamente alto e Compaction mais frequente.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do projeto de bootstrap normal. Em turnos comuns, eles são acessados sob demanda pelas ferramentas `memory_search` e `memory_get`, portanto não contam contra a janela de contexto a menos que o modelo os leia explicitamente. Turnos simples de `/new` e `/reset` são a exceção: o runtime pode prefixar memória diária recente como um bloco de contexto de inicialização único para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap injetado
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um breve marcador de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso no Contexto do projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam somente `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do subagente pequeno).

Hooks internos podem interceptar essa etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de personalidade do SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além da sobrecarga do esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt de sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache de prompt estável, ela agora inclui apenas
o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta pode opcionalmente definir uma substituição de modelo
por sessão (`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e hora](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando há Skills elegíveis, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou incluído). Se nenhuma skill for elegível, a seção
Skills é omitida.

A elegibilidade inclui regras de metadados de skill, verificações de ambiente/configuração de runtime
e a allowlist efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills incluídas por Plugin são elegíveis somente quando o Plugin proprietário está habilitado.
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

Isso mantém o prompt base pequeno, enquanto ainda permite uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados de runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa divisão mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção de runtime, como
`memory_get`, resultados de ferramentas ao vivo e atualizações de AGENTS.md após Compaction.

## Documentação

O prompt de sistema inclui uma seção **Documentação**. Quando a documentação local está disponível, ela
aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout Git ou a documentação incluída no pacote npm).
Se a documentação local estiver indisponível, recorre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui o local do código-fonte do OpenClaw. Checkouts Git expõem a raiz local
do código-fonte para que o agente possa inspecionar o código diretamente. Instalações por pacote incluem a URL
do código-fonte no GitHub e instruem o agente a revisar o código-fonte lá sempre que a documentação estiver incompleta ou
desatualizada. O prompt também menciona o espelho público da documentação, o Discord da comunidade e o ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele orienta o modelo a
consultar a documentação primeiro para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a
executar `openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
Especificamente para configuração, ele direciona os agentes para a ação da ferramenta `gateway`
`config.schema.lookup` para documentação e restrições exatas em nível de campo, depois para
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
para orientações mais amplas.

## Relacionado

- [Runtime do agente](/pt-BR/concepts/agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
