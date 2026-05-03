---
read_when:
    - Edição do texto do prompt do sistema, da lista de ferramentas ou das seções de tempo/Heartbeat
    - Alteração da inicialização do espaço de trabalho ou do comportamento de injeção de Skills
summary: O que o prompt do sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-05-03T21:30:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt sensíveis ao cache sem substituir
o prompt completo de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções principais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições de propriedade do provedor para ajustes específicos de famílias de modelos. Mantenha a mutação de prompt legada
`before_prompt_build` para compatibilidade ou mudanças de prompt verdadeiramente globais,
não para o comportamento normal do provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra principal de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina de ferramentas,
busca paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene da ferramenta de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete da fonte da verdade de ferramentas estruturadas mais orientações de uso de ferramentas em runtime.
- **Viés de execução**: orientação compacta de acompanhamento: agir no turno em
  solicitações acionáveis, continuar até concluir ou ficar bloqueado, recuperar-se de resultados fracos de ferramentas,
  verificar estado mutável ao vivo e verificar antes de finalizar.
- **Segurança**: lembrete curto de proteção para evitar comportamento de busca de poder ou bypass de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança com
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração
  completa com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário.
  A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos exec protegidos.
- **Espaço de trabalho**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do espaço de trabalho (injetados)**: indica que arquivos de inicialização estão incluídos abaixo.
- **Sandbox** (quando ativado): indica runtime em sandbox, caminhos de sandbox e se exec elevado está disponível.
- **Data e hora atuais**: hora local do usuário, fuso horário e formato de hora.
- **Tags de resposta**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão ativados para o agente padrão.
- **Runtime**: host, SO, Node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível atual de visibilidade + dica de alternância /reasoning.

O OpenClaw mantém conteúdo estável grande, incluindo **Contexto do projeto**, acima do
limite interno do cache de prompt. Seções voláteis de canal/sessão, como
orientação de incorporação da UI de controle, **Mensagens**, **Voz**, **Contexto de chat em grupo**,
**Reações**, **Heartbeats** e **Runtime**, são anexadas abaixo desse limite
para que backends locais com caches de prefixo possam reutilizar o prefixo estável do espaço de trabalho
entre turnos de canal. Descrições de ferramentas também devem evitar incorporar nomes atuais
de canais quando o esquema aceito já carrega esse detalhe de runtime.

A seção Ferramentas também inclui orientações de runtime para trabalhos de longa duração:

- use Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de espera com `exec`, truques de atraso `yieldMs` ou consultas repetidas de `process`
- use `exec` / `process` somente para comandos que começam agora e continuam executando
  em segundo plano
- quando a ativação automática por conclusão estiver habilitada, inicie o comando uma vez e confie no
  caminho de ativação baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é
  baseada em push e se anuncia automaticamente de volta ao solicitante
- não consulte `subagents list` / `sessions_list` em loop apenas para aguardar
  a conclusão

Quando a ferramenta experimental `update_plan` está ativada, Ferramentas também instrui o
modelo a usá-la somente para trabalho de várias etapas não trivial, manter exatamente uma etapa
`in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e listas de permissões de canal para imposição rígida; operadores podem desativá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora instrui o
agente a confiar primeiro nessa UI de aprovação nativa. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta informar que aprovações por chat estão indisponíveis ou que
aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de memória**, **Autoatualização do OpenClaw**,
  **Aliases de modelo**, **Identidade do usuário**, **Tags de resposta**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Espaço de trabalho, Sandbox, Data e hora atuais (quando conhecidas), Runtime e contexto
  injetado continuam disponíveis.
- `none`: retorna somente a linha de identidade básica.

Quando `promptMode=minimal`, prompts injetados extras são rotulados como **Contexto do subagente**
em vez de **Contexto de chat em grupo**.

Para execuções de resposta automática de canal, o OpenClaw pode omitir a seção genérica **Respostas silenciosas**
quando o contexto de chat direto/em grupo já inclui o comportamento `NO_REPLY`
específico da conversa resolvido. Isso evita repetir mecânicas de token
tanto no prompt de sistema global quanto no contexto do canal.

## Instantâneos de prompt

O OpenClaw mantém instantâneos de prompt versionados para o caminho feliz do runtime Codex em
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Eles renderizam
parâmetros selecionados de thread/turno do servidor de app mais uma pilha reconstruída de camadas de prompt
vinculadas ao modelo para turnos diretos do Telegram, em grupo do Discord e de Heartbeat. Essa pilha
inclui um fixture fixado de prompt do modelo Codex `gpt-5.5` gerado a partir do formato
do catálogo/cache de modelos do Codex, o texto de desenvolvedor de permissões do caminho feliz do Codex,
instruções de desenvolvedor do OpenClaw, instruções de modo de colaboração com escopo de turno
quando o OpenClaw as fornece, entrada de turno do usuário e referências às especificações dinâmicas de ferramentas.

Atualize o fixture fixado do prompt do modelo Codex com
`pnpm prompt:snapshots:sync-codex-model`. Por padrão, o script procura o
cache de runtime do Codex em `$CODEX_HOME/models_cache.json`, depois em
`~/.codex/models_cache.json` e só então recorre à convenção do checkout Codex
do mantenedor em `~/code/codex/codex-rs/models-manager/models.json`. Se
nenhuma dessas fontes existir, o comando sai sem alterar o fixture versionado.
Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json`
ou `models.json` específico.

Esses instantâneos ainda não são uma captura bruta byte a byte de uma solicitação OpenAI. O Codex
pode adicionar contexto de espaço de trabalho de propriedade do runtime, como `AGENTS.md`, contexto de ambiente,
memórias, instruções de app/Plugin e instruções integradas de modo de colaboração
Default dentro do runtime Codex depois que o OpenClaw envia parâmetros de thread e turno.

Regere-os com `pnpm prompt:snapshots:gen` e verifique desvios com
`pnpm prompt:snapshots:check`. A CI executa a verificação de desvio no shard adicional
de limite para que mudanças de prompt e atualizações de instantâneos permaneçam anexadas ao mesmo
PR.

## Injeção de inicialização do espaço de trabalho

Arquivos de inicialização são aparados e anexados em **Contexto do projeto** para que o modelo veja identidade e contexto de perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em espaços de trabalho recém-criados)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
uma regra específica de arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desativados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados
concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso de contexto inesperadamente alto e Compaction mais frequente.

Quando uma sessão roda no harness nativo do Codex, o Codex carrega `AGENTS.md`
por meio de sua própria descoberta de documentos do projeto. O OpenClaw ainda resolve os demais
arquivos de inicialização e os encaminha como instruções de configuração do Codex, então `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e
`MEMORY.md` mantêm a mesma função de contexto do espaço de trabalho sem duplicar
`AGENTS.md`.

<Note>
Arquivos diários `memory/*.md` **não** fazem parte do Contexto do projeto de inicialização normal. Em turnos comuns, eles são acessados sob demanda por meio das ferramentas `memory_search` e `memory_get`, então não contam contra a janela de contexto, a menos que o modelo os leia explicitamente. Turnos simples `/new` e `/reset` são a exceção: o runtime pode prefixar memória diária recente como um bloco único de contexto de inicialização para esse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de inicialização injetado
entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Contexto do projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam somente `AGENTS.md` e `TOOLS.md` (outros arquivos de inicialização
são filtrados para manter o contexto do subagente pequeno).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de inicialização injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se quiser fazer o agente soar menos genérico, comece com
[Guia de personalidade do SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além da sobrecarga de esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt de sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache de prompt estável, agora ele inclui somente
o **fuso horário** (sem relógio dinâmico ou formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de carimbo de data/hora. A mesma ferramenta pode opcionalmente definir uma substituição de modelo
por sessão (`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e hora](/pt-BR/date-time) para detalhes completos de comportamento.

## Skills

Quando Skills elegíveis existem, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(espaço de trabalho, gerenciado ou empacotado). Se nenhuma Skill for elegível, a
seção Skills é omitida.

A elegibilidade inclui regras de metadados de Skills, verificações de ambiente/configuração de runtime
e a lista efetiva de Skills permitidas do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills empacotadas por Plugin são elegíveis somente quando o Plugin proprietário está ativado.
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

Isso mantém o prompt base pequeno, ao mesmo tempo que permite o uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Excertos genéricos delimitados de runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa separação mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção em runtime, como `memory_get`, resultados de ferramentas ao vivo e atualizações pós-Compaction do AGENTS.md.

## Documentação

O prompt do sistema inclui uma seção **Documentação**. Quando a documentação local está disponível, ela aponta para o diretório local de documentação do OpenClaw (`docs/` em um checkout Git ou a documentação incluída no pacote npm). Se a documentação local não estiver disponível, ele recorre a [https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui a localização do código-fonte do OpenClaw. Checkouts Git expõem a raiz local do código-fonte para que o agente possa inspecionar o código diretamente. Instalações de pacote incluem a URL do código-fonte no GitHub e orientam o agente a revisar o código-fonte lá sempre que a documentação estiver incompleta ou desatualizada. O prompt também menciona o espelho público da documentação, o Discord da comunidade e o ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele orienta o modelo a consultar a documentação primeiro para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar `openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso). Especificamente para configuração, ele direciona os agentes para a ação de ferramenta `gateway` `config.schema.lookup` para documentação e restrições exatas em nível de campo, depois para `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` para orientações mais amplas.

## Relacionado

- [Runtime do agente](/pt-BR/concepts/agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
