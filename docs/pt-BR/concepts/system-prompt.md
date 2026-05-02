---
read_when:
    - Edição do texto do prompt do sistema, da lista de ferramentas ou das seções de hora/Heartbeat
    - Alterando a inicialização do espaço de trabalho ou o comportamento de injeção de Skills
summary: O que o prompt do sistema OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-05-02T20:46:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt com reconhecimento de cache sem substituir
o prompt completo de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções principais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições pertencentes ao provedor para ajustes específicos de família de modelos. Mantenha a mutação de prompt legada
`before_prompt_build` para compatibilidade ou mudanças de prompt verdadeiramente globais,
não para o comportamento normal do provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra central de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
busca paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene da ferramenta de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete de fonte da verdade de ferramentas estruturadas mais orientação de uso de ferramentas em runtime.
- **Viés de Execução**: orientação compacta de acompanhamento: agir no turno em
  solicitações acionáveis, continuar até concluir ou ser bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Segurança**: lembrete curto de proteção para evitar comportamento de busca de poder ou contornar supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de skills sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar configuração com segurança com
  `config.schema.lookup`, corrigir configuração com `config.patch`, substituir a configuração completa
  com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário.
  A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos de exec protegidos.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do Workspace (injetados)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando ativado): indica runtime em sandbox, caminhos de sandbox e se exec elevado está disponível.
- **Data e Hora Atuais**: horário local do usuário, fuso horário e formato de hora.
- **Tags de Resposta**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de heartbeat e comportamento de confirmação, quando heartbeats estão ativados para o agente padrão.
- **Runtime**: host, SO, node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível de visibilidade atual + dica de alternância /reasoning.

O OpenClaw mantém conteúdo estável grande, incluindo **Contexto do Projeto**, acima do
limite interno do cache de prompt. Seções voláteis de canal/sessão, como
orientação incorporada da Control UI, **Mensagens**, **Voz**, **Contexto de Chat em Grupo**,
**Reações**, **Heartbeats** e **Runtime**, são anexadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável do workspace
entre turnos de canal. As descrições de ferramentas também devem evitar incorporar nomes de
canais atuais quando o esquema aceito já carrega esse detalhe de runtime.

A seção Ferramentas também inclui orientação de runtime para trabalho de longa duração:

- usar cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de suspensão em `exec`, truques de atraso com `yieldMs` ou polling repetido de `process`
- usar `exec` / `process` somente para comandos que começam agora e continuam executando
  em segundo plano
- quando a ativação automática por conclusão estiver habilitada, iniciar o comando uma vez e confiar no
  caminho de ativação baseado em push quando ele emitir saída ou falhar
- usar `process` para logs, status, entrada ou intervenção quando você precisar
  inspecionar um comando em execução
- se a tarefa for maior, preferir `sessions_spawn`; a conclusão do subagente é
  baseada em push e anuncia automaticamente de volta ao solicitante
- não fazer polling de `subagents list` / `sessions_list` em loop apenas para esperar
  a conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Ferramentas também orienta o
modelo a usá-la somente para trabalho não trivial em várias etapas, manter exatamente uma etapa
`in_progress` e evitar repetir todo o plano após cada atualização.

As proteções de segurança no prompt do sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e listas de canais permitidos para aplicação rígida; operadores podem desativá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora orienta o
agente a confiar primeiro nessa UI de aprovação nativa. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações por chat estão indisponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de Memória**, **Autoatualização do OpenClaw**,
  **Aliases de Modelo**, **Identidade do Usuário**, **Tags de Resposta**,
  **Mensagens**, **Respostas Silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e Hora Atuais (quando conhecidas), Runtime e contexto injetado
  continuam disponíveis.
- `none`: retorna somente a linha de identidade base.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto do Subagente**
em vez de **Contexto de Chat em Grupo**.

Para execuções de resposta automática de canal, o OpenClaw pode omitir a seção genérica **Respostas Silenciosas**
quando o contexto de chat direto/grupo já inclui o comportamento `NO_REPLY`
específico da conversa resolvida. Isso evita repetir a mecânica de tokens
tanto no prompt global do sistema quanto no contexto do canal.

## Snapshots de prompt

O OpenClaw mantém snapshots de prompt de caminho feliz confirmados para o runtime
Codex/ferramenta de mensagens em `test/fixtures/agents/prompt-snapshots/happy-path/`. Eles renderizam
as instruções de desenvolvedor do app-server Codex de propriedade do OpenClaw, parâmetros selecionados de
início/retomada de thread, entrada do usuário do turno e especificações dinâmicas de ferramentas para turnos diretos do Telegram,
grupo do Discord e heartbeat. O prompt de sistema base oculto do Codex e
as instruções de modo de colaboração do Codex com escopo de turno pertencem ao runtime do Codex
e não são renderizados pelo OpenClaw.

Regere-os com `pnpm prompt:snapshots:gen` e verifique drift com
`pnpm prompt:snapshots:check`.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são aparados e anexados em **Contexto do Projeto** para que o modelo veja identidade e contexto de perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em workspaces totalmente novos)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
uma porta específica de arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
heartbeats estão desativados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados
concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso de contexto inesperadamente alto e compaction mais frequente.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do Projeto de bootstrap normal. Em turnos comuns, eles são acessados sob demanda por meio das ferramentas `memory_search` e `memory_get`, portanto não contam contra a janela de contexto, a menos que o modelo os leia explicitamente. Turnos simples de `/new` e `/reset` são a exceção: o runtime pode antepor memória diária recente como um bloco único de contexto de inicialização para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap injetado
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Contexto do Projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam somente `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do subagente pequeno).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de Personalidade SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, mais sobrecarga de esquema de ferramenta), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt do sistema inclui uma seção dedicada **Data e Hora Atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache de prompt estável, agora ele inclui apenas
o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta pode opcionalmente definir uma substituição de modelo por sessão
(`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e Hora](/pt-BR/date-time) para detalhes completos de comportamento.

## Skills

Quando existem skills qualificadas, o OpenClaw injeta uma **lista compacta de skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou empacotado). Se nenhuma skill estiver qualificada, a seção
Skills é omitida.

A qualificação inclui portas de metadados de skill, verificações de ambiente/configuração de runtime
e a lista efetiva de skills permitidas do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills empacotadas por Plugin são qualificadas somente quando o Plugin proprietário está habilitado.
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

Isso mantém o prompt base pequeno enquanto ainda habilita o uso direcionado de skills.

O orçamento da lista de skills pertence ao subsistema de skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados de runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa separação mantém o dimensionamento de skills separado do dimensionamento de leitura/injeção de runtime, como
`memory_get`, resultados de ferramentas ao vivo e atualizações de AGENTS.md pós-compaction.

## Documentação

O prompt do sistema inclui uma seção **Documentação**. Quando a documentação local está disponível, ele
aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout Git ou a documentação do pacote npm
empacotado). Se a documentação local estiver indisponível, ele recorre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui o local do código-fonte do OpenClaw. Checkouts Git expõem a raiz local do
código-fonte para que o agente possa inspecionar o código diretamente. Instalações por pacote incluem a URL do
código-fonte no GitHub e orientam o agente a revisar o código-fonte lá sempre que a documentação estiver incompleta ou
desatualizada. O prompt também observa o espelho público da documentação, o Discord da comunidade e o ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descoberta de skills. Ele orienta o modelo a
consultar a documentação primeiro para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a
executar `openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
Para configuração especificamente, ele direciona agentes para a ação da ferramenta `gateway`
`config.schema.lookup` para documentação e restrições exatas em nível de campo, depois para
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
para orientações mais amplas.

## Relacionado

- [Ambiente de execução do agente](/pt-BR/concepts/agent)
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
