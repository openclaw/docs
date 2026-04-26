---
read_when:
    - Editando texto do prompt de sistema, lista de ferramentas ou seções de hora/Heartbeat
    - Alterando o comportamento de bootstrap do workspace ou injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt de sistema
x-i18n:
    generated_at: "2026-04-26T11:27:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

O OpenClaw monta um prompt de sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução do agente.

Plugins de provedor podem contribuir com orientações de prompt compatíveis com cache sem substituir
o prompt completo de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite do cache de prompt
- injetar um **sufixo dinâmico** abaixo do limite do cache de prompt

Use contribuições de propriedade do provedor para ajuste específico de famílias de modelo. Mantenha a mutação legada de prompt `before_prompt_build` para compatibilidade ou para mudanças de prompt realmente globais, não para comportamento normal de provedor.

A sobreposição da família OpenAI GPT-5 mantém a regra central de execução pequena e adiciona
orientações específicas do modelo para fixação de persona, saída concisa, disciplina no uso de ferramentas,
consulta paralela, cobertura de entregáveis, verificação, contexto ausente e
higiene de ferramenta de terminal.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete da fonte da verdade para ferramentas estruturadas mais orientação em tempo de execução para uso de ferramentas.
- **Viés de execução**: orientação compacta de continuidade: agir no mesmo turno sobre
  solicitações acionáveis, continuar até concluir ou bloquear, recuperar-se de resultados fracos de ferramenta,
  verificar estado mutável ao vivo e confirmar antes de finalizar.
- **Segurança**: lembrete curto de guarda-corpo para evitar comportamento de busca de poder ou contorno de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança com
  `config.schema.lookup`, corrigir a configuração com `config.patch`, substituir a configuração completa por
  `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário. A
  ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do workspace (injetados)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando ativado): indica runtime em sandbox, caminhos do sandbox e se exec elevado está disponível.
- **Data e hora atuais**: hora local do usuário, fuso horário e formato de hora.
- **Tags de resposta**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de Heartbeat e comportamento de ack, quando Heartbeat está ativado para o agente padrão.
- **Runtime**: host, SO, node, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível atual de visibilidade + dica de alternância `/reasoning`.

A seção Ferramentas também inclui orientação em tempo de execução para trabalhos de longa duração:

- use Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de espera com `exec`, truques de atraso com `yieldMs` ou polling repetido de `process`
- use `exec` / `process` apenas para comandos que começam agora e continuam executando
  em segundo plano
- quando a ativação automática por conclusão estiver ativada, inicie o comando uma vez e confie no
  caminho de ativação por push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão de subagente é
  baseada em push e é anunciada automaticamente de volta ao solicitante
- não faça polling de `subagents list` / `sessions_list` em loop apenas para esperar a
  conclusão

Quando a ferramenta experimental `update_plan` está ativada, Ferramentas também instrui o
modelo a usá-la apenas para trabalho não trivial de várias etapas, manter exatamente uma
etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

Os guarda-corpos de segurança no prompt de sistema são orientativos. Eles orientam o comportamento do modelo, mas não aplicam política. Use política de ferramentas, aprovações de exec, sandboxing e allowlists de canal para aplicação rígida; operadores podem desativá-los por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora diz ao
agente para depender primeiro dessa UI nativa de aprovação. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações por chat estão indisponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de memória**, **Autoatualização do OpenClaw**, **Aliases de modelo**, **Identidade do usuário**, **Tags de resposta**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e hora atuais (quando conhecidas), Runtime e contexto
  injetado continuam disponíveis.
- `none`: retorna apenas a linha base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto do subagente**
em vez de **Contexto de chat em grupo**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são aparados e anexados em **Contexto do projeto** para que o modelo veja o contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em workspaces totalmente novos)
- `MEMORY.md` quando presente

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
se aplique um bloqueio específico do arquivo. `HEARTBEAT.md` é omitido em execuções normais quando
Heartbeats estão desativados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos
injetados concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a
uso inesperadamente alto de contexto e Compaction mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** fazem parte do bootstrap normal do
> Contexto do projeto. Em turnos comuns, eles são acessados sob demanda via as
> ferramentas `memory_search` e `memory_get`, então não contam para a janela de
> contexto a menos que o modelo os leia explicitamente. Turnos simples `/new` e
> `/reset` são a exceção: o runtime pode prefixar memória diária recente
> como um bloco único de contexto de inicialização para esse primeiro turno.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap
injetado entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Contexto do projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar essa etapa via `agent:bootstrap` para alterar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com o
[Guia de personalidade SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs injetado, truncamento, além da sobrecarga do schema de ferramenta), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt de sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache de prompt estável, agora ele inclui apenas o
**fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta também pode opcionalmente definir uma substituição
de modelo por sessão (`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e hora](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando existem Skills elegíveis, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** de cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou empacotado). Se não houver Skills elegíveis, a
seção Skills é omitida.

A elegibilidade inclui bloqueios de metadados de Skill, verificações de ambiente/configuração do runtime
e a allowlist efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

Skills empacotadas por Plugin só são elegíveis quando o Plugin proprietário está ativado.
Isso permite que plugins de ferramenta exponham guias operacionais mais profundos sem incorporar
toda essa orientação diretamente em cada descrição de ferramenta.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Isso mantém o prompt base pequeno, ao mesmo tempo em que ainda permite uso direcionado de Skills.

O orçamento da lista de Skills é de propriedade do subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados de runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa separação mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção do runtime, como
`memory_get`, resultados de ferramentas ao vivo e atualização pós-Compaction de AGENTS.md.

## Documentação

O prompt de sistema inclui uma seção **Documentação**. Quando há documentação local disponível, ela
aponta para o diretório local de docs do OpenClaw (`docs/` em um checkout Git ou a documentação empacotada
do pacote npm). Se a documentação local não estiver disponível, ela usa como fallback
[https://docs.openclaw.ai](https://docs.openclaw.ai).

A mesma seção também inclui o local do código-fonte do OpenClaw. Checkouts Git expõem a raiz local
do código-fonte para que o agente possa inspecionar o código diretamente. Instalações por pacote incluem a URL
do código-fonte no GitHub e dizem ao agente para revisar o código-fonte lá sempre que a documentação estiver incompleta ou
desatualizada. O prompt também menciona o espelho público da documentação, Discord da comunidade e ClawHub
([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. Ele diz ao modelo para
consultar a documentação primeiro para comportamento, comandos, configuração ou arquitetura do OpenClaw, e para
executar `openclaw status` por conta própria quando possível (pedindo ao usuário somente quando não tiver acesso).
Especificamente para configuração, ele direciona agentes para a ação da ferramenta `gateway`
`config.schema.lookup` para documentação exata no nível de campo e restrições, e então para
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
para orientação mais ampla.

## Relacionados

- [Runtime do agente](/pt-BR/concepts/agent)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
