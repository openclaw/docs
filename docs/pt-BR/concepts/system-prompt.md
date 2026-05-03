---
read_when:
    - Edição do texto do prompt do sistema, lista de ferramentas ou seções de tempo/Heartbeat
    - Alterando o bootstrap do espaço de trabalho ou o comportamento de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-05-03T05:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **pertencente ao OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt cientes de cache sem substituir
o prompt completo pertencente ao OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições pertencentes ao provedor para ajustes específicos de famílias de modelos. Mantenha a mutação de prompt legada
`before_prompt_build` para compatibilidade ou mudanças de prompt verdadeiramente globais,
não para comportamento normal de provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra de execução central pequena e adiciona
orientações específicas de modelo para fixação de persona, saída concisa, disciplina de ferramentas,
consulta paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene da ferramenta de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramental**: lembrete de fonte da verdade da ferramenta estruturada mais orientação de uso de ferramentas em runtime.
- **Viés de Execução**: orientação compacta de acompanhamento: atuar no turno em
  solicitações acionáveis, continuar até concluir ou ficar bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Segurança**: breve lembrete de proteção para evitar comportamento de busca de poder ou contorno de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança com
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração completa
  com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário.
  A ferramenta `gateway`, restrita ao proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que normalizam para esses caminhos exec protegidos.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do Workspace (injetados)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos de sandbox e se exec elevado está disponível.
- **Data e Hora Atuais**: horário local do usuário, fuso horário e formato de hora.
- **Tags de Resposta**: sintaxe opcional de tag de resposta para provedores compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão habilitados para o agente padrão.
- **Runtime**: host, SO, Node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível de visibilidade atual + dica de alternância /reasoning.

O OpenClaw mantém conteúdo estável grande, incluindo **Contexto do Projeto**, acima do
limite interno do cache de prompt. Seções voláteis de canal/sessão, como
orientação incorporada da Control UI, **Mensagens**, **Voz**, **Contexto de Chat em Grupo**,
**Reações**, **Heartbeats** e **Runtime**, são anexadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável do workspace
entre turnos de canal. As descrições de ferramentas também devem evitar incorporar nomes de
canais atuais quando o schema aceito já carrega esse detalhe de runtime.

A seção Ferramental também inclui orientação de runtime para trabalho de longa duração:

- use Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de espera com `exec`, truques de atraso `yieldMs` ou sondagem repetida de `process`
- use `exec` / `process` somente para comandos que começam agora e continuam em execução
  em segundo plano
- quando o despertar por conclusão automática estiver habilitado, inicie o comando uma vez e conte com
  o caminho de despertar baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando você precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão de subagente é
  baseada em push e se anuncia automaticamente de volta ao solicitante
- não faça sondagem de `subagents list` / `sessions_list` em loop apenas para aguardar
  a conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Ferramental também diz ao
modelo para usá-la somente em trabalhos não triviais de várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt do sistema são consultivas. Elas orientam o comportamento do modelo, mas não aplicam política. Use política de ferramentas, aprovações de exec, sandboxing e listas de permissão de canais para aplicação rígida; operadores podem desabilitá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora diz ao
agente para contar primeiro com essa UI de aprovação nativa. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações por chat estão indisponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de Memória**, **Autoatualização do OpenClaw**,
  **Aliases de Modelo**, **Identidade do Usuário**, **Tags de Resposta**,
  **Mensagens**, **Respostas Silenciosas** e **Heartbeats**. Ferramental, **Segurança**,
  Workspace, Sandbox, Data e Hora Atuais (quando conhecidas), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna apenas a linha de identidade base.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto de Subagente**
em vez de **Contexto de Chat em Grupo**.

Para execuções de resposta automática de canal, o OpenClaw pode omitir a seção genérica **Respostas Silenciosas**
quando o contexto de chat direto/grupo já inclui o comportamento `NO_REPLY`
específico da conversa resolvida. Isso evita repetir a mecânica de tokens
tanto no prompt de sistema global quanto no contexto do canal.

## Snapshots de prompt

O OpenClaw mantém snapshots de prompt versionados para o caminho feliz do runtime Codex em
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Eles renderizam
parâmetros selecionados de thread/turno do app-server mais uma pilha reconstruída de camadas de prompt vinculadas ao modelo
para turnos diretos do Telegram, de grupo do Discord e de Heartbeat. Essa pilha
inclui uma fixture fixada de prompt de modelo Codex `gpt-5.5` gerada a partir do formato
do catálogo/cache de modelos do Codex, o texto de desenvolvedor de permissão do caminho feliz do Codex,
instruções de desenvolvedor do OpenClaw, entrada do turno do usuário e referências às especificações dinâmicas
de ferramentas.

Atualize a fixture fixada do prompt de modelo Codex com
`pnpm prompt:snapshots:sync-codex-model`. Por padrão, o script procura o cache de runtime
do Codex em `$CODEX_HOME/models_cache.json`, depois em
`~/.codex/models_cache.json` e só então recorre à convenção de checkout Codex
do mantenedor em `~/code/codex/codex-rs/models-manager/models.json`. Se
nenhuma dessas fontes existir, o comando sai sem alterar a fixture versionada.
Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json`
ou `models.json` específico.

Esses snapshots ainda não são uma captura bruta byte a byte da requisição OpenAI. O Codex
pode adicionar contexto de workspace pertencente ao runtime, como `AGENTS.md`, contexto de ambiente,
memórias, instruções de app/plugin e instruções futuras de modo de colaboração
dentro do runtime Codex depois que o OpenClaw envia os parâmetros de thread e turno.

Regere-os com `pnpm prompt:snapshots:gen` e verifique desvios com
`pnpm prompt:snapshots:check`. A CI executa a verificação de desvio no shard adicional
de limite para que mudanças de prompt e atualizações de snapshot permaneçam anexadas ao mesmo
PR.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são reduzidos e anexados em **Contexto do Projeto** para que o modelo veja contexto de identidade e perfil sem precisar de leituras explícitas:

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
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados
concisos — especialmente `MEMORY.md`, que pode crescer ao longo do tempo e levar a
uso de contexto inesperadamente alto e Compaction mais frequente.

Quando uma sessão é executada no harness nativo do Codex, o Codex carrega `AGENTS.md`
por meio da própria descoberta de documentos de projeto. O OpenClaw ainda resolve os arquivos de bootstrap
restantes e os encaminha como instruções de configuração do Codex, então `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantêm o mesmo papel de contexto de workspace sem duplicar
`AGENTS.md`.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do Projeto de bootstrap normal. Em turnos comuns, eles são acessados sob demanda por meio das ferramentas `memory_search` e `memory_get`, então não contam contra a janela de contexto, a menos que o modelo os leia explicitamente. Turnos simples `/new` e `/reset` são a exceção: o runtime pode prefixar memória diária recente como um bloco único de contexto de inicialização para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap injetado
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um breve marcador de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso no Contexto do Projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de Personalidade SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, mais sobrecarga do schema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt do sistema inclui uma seção dedicada **Data e Hora Atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui apenas
o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de carimbo de data/hora. A mesma ferramenta pode opcionalmente definir uma substituição de modelo
por sessão (`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e Hora](/pt-BR/date-time) para obter detalhes completos de comportamento.

## Skills

Quando Skills qualificadas existem, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou incluído). Se nenhuma Skill for qualificada, a seção
Skills é omitida.

A qualificação inclui regras de metadados de Skill, verificações de ambiente/configuração de runtime
e a lista de permissão efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills incluídas em Plugin são qualificadas somente quando o Plugin proprietário está habilitado.
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

Isso mantém o prompt base pequeno enquanto ainda habilita o uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados de runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa separação mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção em tempo de execução, como `memory_get`, resultados ao vivo de ferramentas e atualizações do AGENTS.md pós-Compaction.

## Documentação

O prompt do sistema inclui uma seção **Documentação**. Quando a documentação local está disponível, ela aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout Git ou a documentação do pacote npm incluída). Se a documentação local estiver indisponível, ela usa como alternativa [https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui a localização do código-fonte do OpenClaw. Checkouts Git expõem a raiz local do código-fonte para que o agente possa inspecionar o código diretamente. Instalações de pacote incluem a URL do código-fonte no GitHub e instruem o agente a revisar o código-fonte lá sempre que a documentação estiver incompleta ou desatualizada. O prompt também menciona o espelho público da documentação, o Discord da comunidade e o ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele instrui o modelo a consultar a documentação primeiro para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar `openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso). Especificamente para configuração, ele orienta os agentes para a ação da ferramenta `gateway` `config.schema.lookup` para documentação e restrições exatas em nível de campo, e depois para `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` para orientações mais amplas.

## Relacionado

- [Runtime do agente](/pt-BR/concepts/agent)
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
