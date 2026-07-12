---
read_when:
    - Edição do texto do prompt do sistema, da lista de ferramentas ou das seções de horário/Heartbeat
    - Alteração do comportamento de bootstrap do espaço de trabalho ou de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-07-11T23:56:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw cria seu próprio prompt de sistema para cada execução de agente; não há um prompt padrão em tempo de execução.

A montagem tem três camadas:

- `buildAgentSystemPrompt` renderiza o prompt a partir de entradas explícitas. Ele permanece um renderizador puro e não lê diretamente a configuração global.
- `resolveAgentSystemPromptConfig` resolve os controles de prompt baseados em configuração (exibição do proprietário, dicas de TTS, aliases de modelo, modo de citação de memória, modo de delegação para subagentes) para um agente específico.
- Adaptadores de tempo de execução (incorporado, CLI, prévias de comando/exportação, Compaction) coletam informações em tempo real (ferramentas, estado do sandbox, recursos do canal, arquivos de contexto, contribuições de prompt do provedor) e chamam a fachada de prompt configurada.

Isso mantém as superfícies de prompt exportadas e de depuração alinhadas às execuções em tempo real, sem transformar todos os detalhes de tempo de execução em um único construtor monolítico.

Plugins de provedor podem fornecer orientações compatíveis com cache sem substituir o prompt pertencente ao OpenClaw. Um tempo de execução de provedor pode:

- substituir uma das três seções principais nomeadas: `interaction_style`, `tool_call_style`, `execution_bias`
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições pertencentes ao provedor para ajustes específicos de famílias de modelos. Reserve o hook legado `before_prompt_build` para compatibilidade ou alterações de prompt realmente globais.

A sobreposição incluída para a família GPT-5 do OpenAI/Codex (`resolveGpt5SystemPromptContribution`) usa esse mecanismo: um contrato de comportamento `stablePrefix` (política de execução, disciplina de ferramentas, contrato de saída, contrato de conclusão) mais uma substituição opcional de `interaction_style` para um tom mais amigável. Ela se aplica a qualquer ID de modelo `gpt-5*` encaminhado pelos Plugins OpenAI ou Codex, controlado por `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` ou `"off"`).

## Estrutura

O prompt é compacto, com seções fixas:

- **Ferramentas**: lembrete de que as ferramentas estruturadas são a fonte da verdade, além de orientações de uso de ferramentas em tempo de execução. Quando a ferramenta experimental `update_plan` está habilitada (`tools.experimental.planTool`), sua própria descrição acrescenta: use-a somente em trabalhos não triviais com várias etapas, mantenha no máximo uma etapa como `in_progress` e não a use em trabalhos simples de uma única etapa.
- **Tendência de execução**: agir no mesmo turno em solicitações que permitem ação, continuar até concluir ou ser bloqueado, recuperar-se de resultados fracos das ferramentas, verificar ao vivo estados mutáveis e validar antes de finalizar.
- **Segurança**: breve lembrete de proteção contra comportamento de busca por poder ou evasão de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Controle do OpenClaw**: preferir a ferramenta `gateway` para trabalhos de configuração/reinicialização; não inventar comandos da CLI.
- **Autoatualização do OpenClaw**: inspecionar a configuração com segurança usando `config.schema.lookup`, aplicar alterações com `config.patch`, substituir toda a configuração com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário. A ferramenta `gateway` voltada ao agente se recusa a reescrever `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*` que são normalizados para esses caminhos protegidos.
- **Espaço de trabalho**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local da documentação/do código-fonte e quando consultá-los.
- **Arquivos do espaço de trabalho (injetados)**: informa que os arquivos de inicialização estão incluídos abaixo.
- **Sandbox** (quando habilitado): tempo de execução em sandbox, caminhos do sandbox e disponibilidade de execução com privilégios elevados.
- **Data e hora atuais**: somente o fuso horário (estável para cache; o relógio em tempo real vem de `session_status`).
- **Diretivas de saída do assistente**: sintaxe compacta para anexos, mensagens de voz e tags de resposta.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão habilitados para o agente padrão.
- **Tempo de execução**: host, sistema operacional, Node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível atual de visibilidade e dica sobre o controle `/reasoning`.

Conteúdo estável extenso (incluindo **Contexto do projeto**) permanece acima do limite interno do cache de prompt. Seções voláteis por turno (orientações de incorporação da interface de controle, **Mensagens**, **Voz**, **Contexto de conversa em grupo**, **Reações**, **Heartbeats**, **Tempo de execução**) são anexadas abaixo desse limite para que backends locais com caches de prefixo possam reutilizar o prefixo estável do espaço de trabalho entre turnos de canais. As descrições das ferramentas devem evitar incorporar nomes de canais atuais quando o esquema aceito já contém esse detalhe de tempo de execução.

A seção de ferramentas também contém orientações para trabalhos de longa duração:

- usar Cron para acompanhamento futuro (`check back later`, lembretes, trabalhos recorrentes) em vez de loops de espera com `exec`, truques de atraso com `yieldMs` ou consultas repetidas com `process`
- usar `exec` / `process` somente para comandos que começam agora e continuam em segundo plano
- quando a ativação automática após a conclusão estiver habilitada, iniciar o comando uma vez e confiar no caminho de ativação baseado em push
- usar `process` para logs, status, entrada ou intervenção em um comando em execução
- para tarefas maiores, preferir `sessions_spawn`; a conclusão do subagente é baseada em push e anunciada automaticamente ao solicitante
- não consultar `subagents list` / `sessions_list` repetidamente em um loop apenas para aguardar a conclusão

`agents.defaults.subagents.delegationMode` (padrão `"suggest"`) pode reforçar isso. `"prefer"` adiciona uma seção dedicada de **Delegação para subagentes**, instruindo o agente principal a atuar como um coordenador responsivo e encaminhar por `sessions_spawn` tudo que seja mais complexo do que uma resposta direta. Isso afeta somente o prompt; a política de ferramentas ainda controla se `sessions_spawn` está disponível.

As proteções de segurança no prompt de sistema são consultivas, não mecanismos de aplicação. Use política de ferramentas, aprovações de execução, sandbox e listas de canais permitidos para aplicação rígida; por definição, os operadores podem desabilitar as proteções do prompt.

Em canais com cartões/botões de aprovação nativos, o prompt orienta o agente a usar primeiro essa interface e a incluir um comando manual `/approve` somente quando o resultado da ferramenta informar que aprovações pelo chat estão indisponíveis ou que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw renderiza prompts de sistema menores para subagentes. O tempo de execução define um `promptMode` por execução (não é uma configuração voltada ao usuário):

- `full` (padrão): todas as seções acima.
- `minimal`: usado para subagentes; omite a seção de prompt de memória (incluída como **Recuperação de memória**), **Autoatualização do OpenClaw**, **Aliases de modelo**, **Identidade do usuário**, **Diretivas de saída do assistente**, **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**, **Skills** (quando fornecidas), Espaço de trabalho, Sandbox, Data e hora atuais (quando conhecidas), Tempo de execução e contexto injetado permanecem disponíveis.
- `none`: retorna somente a linha de identidade básica.

Com `promptMode=minimal`, prompts adicionais injetados são identificados como **Contexto do subagente** em vez de **Contexto de conversa em grupo**.

Em execuções de resposta automática de canais, o OpenClaw omite a seção genérica **Respostas silenciosas** quando o contexto direto, de grupo ou exclusivo da ferramenta de mensagens já controla o contrato de resposta visível. Somente o modo automático legado de grupo/canal exibe `NO_REPLY`; conversas diretas e respostas exclusivas da ferramenta de mensagens não incluem orientações sobre o token silencioso.

## Snapshots de prompt

O OpenClaw mantém snapshots de prompt versionados para o caminho ideal do tempo de execução Codex em `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Eles renderizam parâmetros selecionados de thread/turno do servidor de aplicativos, além de uma pilha reconstruída de camadas de prompt vinculadas ao modelo para turnos diretos do Telegram, de grupo do Discord e de Heartbeat: um fixture fixado de prompt do modelo Codex `gpt-5.5`, o texto de desenvolvedor de permissões do caminho ideal do Codex, instruções de desenvolvedor do OpenClaw, instruções de modo de colaboração com escopo do turno quando fornecidas pelo OpenClaw, entrada do turno do usuário e referências a especificações dinâmicas de ferramentas.

Atualize o fixture fixado do prompt do modelo Codex com `pnpm prompt:snapshots:sync-codex-model`. Por padrão, ele procura `$CODEX_HOME/models_cache.json`, depois `~/.codex/models_cache.json` e, em seguida, a convenção de checkout do mantenedor `~/code/codex/codex-rs/models-manager/models.json`; se nenhum deles existir, ele encerra sem alterar o fixture versionado. Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json` ou `models.json` específico.

Esses snapshots não são uma captura bruta, byte a byte, da solicitação à OpenAI. O Codex pode adicionar contexto do espaço de trabalho pertencente ao tempo de execução (`AGENTS.md`, contexto do ambiente, memórias, instruções de aplicativo/Plugin, instruções integradas do modo de colaboração Default) depois que o OpenClaw envia os parâmetros de thread e turno.

Gere novamente com `pnpm prompt:snapshots:gen`; verifique divergências com `pnpm prompt:snapshots:check`. A CI executa a verificação de divergência junto com os shards de limites adicionais, para que alterações no prompt e atualizações dos snapshots sejam incluídas no mesmo PR.

## Injeção de inicialização do espaço de trabalho

Os arquivos de inicialização são resolvidos a partir do espaço de trabalho ativo e encaminhados para a superfície de prompt correspondente ao seu tempo de vida:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em espaços de trabalho totalmente novos)
- `MEMORY.md` quando presente

No harness nativo do Codex, o OpenClaw evita repetir arquivos estáveis do espaço de trabalho em cada turno do usuário. O Codex carrega `AGENTS.md` por meio de sua própria descoberta de documentos do projeto. `TOOLS.md` é encaminhado como instruções de desenvolvedor herdadas do Codex. `SOUL.md`, `IDENTITY.md` e `USER.md` são encaminhados como instruções de desenvolvedor de colaboração com escopo do turno, para que subagentes nativos do Codex não as herdem. O conteúdo de `HEARTBEAT.md` não é injetado diretamente; os turnos de Heartbeat recebem uma observação do modo de colaboração apontando para o arquivo quando ele existe e não está vazio. O conteúdo de `MEMORY.md` também não é inserido em todos os turnos nativos do Codex: quando ferramentas de memória estão disponíveis para o espaço de trabalho, os turnos do Codex recebem uma breve observação sobre a memória do espaço de trabalho, orientando o modelo a usar `memory_search` ou `memory_get`. Se as ferramentas estiverem desabilitadas, a pesquisa de memória estiver indisponível ou o espaço de trabalho ativo for diferente do espaço de trabalho de memória do agente, `MEMORY.md` recorre ao caminho normal de contexto limitado do turno. `BOOTSTRAP.md` mantém a função normal de contexto do turno.

Em harnesses que não sejam Codex, os arquivos de inicialização são incorporados ao prompt do OpenClaw de acordo com suas condições existentes. `HEARTBEAT.md` é omitido em execuções normais quando Heartbeats estão desabilitados para o agente padrão ou `agents.defaults.heartbeat.includeSystemPromptSection` é falso. Mantenha os arquivos injetados concisos, especialmente `MEMORY.md` fora do Codex: ele deve permanecer um resumo selecionado de longo prazo, com observações diárias detalhadas em `memory/*.md`, recuperáveis sob demanda por `memory_search` / `memory_get`. Arquivos `MEMORY.md` muito grandes fora do Codex aumentam o uso do prompt e podem ser injetados parcialmente de acordo com os limites de arquivos de inicialização abaixo.

<Note>
Os arquivos diários `memory/*.md` **não** fazem parte do Contexto do projeto normal de inicialização. Em turnos comuns, eles são acessados sob demanda por `memory_search` / `memory_get`, portanto não consomem a janela de contexto a menos que o modelo os leia explicitamente. Turnos sem conteúdo de `/new` e `/reset` são a exceção: o tempo de execução pode inserir a memória diária recente no início como um bloco de contexto de inicialização usado uma única vez nesse primeiro turno.
</Note>

Arquivos grandes são truncados com um marcador:

| Limite                                      | Chave de configuração                               | Padrão   |
| ------------------------------------------- | --------------------------------------------------- | -------- |
| Máximo de caracteres por arquivo            | `agents.defaults.bootstrapMaxChars`                 | 20000    |
| Total entre todos os arquivos               | `agents.defaults.bootstrapTotalMaxChars`            | 60000    |
| Aviso de truncamento (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Arquivos ausentes injetam um breve marcador de arquivo ausente. Contagens brutas/injetadas detalhadas permanecem nos diagnósticos, como `/context`, `/status`, doctor e logs.

Para arquivos de memória, o truncamento não representa perda de dados: o arquivo permanece intacto no disco. No Codex nativo, `MEMORY.md` é lido sob demanda por meio das ferramentas de memória, quando disponíveis, com um fallback de prompt limitado nos demais casos. Em outros harnesses, o modelo vê somente a cópia injetada abreviada até ler ou pesquisar diretamente na memória. Se `MEMORY.md` for truncado repetidamente, condense-o em um resumo permanente mais curto, mova o histórico detalhado para `memory/*.md` ou aumente intencionalmente os limites de inicialização.

As sessões de subagentes injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de inicialização são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa por meio do evento `agent:bootstrap` para modificar ou substituir os arquivos de inicialização injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Para soar menos genérico, comece pelo [Guia de personalidade do SOUL.md](/pt-BR/concepts/soul).

Para verificar quanto cada arquivo injetado contribui (conteúdo bruto em comparação com o injetado, truncamento e sobrecarga do esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de horário

A seção **Data e hora atuais** aparece somente quando o fuso horário do usuário é conhecido e inclui apenas o **fuso horário** (sem relógio dinâmico nem formato de hora), para manter estável o cache do prompt.

Use `session_status` quando o agente precisar do horário atual; o cartão de status inclui uma linha com o carimbo de data e hora. A mesma ferramenta também pode definir opcionalmente uma substituição de modelo por sessão (`model=default` a remove).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Fusos horários](/pt-BR/concepts/timezone) e [Data e hora](/pt-BR/date-time) para obter todos os detalhes do comportamento.

## Skills

Quando existem Skills qualificadas, o OpenClaw injeta uma lista compacta `<available_skills>` (`formatSkillsForPrompt`) com o **caminho do arquivo** e um marcador `<version>sha256:...</version>` derivado do conteúdo para cada Skill. O prompt instrui o modelo a usar `read` para carregar o SKILL.md no local indicado (espaço de trabalho, gerenciado ou integrado) e reler uma Skill quando seu `<version>` for diferente do turno anterior. Se nenhuma Skill for qualificada, a seção Skills será omitida.

Os turnos nativos do Codex recebem essa lista como instruções de desenvolvedor de colaboração específicas do turno, em vez de entrada do usuário por turno, exceto em turnos leves do cron que preservam exatamente o prompt agendado. Outros ambientes de execução mantêm a seção normal do prompt.

O local pode apontar para uma Skill aninhada, como `skills/personal/foo/SKILL.md`. O aninhamento serve apenas para organização; o prompt usa o nome simples da Skill definido no frontmatter de `SKILL.md`.

A qualificação inclui critérios de metadados da Skill, verificações de ambiente/configuração de execução e a lista efetiva de Skills permitidas para o agente quando `agents.defaults.skills` ou `agents.list[].skills` está configurado. Skills incluídas em Plugins são qualificadas somente quando o Plugin proprietário está habilitado, permitindo que Plugins de ferramentas exponham guias operacionais mais detalhados sem incorporar todas essas orientações em cada descrição de ferramenta.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Isso mantém pequeno o prompt-base e, ao mesmo tempo, permite o uso direcionado de Skills. O dimensionamento é responsabilidade do subsistema de Skills, separado do dimensionamento genérico de leitura/injeção em tempo de execução:

| Escopo     | Orçamento do prompt de Skills                     | Orçamento de trechos em tempo de execução |
| ---------- | ------------------------------------------------- | ----------------------------------------- |
| Global     | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*`         |
| Por agente | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`           |

O orçamento de trechos em tempo de execução abrange `memory_get`, resultados de ferramentas em tempo real e atualizações de `AGENTS.md` após a Compaction.

## Documentação

A seção **Documentação** aponta para a documentação local quando disponível (`docs/` em um checkout do Git ou a documentação incluída no pacote npm), recorrendo a [https://docs.openclaw.ai](https://docs.openclaw.ai) caso contrário. Ela também informa a localização do código-fonte do OpenClaw: checkouts do Git exibem a raiz local do código-fonte, enquanto instalações de pacotes recebem a URL do código-fonte no GitHub com instruções para consultá-lo quando a documentação estiver incompleta ou desatualizada.

O prompt apresenta a documentação como a fonte oficial para o conhecimento do OpenClaw sobre si mesmo antes de o modelo compreender como o OpenClaw funciona (memória/anotações diárias, sessões, ferramentas, Gateway, configuração, comandos e contexto do projeto) e instrui o modelo a tratar `AGENTS.md`, o contexto do projeto, as anotações de espaço de trabalho/perfil/memória e `memory_search` como contexto de instruções ou memória do usuário, e não como conhecimento sobre o projeto ou a implementação do OpenClaw. Se a documentação for omissa ou estiver desatualizada, o modelo deve informar isso e consultar o código-fonte. O prompt também instrui o modelo a executar `openclaw status` por conta própria sempre que possível, perguntando ao usuário somente quando não tiver acesso.

Especificamente para configuração, ele orienta os agentes a usar a ação `config.schema.lookup` da ferramenta `gateway` para obter a documentação e as restrições exatas de cada campo e, depois, consultar `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` para obter orientações mais abrangentes.

## Relacionados

- [Execução do agente](/pt-BR/concepts/agent)
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
