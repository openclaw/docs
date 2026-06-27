---
read_when:
    - Alteração do runtime do agente, da inicialização do espaço de trabalho ou do comportamento da sessão
summary: Runtime do agente, contrato do workspace e bootstrap da sessão
title: Runtime do agente
x-i18n:
    generated_at: "2026-06-27T17:23:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw executa um **único runtime de agente incorporado** - um processo de agente por
Gateway, com seu próprio workspace, arquivos de bootstrap e armazenamento de sessões. Esta página
cobre esse contrato de runtime: o que o workspace deve conter, quais arquivos são
injetados e como as sessões fazem bootstrap com base nele.

## Workspace (obrigatório)

OpenClaw usa um único diretório de workspace do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `openclaw setup` para criar `~/.openclaw/openclaw.json` se estiver ausente e inicializar os arquivos do workspace.

Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões que não sejam principais podem sobrescrever isso com
workspaces por sessão em `agents.defaults.sandbox.workspaceRoot` (consulte
[configuração do Gateway](/pt-BR/gateway/configuration)).

## Arquivos de bootstrap (injetados)

Dentro de `agents.defaults.workspace`, o OpenClaw espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` - instruções operacionais + "memória"
- `SOUL.md` - persona, limites, tom
- `TOOLS.md` - notas de ferramentas mantidas pelo usuário (por exemplo, `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` - ritual único da primeira execução (excluído após a conclusão)
- `IDENTITY.md` - nome/vibe/emoji do agente
- `USER.md` - perfil do usuário + forma de tratamento preferida

No primeiro turno de uma nova sessão, o OpenClaw injeta o conteúdo desses arquivos no Contexto do Projeto do prompt do sistema.

Arquivos em branco são ignorados. Arquivos grandes são encurtados e truncados com um marcador para que os prompts permaneçam enxutos (leia o arquivo para ver o conteúdo completo).

Se um arquivo estiver ausente, o OpenClaw injeta uma única linha de marcador de "arquivo ausente" (e `openclaw setup` criará um template padrão seguro).

`BOOTSTRAP.md` só é criado para um **workspace totalmente novo** (sem outros arquivos de bootstrap presentes). Enquanto estiver pendente, o OpenClaw o mantém no Contexto do Projeto e adiciona orientação de bootstrap ao prompt do sistema para o ritual inicial, em vez de copiá-lo para a mensagem do usuário. Se você excluí-lo após concluir o ritual, ele não deve ser recriado em reinicializações posteriores.

Depois que um workspace tiver sido observado, o OpenClaw também mantém um marcador de atestação no diretório de estado para o caminho do workspace. Se um workspace atestado recentemente desaparecer ou for apagado, a inicialização se recusará a recriar silenciosamente `BOOTSTRAP.md`; restaure o workspace ou use uma redefinição completa de onboard para que o workspace e o marcador sejam limpos juntos.

Para desabilitar completamente a criação de arquivos de bootstrap (para workspaces pré-preenchidos), defina:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ferramentas integradas

Ferramentas principais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlado por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; ele é
uma orientação sobre como _você_ quer que elas sejam usadas.

## Skills

OpenClaw carrega Skills destes locais (maior precedência primeiro):

- Workspace: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills de agente pessoais: `~/.agents/skills`
- Gerenciado/local: `~/.openclaw/skills`
- Incluído (enviado com a instalação)
- Pastas extras de Skills: `skills.load.extraDirs`

Raízes de Skills podem conter pastas agrupadas, como
`<workspace>/skills/personal/foo/SKILL.md`; a Skill ainda é exposta pelo seu
nome de frontmatter simples, por exemplo `foo`.

Skills podem ser controladas por config/env (consulte `skills` em [configuração do Gateway](/pt-BR/gateway/configuration)).

## Limites de runtime

O runtime de agente incorporado pertence ao OpenClaw: descoberta de modelos, conexão de ferramentas,
montagem de prompts, gerenciamento de sessões e entrega de canais compartilham uma única
superfície de runtime integrada.

## Sessões

Transcrições de sessão são armazenadas como JSONL em:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenClaw.
Pastas de sessões legadas de outras ferramentas não são lidas.

## Direcionamento durante streaming

Prompts de entrada que chegam no meio de uma execução são direcionados para a execução atual por padrão.
O direcionamento é entregue **depois que o turno atual do assistente termina de executar suas
chamadas de ferramenta**, antes da próxima chamada ao LLM, e não pula mais as chamadas de ferramenta restantes
da mensagem atual do assistente.

`/queue steer` é o comportamento padrão de execução ativa. `/queue followup` e
`/queue collect` fazem as mensagens esperarem por um turno posterior em vez de serem direcionadas.
`/queue interrupt` aborta a execução ativa. Consulte [Fila](/pt-BR/concepts/queue)
e [Fila de direcionamento](/pt-BR/concepts/queue-steering) para comportamento de fila e limites.

Streaming em blocos envia blocos concluídos do assistente assim que terminam; ele fica
**desativado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; o padrão é text_end).
Controle a divisão suave de blocos com `agents.defaults.blockStreamingChunk` (padrão de
800-1200 caracteres; prefere quebras de parágrafo, depois novas linhas; sentenças por último).
Agrupe chunks transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linhas únicas (mesclagem baseada em inatividade antes do envio). Canais que não sejam Telegram exigem
`*.blockStreaming: true` explícito para habilitar respostas em bloco.
Resumos verbosos de ferramentas são emitidos no início da ferramenta (sem debounce); a Control UI
transmite a saída da ferramenta por eventos do agente quando disponível.
Mais detalhes: [Streaming + divisão em chunks](/pt-BR/concepts/streaming).

## Referências de modelo

Referências de modelo na configuração (por exemplo `agents.defaults.model` e `agents.defaults.models`) são analisadas dividindo no **primeiro** `/`.

- Use `provider/model` ao configurar modelos.
- Se o ID do modelo em si contiver `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provedor configurado para esse ID de modelo exato e só então recorre ao provedor padrão configurado. Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de apresentar um padrão obsoleto de provedor removido.

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_Próximo: [Conversas em grupo](/pt-BR/channels/group-messages)_ 🦞

## Relacionado

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
