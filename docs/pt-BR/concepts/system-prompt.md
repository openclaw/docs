---
read_when:
    - Edição do texto do prompt do sistema, da lista de ferramentas ou das seções de tempo/Heartbeat
    - Alteração do comportamento de inicialização do espaço de trabalho ou de injeção de Skills
summary: O que o prompt do sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-05-10T19:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

O OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **controlado pelo OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

A montagem do prompt tem três camadas:

- `buildAgentSystemPrompt` renderiza o prompt a partir de entradas explícitas. Ele deve
  permanecer um renderizador puro e não deve ler a configuração global diretamente.
- `resolveAgentSystemPromptConfig` resolve controles de prompt baseados em configuração, como
  exibição do proprietário, dicas de TTS, aliases de modelo, modo de citação de memória e modo
  de delegação de subagente para um agente específico.
- Adaptadores de runtime (incorporado, CLI, pré-visualizações de comando/exportação, Compaction) coletam
  fatos ativos, como ferramentas, estado do sandbox, capacidades do canal, arquivos de contexto
  e contribuições de prompt do provedor, depois chamam a fachada de prompt configurada.

Isso mantém as superfícies de prompt exportadas/de depuração alinhadas com as execuções reais sem
transformar cada detalhe específico de runtime em um construtor monolítico.

Plugins de provedor podem contribuir com orientações de prompt cientes de cache sem substituir
todo o prompt controlado pelo OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições controladas pelo provedor para ajustes específicos da família de modelos. Mantenha a mutação de prompt legada
`before_prompt_build` para compatibilidade ou mudanças de prompt realmente globais,
não para comportamento normal de provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra central de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
busca paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene de ferramentas de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete de fonte da verdade de ferramenta estruturada mais orientação de uso de ferramentas em runtime.
- **Viés de execução**: orientação compacta de acompanhamento: agir no turno em
  solicitações acionáveis, continuar até concluir ou ficar bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Segurança**: breve lembrete de proteções para evitar comportamento de busca de poder ou contorno de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Controle do OpenClaw**: instrui o modelo a preferir a ferramenta `gateway` para
  trabalho de configuração/reinicialização e evitar inventar comandos de CLI.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, aplicar patches na configuração com `config.patch`, substituir a configuração completa
  com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário.
  A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que normalizam para esses caminhos exec protegidos.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para docs/source do OpenClaw e quando lê-los.
- **Arquivos do workspace (injetados)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos do sandbox e se exec elevado está disponível.
- **Data e hora atuais**: apenas fuso horário (estável para cache; o relógio ao vivo vem de `session_status`).
- **Diretivas de saída do assistente**: sintaxe compacta de anexo, nota de voz e tag de resposta.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão habilitados para o agente padrão.
- **Runtime**: host, SO, Node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível atual de visibilidade + dica do alternador /reasoning.

O OpenClaw mantém conteúdo grande e estável, incluindo **Contexto do projeto**, acima do
limite interno do cache de prompt. Seções voláteis de canal/sessão, como
orientação incorporada da IU de controle, **Mensagens**, **Voz**, **Contexto de chat em grupo**,
**Reações**, **Heartbeats** e **Runtime**, são anexadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável do workspace
entre turnos de canal. Descrições de ferramentas também devem evitar incorporar nomes de
canais atuais quando o esquema aceito já carrega esse detalhe de runtime.

A seção Ferramentas também inclui orientação de runtime para trabalhos de longa duração:

- use Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de espera com `exec`, truques de atraso `yieldMs` ou polling repetido de `process`
- use `exec` / `process` somente para comandos que começam agora e continuam executando
  em segundo plano
- quando o despertar automático por conclusão estiver habilitado, inicie o comando uma vez e conte com
  o caminho de despertar baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é
  baseada em push e se anuncia automaticamente de volta ao solicitante
- não faça polling de `subagents list` / `sessions_list` em loop apenas para esperar
  a conclusão

`agents.defaults.subagents.delegationMode` pode reforçar essa orientação. O
modo padrão `suggest` mantém o incentivo básico. `prefer` adiciona uma seção dedicada
**Delegação de subagente** instruindo o agente principal a atuar como um coordenador responsivo
e encaminhar qualquer coisa mais envolvida do que uma resposta direta por meio de
`sessions_spawn`. Isso é apenas prompt; a política de ferramentas ainda controla se
`sessions_spawn` está disponível.

Quando a ferramenta experimental `update_plan` está habilitada, Ferramentas também instrui o
modelo a usá-la somente para trabalho não trivial em várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e allowlists de canal para imposição rígida; operadores podem desativá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora instrui o
agente a usar primeiro essa IU de aprovação nativa. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não uma configuração visível ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Recuperação de memória**, **Autoatualização do OpenClaw**,
  **Aliases de modelo**, **Identidade do usuário**, **Diretivas de saída do assistente**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  **Skills** quando fornecidas, Workspace, Sandbox, Data e hora atuais (quando
  conhecidas), Runtime e contexto injetado permanecem disponíveis.
- `none`: retorna apenas a linha de identidade base.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto de subagente**
em vez de **Contexto de chat em grupo**.

Para execuções de resposta automática de canal, o OpenClaw pode omitir a seção genérica **Respostas silenciosas**
quando o contexto de chat direto/em grupo já inclui o comportamento
`NO_REPLY` resolvido e específico da conversa. Isso evita repetir a mecânica de tokens
tanto no prompt de sistema global quanto no contexto do canal.

## Snapshots de prompt

O OpenClaw mantém snapshots de prompt commitados para o caminho feliz do runtime Codex em
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Eles renderizam
parâmetros selecionados de thread/turno do servidor de aplicativo, mais uma pilha reconstruída de camadas de prompt
vinculadas ao modelo para turnos diretos no Telegram, grupos do Discord e Heartbeat. Essa pilha
inclui uma fixture fixada de prompt de modelo Codex `gpt-5.5` gerada a partir do formato de
catálogo/cache de modelos do Codex, o texto de desenvolvedor de permissões do caminho feliz do Codex,
instruções de desenvolvedor do OpenClaw, instruções de modo de colaboração com escopo de turno
quando o OpenClaw as fornece, entrada do turno do usuário e referências às especificações dinâmicas de ferramentas.

Atualize a fixture fixada de prompt de modelo Codex com
`pnpm prompt:snapshots:sync-codex-model`. Por padrão, o script procura
o cache de runtime do Codex em `$CODEX_HOME/models_cache.json`, depois em
`~/.codex/models_cache.json` e só então recorre à convenção de checkout Codex do mantenedor
em `~/code/codex/codex-rs/models-manager/models.json`. Se
nenhuma dessas fontes existir, o comando sai sem alterar a fixture commitada.
Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json`
ou `models.json` específico.

Esses snapshots ainda não são uma captura bruta byte a byte da solicitação OpenAI. O Codex
pode adicionar contexto de workspace controlado pelo runtime, como `AGENTS.md`, contexto de ambiente,
memórias, instruções de app/plugin e instruções integradas do modo de colaboração
Default dentro do runtime Codex depois que o OpenClaw envia
parâmetros de thread e turno.

Regere-os com `pnpm prompt:snapshots:gen` e verifique desvios com
`pnpm prompt:snapshots:check`. A CI executa a verificação de desvio no shard de limite
adicional para que mudanças de prompt e atualizações de snapshot permaneçam anexadas ao mesmo
PR.

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
um gate específico do arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desabilitados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados
concisos, especialmente `MEMORY.md`. `MEMORY.md` deve permanecer um
resumo curado de longo prazo; notas diárias detalhadas pertencem a `memory/*.md`, onde
`memory_search` e `memory_get` podem recuperá-las sob demanda. Arquivos `MEMORY.md`
grandes demais aumentam o uso do prompt e podem ser parcialmente injetados por causa
dos limites de arquivos de bootstrap abaixo.

Quando uma sessão é executada no harness Codex nativo, o Codex carrega `AGENTS.md`
por meio de sua própria descoberta de documentos de projeto. O OpenClaw ainda resolve os arquivos
de bootstrap restantes e os encaminha como instruções de configuração do Codex, então `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantêm o mesmo papel de contexto de workspace sem duplicar
`AGENTS.md`.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do projeto de bootstrap normal. Em turnos comuns, eles são acessados sob demanda por meio das ferramentas `memory_search` e `memory_get`, portanto não contam contra a janela de contexto, a menos que o modelo os leia explicitamente. Turnos simples `/new` e `/reset` são a exceção: o runtime pode prefixar memória diária recente como um bloco único de contexto de inicialização para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O total de conteúdo de bootstrap injetado
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um breve marcador de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um aviso conciso de prompt de sistema; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`). Contagens brutas/injetadas detalhadas permanecem em diagnósticos como
`/context`, `/status`, doctor e logs.

Para arquivos de memória, truncamento não é perda de dados: o arquivo permanece intacto no disco,
mas o modelo só vê a cópia injetada encurtada até ler ou pesquisar
a memória diretamente. Se `MEMORY.md` for truncado repetidamente, destile-o em um
resumo durável mais curto e mova o histórico detalhado para `memory/*.md`, ou
aumente intencionalmente os limites de bootstrap.

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do subagente pequeno).

Hooks internos podem interceptar esta etapa por meio de `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de personalidade SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além da sobrecarga do esquema da ferramenta), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt do sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui apenas
o **fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta pode opcionalmente definir uma substituição de modelo por sessão
(`model=default` limpa essa substituição).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e hora](/pt-BR/date-time) para detalhes completos sobre o comportamento.

## Skills

Quando existirem Skills elegíveis, o OpenClaw injeta uma **lista de Skills disponíveis** compacta
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou empacotado). Se nenhuma Skill for elegível, a seção
Skills é omitida.

A elegibilidade inclui gates de metadados de Skills, verificações de ambiente/configuração em tempo de execução
e a lista efetiva de Skills permitidas do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills empacotadas por Plugin são elegíveis apenas quando o Plugin proprietário está habilitado.
Isso permite que Plugins de ferramentas exponham guias operacionais mais aprofundados sem incorporar toda
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

Isso mantém o prompt base pequeno enquanto ainda permite o uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados em tempo de execução usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa separação mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção em tempo de execução, como
`memory_get`, resultados de ferramentas ao vivo e atualizações de AGENTS.md pós-Compaction.

## Documentação

O prompt do sistema inclui uma seção **Documentação**. Quando a documentação local está disponível, ela
aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout do Git ou a documentação do pacote npm
empacotado). Se a documentação local não estiver disponível, ela recorre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui o local do código-fonte do OpenClaw. Checkouts do Git expõem a raiz local
do código-fonte para que o agente possa inspecionar o código diretamente. Instalações por pacote incluem a URL
do código-fonte no GitHub e orientam o agente a revisar o código-fonte lá sempre que a documentação estiver incompleta ou
desatualizada. O prompt também observa o espelho público da documentação, o Discord da comunidade e o ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele orienta o modelo a
consultar primeiro a documentação para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a
executar `openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
Especificamente para configuração, ele orienta os agentes para a ação da ferramenta `gateway`
`config.schema.lookup` para documentação e restrições exatas no nível de campo, depois para
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
para orientação mais ampla.

## Relacionados

- [Runtime do agente](/pt-BR/concepts/agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
