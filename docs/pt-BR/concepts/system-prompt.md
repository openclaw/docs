---
read_when:
    - Editando o texto do prompt de sistema, a lista de ferramentas ou seções de horário/heartbeat
    - Alterando o bootstrap do workspace ou o comportamento de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt de Sistema
x-i18n:
    generated_at: "2026-04-06T03:07:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt de Sistema

O OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt com reconhecimento de cache sem substituir o prompt completo de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provedor para ajuste específico de famílias de modelos. Mantenha a mutação legada de prompt `before_prompt_build` para compatibilidade ou para alterações de prompt realmente globais, não para comportamento normal do provedor.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Tooling**: lembrete da fonte da verdade de ferramentas estruturadas mais orientações de runtime para uso de ferramentas.
- **Safety**: lembrete curto de guardrails para evitar comportamento de busca de poder ou contornar supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **OpenClaw Self-Update**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, aplicar patches na configuração com `config.patch`, substituir a configuração completa com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário. A ferramenta `gateway`, exclusiva do owner, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentation**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando consultá-la.
- **Workspace Files (injected)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos da sandbox e se exec com privilégios elevados está disponível.
- **Current Date & Time**: horário local do usuário, fuso horário e formato de hora.
- **Reply Tags**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de heartbeat e comportamento de ack.
- **Runtime**: host, SO, node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Reasoning**: nível atual de visibilidade + dica de alternância `/reasoning`.

A seção Tooling também inclui orientações de runtime para trabalhos de longa duração:

- usar cron para acompanhamento futuro (`volte mais tarde`, lembretes, trabalho recorrente)
  em vez de loops de sleep com `exec`, truques de atraso com `yieldMs` ou polling repetido com `process`
- usar `exec` / `process` apenas para comandos que começam agora e continuam em execução
  em segundo plano
- quando o wake automático na conclusão está habilitado, iniciar o comando uma vez e confiar
  no caminho de wake baseado em envio quando ele emitir saída ou falhar
- usar `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, preferir `sessions_spawn`; a conclusão do subagente é
  baseada em envio e anunciada automaticamente de volta ao solicitante
- não fazer polling de `subagents list` / `sessions_list` em loop apenas para esperar
  a conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Tooling também informa ao modelo para usá-la apenas em trabalhos não triviais de várias etapas, manter exatamente uma etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

Os guardrails de Safety no prompt de sistema são consultivos. Eles orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e listas de permissão de canais para imposição rígida; por design, operadores podem desabilitar esses mecanismos.

Em canais com cartões/botões nativos de aprovação, o prompt de runtime agora informa ao agente para confiar primeiro nessa UI nativa de aprovação. Ele só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser que aprovações por chat não estão disponíveis ou que aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando conhecido), Runtime e
  contexto injetado permanecem disponíveis.
- `none`: retorna apenas a linha base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Subagent
Context** em vez de **Group Chat Context**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são recortados e anexados em **Project Context** para que o modelo veja o contexto de identidade e perfil sem precisar lê-los explicitamente:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em workspaces totalmente novos)
- `MEMORY.md` quando presente; caso contrário, `memory.md` como fallback em minúsculas

Todos esses arquivos são **injetados na janela de contexto** em todos os turnos, o que significa que consomem tokens. Mantenha-os concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a uso de contexto inesperadamente alto e compactação mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** são injetados automaticamente. Eles
> são acessados sob demanda por meio das ferramentas `memory_search` e `memory_get`, então não contam na janela de contexto a menos que o modelo os leia explicitamente.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 20000). O conteúdo total de bootstrap injetado
entre os arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 150000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Project Context; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de Personalidade do SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além da sobrecarga do schema da ferramenta), use `/context list` ou `/context detail`. Consulte [Context](/pt-BR/concepts/context).

## Tratamento de horário

O prompt de sistema inclui uma seção dedicada **Current Date & Time** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui apenas
o **fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta também pode opcionalmente definir uma substituição
de modelo por sessão (`model=default` a remove).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Data e Hora](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando há Skills elegíveis, o OpenClaw injeta uma **lista compacta de skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou empacotado). Se nenhuma Skill for elegível, a seção
Skills é omitida.

A elegibilidade inclui gates de metadados de Skills, verificações de ambiente/config de runtime
e a allowlist efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

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

## Documentation

Quando disponível, o prompt de sistema inclui uma seção **Documentation** que aponta para o
diretório local da documentação do OpenClaw (seja `docs/` no workspace do repositório ou a documentação do
pacote npm empacotado) e também menciona o espelho público, o repositório de origem, o Discord da comunidade e o
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. O prompt instrui o modelo a consultar primeiro a documentação local
para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar
`openclaw status` por conta própria quando possível (pedindo ao usuário apenas quando não tiver acesso).
