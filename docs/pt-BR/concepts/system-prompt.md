---
read_when:
    - Edição do texto do prompt do sistema, da lista de ferramentas ou das seções de horário/Heartbeat
    - Alteração do comportamento de inicialização do workspace ou de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-07-12T15:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

O OpenClaw cria seu próprio prompt de sistema para cada execução de agente; não há prompt padrão em tempo de execução.

A montagem tem três camadas:

- `buildAgentSystemPrompt` renderiza o prompt a partir de entradas explícitas. Ele permanece um renderizador puro e não lê diretamente a configuração global.
- `resolveAgentSystemPromptConfig` resolve os controles de prompt baseados em configuração (exibição do proprietário, dicas de TTS, aliases de modelo, modo de citação de memória, modo de delegação de subagentes) para um agente específico.
- Adaptadores de tempo de execução (incorporado, CLI, prévias de comando/exportação, Compaction) coletam informações atuais (ferramentas, estado do sandbox, recursos do canal, arquivos de contexto, contribuições de prompt do provedor) e chamam a fachada de prompt configurada.

Isso mantém as superfícies de prompt exportadas/de depuração alinhadas às execuções reais sem transformar cada detalhe do tempo de execução em um único construtor monolítico.

Plugins de provedor podem contribuir com orientações compatíveis com cache sem substituir o prompt pertencente ao OpenClaw. Um tempo de execução de provedor pode:

- substituir uma das três seções principais nomeadas: `interaction_style`, `tool_call_style`, `execution_bias`
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições pertencentes ao provedor para ajustes específicos de famílias de modelos. Reserve o hook legado `before_prompt_build` para compatibilidade ou alterações de prompt realmente globais.

A sobreposição incluída para a família OpenAI/Codex GPT-5 (`resolveGpt5SystemPromptContribution`) usa esse mecanismo: um contrato de comportamento `stablePrefix` (política de execução, disciplina de ferramentas, contrato de saída, contrato de conclusão) mais uma substituição opcional de `interaction_style` para um tom mais amigável. Ela se aplica a qualquer ID de modelo `gpt-5*` roteado pelos plugins OpenAI ou Codex, controlado por `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` ou `"off"`).

## Estrutura

O prompt é compacto, com seções fixas:

- **Ferramentas**: lembrete de que as ferramentas estruturadas são a fonte da verdade, além de orientações de uso de ferramentas em tempo de execução. Quando a ferramenta experimental `update_plan` está habilitada (`tools.experimental.planTool`), sua própria descrição acrescenta: use-a apenas para trabalhos não triviais com várias etapas, mantenha no máximo uma etapa `in_progress` e ignore-a para trabalhos simples de uma única etapa.
- **Viés de execução**: agir na mesma interação diante de solicitações acionáveis, continuar até concluir ou ficar bloqueado, recuperar-se de resultados fracos de ferramentas, verificar ao vivo estados mutáveis e validar antes de finalizar.
- **Segurança**: breve lembrete de proteção contra comportamento de busca por poder ou tentativa de contornar supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Controle do OpenClaw**: priorizar a ferramenta `gateway` para trabalhos de configuração/reinicialização; não inventar comandos da CLI.
- **Autoatualização do OpenClaw**: inspecionar a configuração com segurança usando `config.schema.lookup`, aplicar alterações com `config.patch`, substituir toda a configuração com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário. A ferramenta `gateway` voltada ao agente se recusa a reescrever `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*` que são normalizados para esses caminhos protegidos.
- **Espaço de trabalho**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local da documentação/do código-fonte e quando lê-los.
- **Arquivos do espaço de trabalho (injetados)**: informa que os arquivos de inicialização estão incluídos abaixo.
- **Sandbox** (quando habilitado): tempo de execução em sandbox, caminhos do sandbox, disponibilidade de execução elevada.
- **Data e hora atuais**: somente o fuso horário (estável para cache; o relógio em tempo real vem de `session_status`).
- **Diretivas de saída do assistente**: sintaxe compacta de anexos, mensagens de voz e tags de resposta.
- **Heartbeats**: prompt de Heartbeat e comportamento de confirmação, quando Heartbeats estão habilitados para o agente padrão.
- **Tempo de execução**: host, SO, Node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível atual de visibilidade mais a dica do controle `/reasoning`.

Conteúdo estável extenso (incluindo **Contexto do projeto**) permanece acima do limite interno do cache de prompt. Seções voláteis por interação (orientações incorporadas da interface de controle, **Mensagens**, **Voz**, **Contexto de conversa em grupo**, **Reações**, **Heartbeats**, **Tempo de execução**) são acrescentadas abaixo desse limite para que backends locais com caches de prefixo possam reutilizar o prefixo estável do espaço de trabalho entre interações do canal. As descrições de ferramentas devem evitar incorporar nomes de canais atuais quando o esquema aceito já contém esse detalhe de tempo de execução.

A seção de ferramentas também contém orientações para trabalhos de longa duração:

- usar Cron para acompanhamentos futuros (`check back later`, lembretes, trabalhos recorrentes), em vez de loops de suspensão com `exec`, artifícios de atraso com `yieldMs` ou consultas repetidas com `process`
- usar `exec` / `process` somente para comandos que começam agora e continuam em segundo plano
- quando a ativação automática após a conclusão estiver habilitada, iniciar o comando uma única vez e depender do caminho de ativação baseado em push
- usar `process` para logs, status, entrada ou intervenção em um comando em execução
- para tarefas maiores, priorizar `sessions_spawn`; a conclusão do subagente é baseada em push e anunciada automaticamente ao solicitante
- não consultar `subagents list` / `sessions_list` em loop apenas para aguardar a conclusão

`agents.defaults.subagents.delegationMode` (padrão `"suggest"`) pode reforçar isso. `"prefer"` adiciona uma seção dedicada de **Delegação de subagentes**, instruindo o agente principal a atuar como coordenador responsivo e encaminhar qualquer trabalho mais elaborado que uma resposta direta por meio de `sessions_spawn`. Isso afeta apenas o prompt; a política de ferramentas ainda controla se `sessions_spawn` está disponível.

As proteções de segurança no prompt de sistema são orientativas, não mecanismos de imposição. Use a política de ferramentas, aprovações de execução, sandboxing e listas de canais permitidos para imposição rígida; por design, os operadores podem desabilitar as proteções do prompt.

Em canais com cartões/botões nativos de aprovação, o prompt instrui o agente a usar primeiro essa interface e a incluir um comando manual `/approve` somente quando o resultado da ferramenta indicar que aprovações pelo chat estão indisponíveis ou que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw renderiza prompts de sistema menores para subagentes. O tempo de execução define um `promptMode` por execução (não é uma configuração voltada ao usuário):

- `full` (padrão): todas as seções acima.
- `minimal`: usado para subagentes; omite a seção de prompt de memória (incluída como **Recuperação de memória**), **Autoatualização do OpenClaw**, **Aliases de modelo**, **Identidade do usuário**, **Diretivas de saída do assistente**, **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**, **Skills** (quando fornecidas), Espaço de trabalho, Sandbox, Data e hora atuais (quando conhecidas), Tempo de execução e contexto injetado permanecem disponíveis.
- `none`: retorna somente a linha de identidade básica.

Com `promptMode=minimal`, prompts adicionais injetados recebem o rótulo **Contexto do subagente** em vez de **Contexto de conversa em grupo**.

Para execuções de resposta automática de canais, o OpenClaw omite a seção genérica **Respostas silenciosas** quando o contexto direto, de grupo ou exclusivo da ferramenta de mensagens já controla o contrato de resposta visível. Somente o modo automático legado de grupo/canal exibe `NO_REPLY`; conversas diretas e respostas exclusivas da ferramenta de mensagens não incluem orientações sobre tokens silenciosos.

## Snapshots de prompt

O OpenClaw mantém snapshots de prompt versionados para o caminho ideal do tempo de execução do Codex em `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Eles renderizam parâmetros selecionados de thread/interação do servidor do aplicativo, além de uma pilha reconstruída de camadas de prompt vinculadas ao modelo para interações diretas no Telegram, em grupo no Discord e de Heartbeat: um fixture fixado de prompt do modelo Codex `gpt-5.5`, o texto de desenvolvedor de permissões do caminho ideal do Codex, instruções de desenvolvedor do OpenClaw, instruções de modo de colaboração limitadas à interação quando fornecidas pelo OpenClaw, entrada da interação do usuário e referências a especificações dinâmicas de ferramentas.

Atualize o fixture fixado de prompt do modelo Codex com `pnpm prompt:snapshots:sync-codex-model`. Por padrão, ele procura `$CODEX_HOME/models_cache.json`, depois `~/.codex/models_cache.json` e, em seguida, a convenção de checkout dos mantenedores `~/code/codex/codex-rs/models-manager/models.json`; se nenhum existir, ele encerra sem alterar o fixture versionado. Passe `--catalog <path>` para atualizar a partir de um arquivo `models_cache.json` ou `models.json` específico.

Esses snapshots não são uma captura bruta, byte a byte, da solicitação à OpenAI. O Codex pode adicionar contexto do espaço de trabalho pertencente ao tempo de execução (`AGENTS.md`, contexto do ambiente, memórias, instruções de aplicativo/plugin, instruções integradas do modo de colaboração padrão) depois que o OpenClaw envia os parâmetros da thread e da interação.

Gere novamente com `pnpm prompt:snapshots:gen`; verifique divergências com `pnpm prompt:snapshots:check`. A CI executa a verificação de divergência junto aos shards de limites adicionais, portanto as alterações de prompt e as atualizações de snapshots entram no mesmo PR.

## Injeção da inicialização do espaço de trabalho

Os arquivos de inicialização são resolvidos a partir do espaço de trabalho ativo e encaminhados à superfície de prompt correspondente à sua duração:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em espaços de trabalho totalmente novos)
- `MEMORY.md` quando presente

No harness nativo do Codex, o OpenClaw evita repetir arquivos estáveis do espaço de trabalho em cada interação do usuário. O Codex carrega `AGENTS.md` por meio de sua própria descoberta de documentação do projeto. `TOOLS.md` é encaminhado como instruções de desenvolvedor herdadas do Codex. `SOUL.md`, `IDENTITY.md` e `USER.md` são encaminhados como instruções de desenvolvedor de colaboração limitadas à interação, para que subagentes nativos do Codex não as herdem. O conteúdo de `HEARTBEAT.md` não é injetado diretamente; interações de Heartbeat recebem uma observação do modo de colaboração apontando para o arquivo quando ele existe e não está vazio. O conteúdo de `MEMORY.md` também não é colado em cada interação nativa do Codex: quando ferramentas de memória estão disponíveis para o espaço de trabalho, as interações do Codex recebem uma breve observação sobre a memória do espaço de trabalho, direcionando o modelo para `memory_search` ou `memory_get`. Se as ferramentas estiverem desabilitadas, a pesquisa de memória estiver indisponível ou o espaço de trabalho ativo for diferente do espaço de trabalho de memória do agente, `MEMORY.md` recorre ao caminho normal e limitado de contexto da interação. `BOOTSTRAP.md` mantém a função normal de contexto da interação.

Em harnesses que não sejam do Codex, os arquivos de inicialização são incorporados ao prompt do OpenClaw conforme suas condições existentes. `HEARTBEAT.md` é omitido em execuções normais quando Heartbeats estão desabilitados para o agente padrão ou `agents.defaults.heartbeat.includeSystemPromptSection` é falso. Mantenha os arquivos injetados concisos, especialmente `MEMORY.md` fora do Codex: ele deve permanecer um resumo selecionado de longo prazo, com observações diárias detalhadas em `memory/*.md`, recuperáveis sob demanda por meio de `memory_search` / `memory_get`. Arquivos `MEMORY.md` fora do Codex excessivamente grandes aumentam o uso do prompt e podem ser injetados parcialmente conforme os limites de arquivos de inicialização abaixo.

<Note>
Os arquivos diários `memory/*.md` **não** fazem parte do Contexto do projeto de inicialização normal. Em interações comuns, eles são acessados sob demanda por meio de `memory_search` / `memory_get`, portanto não contam para a janela de contexto, a menos que o modelo os leia explicitamente. Interações simples de `/new` e `/reset` são a exceção: o tempo de execução pode adicionar memórias diárias recentes no início como um bloco único de contexto de inicialização para essa primeira interação.
</Note>

Arquivos grandes são truncados com um marcador:

| Limite                                       | Chave de configuração                                | Padrão   |
| -------------------------------------------- | ---------------------------------------------------- | -------- |
| Máximo de caracteres por arquivo             | `agents.defaults.bootstrapMaxChars`                  | 20000    |
| Total em todos os arquivos                   | `agents.defaults.bootstrapTotalMaxChars`             | 60000    |
| Aviso de truncamento (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Arquivos ausentes injetam um breve marcador de arquivo ausente. As contagens brutas/injetadas detalhadas permanecem em diagnósticos como `/context`, `/status`, doctor e logs.

Para arquivos de memória, o truncamento não representa perda de dados: o arquivo permanece intacto no disco. No Codex nativo, `MEMORY.md` é lido sob demanda por meio das ferramentas de memória quando disponíveis, com uma alternativa limitada no prompt nos demais casos. Em outros harnesses, o modelo vê apenas a cópia injetada reduzida até ler ou pesquisar diretamente na memória. Se `MEMORY.md` for truncado repetidamente, sintetize-o em um resumo durável mais curto, mova o histórico detalhado para `memory/*.md` ou aumente intencionalmente os limites de inicialização.

As sessões de subagentes injetam apenas `AGENTS.md` e `TOOLS.md` (os outros arquivos de inicialização são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa por meio do evento `agent:bootstrap` para modificar ou substituir os arquivos de inicialização injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Para soar menos genérico, comece pelo [Guia de personalidade do SOUL.md](/pt-BR/concepts/soul).

Para verificar quanto cada arquivo injetado contribui (conteúdo bruto em comparação ao injetado, truncamento e sobrecarga do esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de horário

A seção **Data e hora atuais** aparece somente quando o fuso horário do usuário é conhecido e inclui apenas o **fuso horário** (sem relógio dinâmico nem formato de hora), para manter o cache do prompt estável.

Use `session_status` quando o agente precisar da hora atual; o cartão de status inclui uma linha com o carimbo de data e hora. A mesma ferramenta pode, opcionalmente, definir uma substituição de modelo por sessão (`model=default` a remove).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Fusos horários](/pt-BR/concepts/timezone) e [Data e hora](/pt-BR/date-time) para obter detalhes completos sobre o comportamento.

## Skills

Quando existem Skills qualificadas, o OpenClaw injeta uma lista compacta `<available_skills>` (`formatSkillsForPrompt`) com o **caminho do arquivo** e um marcador `<version>sha256:...</version>` derivado do conteúdo para cada Skill. O prompt instrui o modelo a usar `read` para carregar o SKILL.md no local indicado (no espaço de trabalho, gerenciado ou incluído no pacote) e a reler uma Skill quando seu `<version>` for diferente do turno anterior. Se nenhuma Skill estiver qualificada, a seção Skills será omitida.

Os turnos nativos do Codex recebem essa lista como instruções de desenvolvedor para colaboração limitadas ao turno, em vez de entrada do usuário a cada turno, exceto turnos leves de cron que preservam exatamente o prompt agendado. Outros ambientes de execução mantêm a seção normal do prompt.

O local pode apontar para uma Skill aninhada, como `skills/personal/foo/SKILL.md`. O aninhamento serve apenas para organização; o prompt usa o nome simples da Skill definido no frontmatter de `SKILL.md`.

A qualificação inclui restrições de metadados da Skill, verificações do ambiente de execução e da configuração e a lista efetiva de Skills permitidas para o agente quando `agents.defaults.skills` ou `agents.list[].skills` estiver configurado. As Skills incluídas em Plugins só são qualificadas quando o Plugin ao qual pertencem está habilitado, permitindo que Plugins de ferramentas disponibilizem guias operacionais mais detalhados sem incorporar toda essa orientação em cada descrição de ferramenta.

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

Isso mantém o prompt-base pequeno e, ao mesmo tempo, permite o uso direcionado de Skills. O dimensionamento é responsabilidade do subsistema de Skills, separadamente do dimensionamento genérico de leitura/injeção em tempo de execução:

| Escopo     | Orçamento do prompt de Skills                       | Orçamento de trechos em tempo de execução |
| ---------- | --------------------------------------------------- | ----------------------------------------- |
| Global     | `skills.limits.maxSkillsPromptChars`                | `agents.defaults.contextLimits.*`         |
| Por agente | `agents.list[].skillsLimits.maxSkillsPromptChars`   | `agents.list[].contextLimits.*`           |

O orçamento de trechos em tempo de execução abrange `memory_get`, resultados de ferramentas em tempo real e atualizações de `AGENTS.md` após a Compaction.

## Documentação

A seção **Documentação** aponta para a documentação local quando disponível (`docs/` em um checkout do Git ou a documentação incluída no pacote npm), usando [https://docs.openclaw.ai](https://docs.openclaw.ai) como alternativa. Ela também lista o local do código-fonte do OpenClaw: checkouts do Git expõem a raiz local do código-fonte, enquanto instalações do pacote recebem a URL do código-fonte no GitHub, com instruções para analisar o código-fonte nesse local quando a documentação estiver incompleta ou desatualizada.

O prompt apresenta a documentação como a fonte oficial para o autoconhecimento do OpenClaw antes que o modelo compreenda como o OpenClaw funciona (memória/notas diárias, sessões, ferramentas, Gateway, configuração, comandos e contexto do projeto) e orienta o modelo a tratar `AGENTS.md`, o contexto do projeto, as notas de espaço de trabalho/perfil/memória e `memory_search` como contexto de instruções ou memória do usuário, e não como conhecimento sobre o projeto ou a implementação do OpenClaw. Se a documentação não abordar o assunto ou estiver desatualizada, o modelo deve informar isso e analisar o código-fonte. O prompt também orienta o modelo a executar `openclaw status` por conta própria quando possível, solicitando isso ao usuário somente quando não tiver acesso.

Especificamente para configuração, ele orienta os agentes a usar a ação `config.schema.lookup` da ferramenta `gateway` para obter documentação e restrições exatas de cada campo e, em seguida, consultar `docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md` para obter orientações mais abrangentes.

## Relacionados

- [Ambiente de execução do agente](/pt-BR/concepts/agent)
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
