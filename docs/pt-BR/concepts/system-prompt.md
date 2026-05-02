---
read_when:
    - Editando o texto do prompt do sistema, a lista de ferramentas ou as seções de tempo/Heartbeat
    - Alterando a inicialização do espaço de trabalho ou o comportamento de injeção de Skills
summary: O que o prompt do sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-05-02T22:18:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt sensíveis a cache sem substituir
o prompt completo de propriedade do OpenClaw. O ambiente de execução do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provedor para ajustes específicos de famílias de modelos. Mantenha a mutação legada de prompt
`before_prompt_build` para compatibilidade ou alterações de prompt realmente globais,
não para o comportamento normal de provedores.

A sobreposição da família OpenAI GPT-5 mantém a regra central de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
consulta paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene de ferramentas de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete de fonte da verdade para ferramentas estruturadas, além de orientações de uso de ferramentas em tempo de execução.
- **Viés de execução**: orientação compacta de acompanhamento: agir no turno em
  solicitações acionáveis, continuar até concluir ou ficar bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Segurança**: breve lembrete de proteção para evitar comportamento de busca de poder ou contornar supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança com
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração completa
  com `config.apply` e executar `update.run` somente por solicitação explícita do usuário.
  A ferramenta exclusiva do proprietário `gateway` também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos de execução protegidos.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do workspace (injetados)**: indica que os arquivos de inicialização estão incluídos abaixo.
- **Sandbox** (quando ativado): indica ambiente de execução em sandbox, caminhos de sandbox e se execução elevada está disponível.
- **Data e hora atuais**: hora local do usuário, fuso horário e formato de hora.
- **Tags de resposta**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão ativados para o agente padrão.
- **Ambiente de execução**: host, SO, node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível de visibilidade atual + dica de alternância /reasoning.

O OpenClaw mantém conteúdo estável grande, incluindo **Contexto do projeto**, acima do
limite interno de cache do prompt. Seções voláteis de canal/sessão, como
orientação de incorporação da interface de controle, **Mensagens**, **Voz**, **Contexto de chat em grupo**,
**Reações**, **Heartbeats** e **Ambiente de execução**, são acrescentadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável do workspace
entre turnos de canal. Descrições de ferramentas também devem evitar incorporar nomes de
canais atuais quando o esquema aceito já carrega esse detalhe de tempo de execução.

A seção Ferramentas também inclui orientações de tempo de execução para trabalho de longa duração:

- use cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de suspensão com `exec`, truques de atraso com `yieldMs` ou sondagem repetida de `process`
- use `exec` / `process` somente para comandos que começam agora e continuam executando
  em segundo plano
- quando a ativação automática por conclusão estiver habilitada, inicie o comando uma vez e confie no
  caminho de ativação baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão de subagentes é
  baseada em push e anuncia automaticamente o retorno ao solicitante
- não sonde `subagents list` / `sessions_list` em loop apenas para esperar a
  conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Ferramentas também informa ao
modelo para usá-la somente em trabalho não trivial de várias etapas, manter exatamente uma etapa
`in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não aplicam políticas. Use política de ferramentas, aprovações de execução, sandbox e listas de permissões de canal para aplicação rígida; operadores podem desativá-las por projeto.

Em canais com cartões/botões de aprovação nativos, o prompt de tempo de execução agora informa ao
agente para confiar primeiro nessa interface de aprovação nativa. Ele deve incluir um comando manual
`/approve` somente quando o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O ambiente de execução define um
`promptMode` para cada execução (não é uma configuração visível ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de memória**, **Autoatualização do OpenClaw**,
  **Aliases de modelo**, **Identidade do usuário**, **Tags de resposta**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e hora atuais (quando conhecidas), Ambiente de execução e contexto
  injetado permanecem disponíveis.
- `none`: retorna somente a linha de identidade base.

Quando `promptMode=minimal`, prompts injetados extras são rotulados como **Contexto de subagente**
em vez de **Contexto de chat em grupo**.

Para execuções de resposta automática de canal, o OpenClaw pode omitir a seção genérica **Respostas silenciosas**
quando o contexto de chat direto/em grupo já inclui o comportamento `NO_REPLY`
específico da conversa resolvida. Isso evita repetir a mecânica de tokens
tanto no prompt de sistema global quanto no contexto do canal.

## Instantâneos de prompt

O OpenClaw mantém instantâneos de prompt de caminho feliz confirmados para o ambiente de execução
Codex/ferramenta de mensagens em `test/fixtures/agents/prompt-snapshots/happy-path/`. Eles renderizam
parâmetros selecionados de thread/turno do servidor de aplicativo, além de uma pilha reconstruída de camadas de prompt vinculadas ao modelo
para turnos diretos do Telegram, de grupo do Discord e de Heartbeat. Essa pilha
inclui uma fixture fixada do prompt do modelo Codex `gpt-5.5` gerada a partir do formato de catálogo/cache
de modelos do Codex, o texto de desenvolvedor de permissão de caminho feliz do Codex,
instruções de desenvolvedor do OpenClaw, entrada do turno do usuário e referências às especificações dinâmicas
de ferramentas.

Atualize a fixture fixada do prompt do modelo Codex com
`pnpm prompt:snapshots:sync-codex-model`. Por padrão, o script procura
o cache de tempo de execução do Codex em `$CODEX_HOME/models_cache.json`, depois em
`~/.codex/models_cache.json` e só então recorre à convenção de checkout do Codex
do mantenedor em `~/code/codex/codex-rs/models-manager/models.json`. Se
nenhuma dessas fontes existir, o comando sai sem alterar a fixture confirmada.
Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json`
ou `models.json` específico.

Esses instantâneos ainda não são uma captura bruta byte a byte de uma solicitação OpenAI. O Codex
pode adicionar contexto de workspace de propriedade do tempo de execução, como `AGENTS.md`, contexto de ambiente,
memórias, instruções de aplicativo/plugin e futuras instruções de modo de colaboração
dentro do tempo de execução do Codex depois que o OpenClaw envia parâmetros de thread e turno.

Regere-os com `pnpm prompt:snapshots:gen` e verifique desvios com
`pnpm prompt:snapshots:check`. A CI executa a verificação de desvio no fragmento adicional
de limite para que alterações de prompt e atualizações de instantâneos permaneçam anexadas ao mesmo
PR.

## Injeção de inicialização do workspace

Arquivos de inicialização são aparados e acrescentados em **Contexto do projeto** para que o modelo veja contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em workspaces totalmente novos)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
uma barreira específica do arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desativados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados
concisos — especialmente `MEMORY.md`, que pode crescer ao longo do tempo e levar a
uso de contexto inesperadamente alto e Compaction mais frequente.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do projeto de inicialização normal. Em turnos comuns, eles são acessados sob demanda pelas ferramentas `memory_search` e `memory_get`, portanto não contam contra a janela de contexto a menos que o modelo os leia explicitamente. Turnos simples `/new` e `/reset` são a exceção: o ambiente de execução pode prefixar memória diária recente como um bloco único de contexto de inicialização para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de inicialização injetado
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um breve marcador de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso no Contexto do projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam somente `AGENTS.md` e `TOOLS.md` (outros arquivos de inicialização
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para mutar ou substituir
os arquivos de inicialização injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de personalidade SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto versus injetado, truncamento, mais sobrecarga de esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt de sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui somente
o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de carimbo de data e hora. A mesma ferramenta pode opcionalmente definir uma substituição de modelo
por sessão (`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e hora](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando Skills qualificadas existem, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou incluído). Se nenhuma Skill estiver qualificada, a
seção Skills é omitida.

A qualificação inclui barreiras de metadados de Skills, verificações de ambiente/configuração em tempo de execução
e a lista efetiva de permissões de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills incluídas em plugins são qualificadas somente quando o plugin proprietário está habilitado.
Isso permite que plugins de ferramentas exponham guias operacionais mais profundos sem incorporar todas
essas orientações diretamente em cada descrição de ferramenta.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Isso mantém o prompt base pequeno, enquanto ainda permite o uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos delimitados de tempo de execução usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa divisão mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção de tempo de execução, como
`memory_get`, resultados de ferramentas ao vivo e atualizações de AGENTS.md após Compaction.

## Documentação

O prompt do sistema inclui uma seção de **Documentação**. Quando a documentação local está disponível, ela
aponta para o diretório local da documentação do OpenClaw (`docs/` em um checkout do Git ou a documentação
do pacote npm incluído). Se a documentação local não estiver disponível, ela recorre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui a localização do código-fonte do OpenClaw. Checkouts do Git expõem a raiz local
do código-fonte para que o agente possa inspecionar o código diretamente. Instalações de pacote incluem a URL do
código-fonte no GitHub e instruem o agente a revisar o código-fonte lá sempre que a documentação estiver incompleta ou
desatualizada. O prompt também menciona o espelho público da documentação, o Discord da comunidade e o ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele instrui o modelo a
consultar primeiro a documentação para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a
executar `openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
Especificamente para configuração, ele direciona os agentes à ação da ferramenta `gateway`
`config.schema.lookup` para documentação e restrições exatas no nível de campo, depois a
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
para orientações mais amplas.

## Relacionado

- [Tempo de execução do agente](/pt-BR/concepts/agent)
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
