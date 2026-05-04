---
read_when:
    - Editando o texto do prompt do sistema, a lista de ferramentas ou as seções de tempo/Heartbeat
    - Alterando o comportamento de inicialização do espaço de trabalho ou de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-05-04T02:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **propriedade da OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pela OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt conscientes de cache sem substituir
o prompt completo de propriedade da OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções principais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provedor para ajustes específicos de famílias de modelos. Mantenha a mutação de prompt legada
`before_prompt_build` para compatibilidade ou alterações de prompt realmente globais,
não para o comportamento normal do provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra principal de execução pequena e adiciona
orientações específicas de modelo para fixação de persona, saída concisa, disciplina de ferramentas,
consulta paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene de ferramentas de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete da fonte da verdade de ferramentas estruturadas, além de orientação de uso de ferramentas em runtime.
- **Viés de Execução**: orientação compacta de acompanhamento: agir durante o turno em
  solicitações acionáveis, continuar até concluir ou ser bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Segurança**: lembrete curto de proteção para evitar comportamento de busca de poder ou contornar supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Autoatualização da OpenClaw**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração completa
  com `config.apply` e executar `update.run` apenas mediante solicitação explícita do usuário. A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação da OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do Workspace (injetados)**: indica que os arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos de sandbox e se exec elevado está disponível.
- **Data e Hora Atuais**: hora local do usuário, fuso horário e formato de hora.
- **Tags de Resposta**: sintaxe opcional de tag de resposta para provedores compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão habilitados para o agente padrão.
- **Runtime**: host, SO, node, modelo, raiz do repositório (quando detectada), nível de pensamento (uma linha).
- **Raciocínio**: nível de visibilidade atual + dica de alternância /reasoning.

A OpenClaw mantém conteúdo grande e estável, incluindo **Contexto do Projeto**, acima do
limite interno de cache do prompt. Seções voláteis de canal/sessão, como
orientação de incorporação da Control UI, **Mensagens**, **Voz**, **Contexto de Chat em Grupo**,
**Reações**, **Heartbeats** e **Runtime**, são anexadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável do workspace
entre turnos de canal. Descrições de ferramentas também devem evitar incorporar nomes de canais atuais
quando o esquema aceito já carrega esse detalhe de runtime.

A seção Ferramentas também inclui orientação de runtime para trabalhos de longa duração:

- use cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de sleep com `exec`, truques de atraso com `yieldMs` ou polling repetido de `process`
- use `exec` / `process` apenas para comandos que começam agora e continuam em execução
  em segundo plano
- quando a ativação automática por conclusão estiver habilitada, inicie o comando uma vez e conte com
  o caminho de ativação baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é
  baseada em push e anunciada automaticamente de volta ao solicitante
- não faça polling de `subagents list` / `sessions_list` em loop apenas para esperar
  a conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Ferramentas também instrui o
modelo a usá-la apenas para trabalho não trivial de várias etapas, manter exatamente uma etapa
`in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não aplicam políticas. Use política de ferramentas, aprovações de exec, sandboxing e allowlists de canais para aplicação rígida; operadores podem desabilitá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora diz ao
agente para contar primeiro com essa interface de aprovação nativa. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

A OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de Memória**, **Autoatualização da OpenClaw
  **, **Aliases de Modelo**, **Identidade do Usuário**, **Tags de Resposta**,
  **Mensagens**, **Respostas Silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e Hora Atuais (quando conhecidas), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna apenas a linha de identidade base.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto do Subagente
** em vez de **Contexto de Chat em Grupo**.

Para execuções de resposta automática de canal, a OpenClaw pode omitir a seção genérica **Respostas Silenciosas**
quando o contexto de chat direto/grupo já inclui o comportamento `NO_REPLY`
específico da conversa resolvido. Isso evita repetir a mecânica de tokens
tanto no prompt de sistema global quanto no contexto do canal.

## Snapshots de prompt

A OpenClaw mantém snapshots de prompt comitados para o caminho feliz do runtime Codex em
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Eles renderizam
parâmetros selecionados de thread/turn do app-server, além de uma pilha reconstruída de camadas de prompt
vinculada ao modelo para turnos diretos do Telegram, grupo do Discord e Heartbeat. Essa pilha
inclui uma fixture fixada de prompt de modelo Codex `gpt-5.5` gerada a partir do formato
do catálogo/cache de modelos do Codex, o texto de desenvolvedor de permissões do caminho feliz do Codex,
instruções de desenvolvedor da OpenClaw, instruções de modo de colaboração com escopo de turno
quando a OpenClaw as fornece, entrada do turno do usuário e referências às especificações dinâmicas
de ferramentas.

Atualize a fixture fixada de prompt de modelo Codex com
`pnpm prompt:snapshots:sync-codex-model`. Por padrão, o script procura o
cache de runtime do Codex em `$CODEX_HOME/models_cache.json`, depois em
`~/.codex/models_cache.json` e só então recorre à convenção de checkout do Codex
do mantenedor em `~/code/codex/codex-rs/models-manager/models.json`. Se
nenhuma dessas fontes existir, o comando encerra sem alterar a fixture
comitada. Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json`
ou `models.json` específico.

Esses snapshots ainda não são uma captura bruta byte a byte de uma solicitação OpenAI. O Codex
pode adicionar contexto de workspace de propriedade do runtime, como `AGENTS.md`, contexto de
ambiente, memórias, instruções de app/plugin e instruções internas do modo de colaboração Default
dentro do runtime do Codex depois que a OpenClaw envia
parâmetros de thread e turno.

Regere-os com `pnpm prompt:snapshots:gen` e verifique desvios com
`pnpm prompt:snapshots:check`. A CI executa a verificação de desvio no shard
de limite adicional para que alterações de prompt e atualizações de snapshot permaneçam anexadas ao mesmo
PR.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são truncados e anexados em **Contexto do Projeto** para que o modelo veja contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces recém-criados)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
uma regra específica de arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desabilitados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados
concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso inesperadamente alto de contexto e Compaction mais frequente.

Quando uma sessão é executada no harness nativo do Codex, o Codex carrega `AGENTS.md`
por meio de sua própria descoberta de documentação de projeto. A OpenClaw ainda resolve os demais
arquivos de bootstrap e os encaminha como instruções de configuração do Codex, então `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantêm o mesmo papel de contexto do workspace sem duplicar
`AGENTS.md`.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do Projeto de bootstrap normal. Em turnos comuns, eles são acessados sob demanda pelas ferramentas `memory_search` e `memory_get`, portanto não contam contra a janela de contexto a menos que o modelo os leia explicitamente. Turnos simples `/new` e `/reset` são a exceção: o runtime pode prefixar memória diária recente como um bloco único de contexto de inicialização para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap injetado
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
a OpenClaw pode injetar um aviso conciso no prompt de sistema; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`). Contagens brutas/injetadas detalhadas permanecem em diagnósticos como
`/context`, `/status`, doctor e logs.

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do subagente pequeno).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de Personalidade SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além da sobrecarga de esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt de sistema inclui uma seção dedicada **Data e Hora Atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui apenas
o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta pode opcionalmente definir uma substituição de modelo por sessão
(`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e Hora](/pt-BR/date-time) para detalhes completos de comportamento.

## Skills

Quando existem Skills elegíveis, a OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou empacotado). Se nenhuma Skill for elegível, a
seção Skills é omitida.

A elegibilidade inclui regras de metadados de Skill, verificações de ambiente/configuração de runtime
e a allowlist efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills empacotadas em plugins são elegíveis apenas quando seu plugin proprietário está habilitado.
Isso permite que plugins de ferramentas exponham guias operacionais mais aprofundados sem incorporar toda
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

Isso mantém o prompt base pequeno enquanto ainda habilita uso direcionado de Skills.

O orçamento da lista de Skills é de propriedade do subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos delimitados em tempo de execução usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa divisão mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção em tempo de execução, como `memory_get`, resultados de ferramentas ao vivo e atualizações pós-Compaction de AGENTS.md.

## Documentação

O prompt do sistema inclui uma seção de **Documentação**. Quando a documentação local está disponível, ela aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout Git ou a documentação do pacote npm incluído). Se a documentação local não estiver disponível, ela recorre a [https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui a localização do código-fonte do OpenClaw. Checkouts Git expõem a raiz local do código-fonte para que o agente possa inspecionar o código diretamente. Instalações de pacote incluem a URL do código-fonte no GitHub e instruem o agente a revisar o código-fonte ali sempre que a documentação estiver incompleta ou desatualizada. O prompt também menciona o espelho público da documentação, o Discord da comunidade e o ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele instrui o modelo a consultar a documentação primeiro para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar `openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso). Especificamente para configuração, ele direciona agentes para a ação de ferramenta `gateway` `config.schema.lookup` para documentação e restrições exatas no nível dos campos, depois para `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` para orientação mais ampla.

## Relacionados

- [Tempo de execução do agente](/pt-BR/concepts/agent)
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
