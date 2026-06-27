---
read_when:
    - Edição do texto do prompt do sistema, da lista de ferramentas ou das seções de tempo/Heartbeat
    - Alteração do comportamento de bootstrap do workspace ou de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-06-27T17:27:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

O OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **pertencente ao OpenClaw** e não usa um prompt padrão de tempo de execução.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

A montagem do prompt tem três camadas:

- `buildAgentSystemPrompt` renderiza o prompt a partir de entradas explícitas. Ele deve
  permanecer um renderizador puro e não deve ler a configuração global diretamente.
- `resolveAgentSystemPromptConfig` resolve controles de prompt baseados em configuração, como
  exibição do proprietário, dicas de TTS, aliases de modelo, modo de citação de memória e modo de
  delegação de subagente para um agente específico.
- Adaptadores de tempo de execução (embutidos, CLI, prévias de comando/exportação, Compaction) coletam
  fatos ao vivo, como ferramentas, estado de sandbox, capacidades de canal, arquivos de contexto
  e contribuições de prompt do provedor, e então chamam a fachada de prompt configurada.

Isso mantém as superfícies de prompt exportadas/de depuração alinhadas com execuções ao vivo sem
transformar cada detalhe específico de tempo de execução em um único construtor monolítico.

Plugins de provedor podem contribuir com orientações de prompt cientes de cache sem substituir
o prompt completo pertencente ao OpenClaw. O tempo de execução do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições pertencentes ao provedor para ajustes específicos de famílias de modelos. Mantenha a mutação de prompt legada
`before_prompt_build` para compatibilidade ou mudanças de prompt verdadeiramente globais,
não para o comportamento normal do provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra central de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
busca paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene de ferramentas de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramental**: lembrete da fonte da verdade de ferramenta estruturada mais orientação de uso de ferramentas em tempo de execução.
- **Viés de execução**: orientação compacta de acompanhamento: agir no turno em
  solicitações acionáveis, continuar até concluir ou ficar bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e validar antes de finalizar.
- **Segurança**: lembrete breve de salvaguarda para evitar comportamento de busca de poder ou burla de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Controle do OpenClaw**: informa ao modelo para preferir a ferramenta `gateway` para
  trabalho de configuração/reinicialização e evitar inventar comandos de CLI.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração completa
  com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário.
  A ferramenta `gateway` voltada ao agente também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que normalizam para esses caminhos protegidos de execução.
- **Área de trabalho**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação/fonte do OpenClaw e quando lê-la.
- **Arquivos da área de trabalho (injetados)**: indica que os arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica tempo de execução em sandbox, caminhos de sandbox e se execução elevada está disponível.
- **Data e hora atuais**: somente fuso horário (estável para cache; o relógio ao vivo vem de `session_status`).
- **Diretivas de saída do assistente**: sintaxe compacta de anexo, nota de voz e etiqueta de resposta.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão habilitados para o agente padrão.
- **Tempo de execução**: host, SO, Node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível de visibilidade atual + dica do alternador /reasoning.

O OpenClaw mantém conteúdo grande e estável, incluindo **Contexto do projeto**, acima do
limite interno do cache de prompt. Seções voláteis de canal/sessão, como
orientação de incorporação da UI de Controle, **Mensagens**, **Voz**, **Contexto de chat em grupo**,
**Reações**, **Heartbeats** e **Tempo de execução**, são anexadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável da área de trabalho
entre turnos de canal. As descrições de ferramentas também devem evitar incorporar nomes de canais atuais
quando o esquema aceito já carrega esse detalhe de tempo de execução.

A seção Ferramental também inclui orientação de tempo de execução para trabalho de longa duração:

- use Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de espera com `exec`, truques de atraso com `yieldMs` ou sondagem repetida de `process`
- use `exec` / `process` somente para comandos que começam agora e continuam executando
  em segundo plano
- quando o despertar automático de conclusão estiver habilitado, inicie o comando uma vez e confie no
  caminho de despertar baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é
  baseada em push e anuncia automaticamente de volta ao solicitante
- não faça sondagem de `subagents list` / `sessions_list` em loop apenas para aguardar
  a conclusão

`agents.defaults.subagents.delegationMode` pode reforçar essa orientação. O
modo padrão `suggest` mantém o incentivo de base. `prefer` adiciona uma seção dedicada
**Delegação de subagente** instruindo o agente principal a atuar como um coordenador responsivo
e encaminhar qualquer coisa mais envolvida que uma resposta direta por meio de
`sessions_spawn`. Isso afeta apenas o prompt; a política de ferramentas ainda controla se
`sessions_spawn` está disponível.

Quando a ferramenta experimental `update_plan` está habilitada, Ferramental também instrui o
modelo a usá-la somente para trabalho não trivial de várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

As salvaguardas de segurança no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de execução, sandboxing e listas de permissão de canais para imposição rígida; operadores podem desabilitá-las por design.

Em canais com cartões/botões nativos de aprovação, o prompt de tempo de execução agora instrui o
agente a depender primeiro dessa UI nativa de aprovação. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O tempo de execução define um
`promptMode` para cada execução (não uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Recuperação de memória**, **Autoatualização do OpenClaw**,
  **Aliases de modelo**, **Identidade do usuário**, **Diretivas de saída do assistente**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramental, **Segurança**,
  **Skills** quando fornecidas, Área de trabalho, Sandbox, Data e hora atuais (quando
  conhecidas), Tempo de execução e contexto injetado permanecem disponíveis.
- `none`: retorna somente a linha de identidade base.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto do subagente**
em vez de **Contexto de chat em grupo**.

Para execuções de resposta automática de canal, o OpenClaw omite a seção genérica **Respostas silenciosas**
quando o contexto direto, de grupo ou somente de ferramenta de mensagens é proprietário do contrato de resposta visível.
Somente o modo antigo automático de grupo/canal deve mostrar `NO_REPLY`; chats diretos
e respostas somente por ferramenta de mensagens não recebem orientação de token silencioso.

## Snapshots de prompt

O OpenClaw mantém snapshots de prompt com commit para o caminho ideal do tempo de execução do Codex em
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Eles renderizam
parâmetros selecionados de thread/turno do servidor do app mais uma pilha reconstruída de camadas de prompt vinculadas ao modelo
para turnos diretos do Telegram, grupos do Discord e Heartbeat. Essa pilha
inclui uma fixture fixada de prompt do modelo Codex `gpt-5.5` gerada a partir do formato de catálogo/cache
de modelos do Codex, o texto de desenvolvedor de permissão do caminho ideal do Codex,
instruções de desenvolvedor do OpenClaw, instruções de modo de colaboração com escopo de turno
quando o OpenClaw as fornece, entrada do turno do usuário e referências às especificações dinâmicas de ferramentas.

Atualize a fixture fixada de prompt do modelo Codex com
`pnpm prompt:snapshots:sync-codex-model`. Por padrão, o script procura o cache de tempo de execução
do Codex em `$CODEX_HOME/models_cache.json`, depois em
`~/.codex/models_cache.json`, e só então recorre à convenção do checkout Codex do mantenedor
em `~/code/codex/codex-rs/models-manager/models.json`. Se
nenhuma dessas fontes existir, o comando sai sem alterar a fixture com commit.
Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json`
ou `models.json` específico.

Esses snapshots ainda não são uma captura bruta byte a byte da solicitação da OpenAI. O Codex
pode adicionar contexto de área de trabalho pertencente ao tempo de execução, como `AGENTS.md`, contexto de ambiente,
memórias, instruções de app/Plugin e instruções integradas do modo de colaboração Padrão
dentro do tempo de execução do Codex depois que o OpenClaw envia
parâmetros de thread e turno.

Regere-os com `pnpm prompt:snapshots:gen` e verifique desvios com
`pnpm prompt:snapshots:check`. A CI executa a verificação de desvios no shard adicional
de limites para que mudanças de prompt e atualizações de snapshot permaneçam anexadas ao mesmo
PR.

## Injeção de bootstrap da área de trabalho

Arquivos de bootstrap são resolvidos a partir da área de trabalho ativa e então roteados para a
superfície de prompt que corresponde ao seu ciclo de vida:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em áreas de trabalho totalmente novas)
- `MEMORY.md` quando presente

No harness nativo do Codex, o OpenClaw evita repetir arquivos estáveis da área de trabalho
em cada turno do usuário. O Codex carrega `AGENTS.md` por meio da própria
descoberta de documentação de projeto. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` são encaminhados como
instruções de desenvolvedor do Codex. A lista compacta de Skills do OpenClaw também é encaminhada
como instruções de desenvolvedor de colaboração com escopo de turno. O conteúdo de `HEARTBEAT.md`
não é injetado; turnos de Heartbeat recebem uma nota de modo de colaboração apontando para o arquivo
quando ele existe e não está vazio. O conteúdo de `MEMORY.md` da área de trabalho configurada do agente
não é colado em cada turno nativo do Codex; quando ferramentas de memória estão
disponíveis para essa área de trabalho, turnos do Codex recebem uma pequena nota de memória da área de trabalho em
instruções de desenvolvedor de colaboração com escopo de turno e devem usar `memory_search`
ou `memory_get` quando memória durável for relevante. Se as ferramentas estiverem desabilitadas, a busca de memória
estiver indisponível ou a área de trabalho ativa diferir da área de trabalho de memória do agente,
`MEMORY.md` volta ao caminho normal de contexto de turno limitado. O conteúdo ativo de
`BOOTSTRAP.md` mantém o papel normal de contexto de turno por enquanto.

Em harnesses que não são Codex, os arquivos de bootstrap continuam a ser compostos no
prompt do OpenClaw de acordo com seus gates existentes. `HEARTBEAT.md` é omitido em
execuções normais quando Heartbeats estão desabilitados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é falso. Mantenha os arquivos injetados
concisos, especialmente `MEMORY.md` fora do Codex. `MEMORY.md` deve permanecer
um resumo curado de longo prazo; notas diárias detalhadas pertencem a `memory/*.md`, onde
`memory_search` e `memory_get` podem recuperá-las sob demanda. Arquivos
`MEMORY.md` fora do Codex grandes demais aumentam o uso de prompt e podem ser parcialmente injetados
por causa dos limites de arquivo de bootstrap abaixo.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do projeto normal de bootstrap. Em turnos comuns, eles são acessados sob demanda por meio das ferramentas `memory_search` e `memory_get`, então não contam contra a janela de contexto, a menos que o modelo os leia explicitamente. Turnos `/new` e `/reset` isolados são a exceção: o tempo de execução pode antepor memória diária recente como um bloco único de contexto de inicialização para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 20000). O conteúdo total de bootstrap
injetado entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre
truncamento, o OpenClaw pode injetar um aviso conciso no prompt do sistema; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `always`). Contagens brutas/injetadas detalhadas ficam em diagnósticos como
`/context`, `/status`, doctor e logs.

Para arquivos de memória, truncamento não é perda de dados: o arquivo permanece intacto no disco.
No Codex nativo, `MEMORY.md` é lido sob demanda por meio de ferramentas de memória quando
disponíveis, com fallback limitado no prompt quando as ferramentas não conseguem executar. Em outros
harnesses, o modelo vê apenas a cópia injetada encurtada até ler ou
pesquisar a memória diretamente. Se `MEMORY.md` for repetidamente truncado ali, destile-o
em um resumo durável mais curto e mova o histórico detalhado para `memory/*.md`,
ou aumente intencionalmente os limites de bootstrap.

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do subagente pequeno).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de personalidade SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além da sobrecarga do esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt do sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui
apenas o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de carimbo de data/hora. A mesma ferramenta pode opcionalmente definir uma substituição de modelo por sessão
(`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e hora](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando existem Skills qualificadas, o OpenClaw injeta uma **lista de Skills disponíveis** compacta
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** e o marcador
`<version>` derivado do conteúdo para cada skill. O prompt instrui o modelo a usar `read`
para carregar o SKILL.md no local listado (workspace, gerenciado ou empacotado),
e a reler uma skill quando seu `<version>` diferir de um turno anterior. Se nenhuma
skill estiver qualificada, a seção Skills é omitida.

Turnos do Codex nativo recebem essa lista como instruções de desenvolvedor de colaboração com escopo de turno
em vez de entrada do usuário por turno, exceto turnos leves de cron que
preservam o prompt agendado exato. Outros harnesses mantêm a seção normal do prompt.

O local pode apontar para uma skill aninhada, como
`skills/personal/foo/SKILL.md`. O aninhamento é apenas organizacional; o prompt ainda
usa o nome plano da skill do frontmatter de `SKILL.md`.

A qualificação inclui gates de metadados da skill, verificações de ambiente/configuração em runtime
e a allowlist efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills empacotadas em Plugin só são qualificadas quando seu Plugin proprietário está habilitado.
Isso permite que Plugins de ferramentas exponham guias operacionais mais profundos sem incorporar toda
essa orientação diretamente em cada descrição de ferramenta.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
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

Essa separação mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção de runtime, como
`memory_get`, resultados de ferramentas ao vivo e atualizações de AGENTS.md pós-Compaction.

## Documentação

O prompt do sistema inclui uma seção **Documentação**. Quando a documentação local está disponível, ela
aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout Git ou a documentação do pacote
npm empacotado). Se a documentação local não estiver disponível, ela recorre a
[https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui o local do código-fonte do OpenClaw. Checkouts Git expõem a raiz local
do código-fonte para que o agente possa inspecionar o código diretamente. Instalações de pacote incluem a URL do código-fonte
no GitHub e dizem ao agente para revisar o código-fonte lá sempre que a documentação estiver incompleta ou
desatualizada. O prompt também observa o espelho público da documentação, o Discord da comunidade e o ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele enquadra a documentação como a
autoridade para o autoconhecimento do OpenClaw antes que o modelo entenda como o OpenClaw funciona,
incluindo memória/notas diárias, sessões, ferramentas, Gateway, configuração, comandos ou contexto
do projeto. O prompt diz ao modelo para usar primeiro a documentação local (ou o espelho da documentação quando a documentação local
não estiver disponível), e para tratar AGENTS.md, contexto do projeto, notas de workspace/perfil/memória
e `memory_search` como contexto de instruções ou memória do usuário, em vez de conhecimento de design
ou implementação do OpenClaw. Se a documentação estiver silenciosa ou desatualizada, o modelo deve dizer isso
e inspecionar o código-fonte. O prompt também diz ao modelo para executar `openclaw status` por conta própria quando
possível, perguntando ao usuário apenas quando não tiver acesso.
Para configuração especificamente, ele aponta os agentes para a ação da ferramenta `gateway`
`config.schema.lookup` para documentação e restrições exatas em nível de campo, depois para
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
para orientações mais amplas.

## Relacionados

- [Runtime do agente](/pt-BR/concepts/agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
