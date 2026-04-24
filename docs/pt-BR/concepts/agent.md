---
read_when:
    - Alterando o runtime do agente, o bootstrap do workspace ou o comportamento da sessão
summary: Runtime do agente, contrato do workspace e bootstrap da sessão
title: Runtime do agente
x-i18n:
    generated_at: "2026-04-24T05:47:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

O OpenClaw executa um **único runtime de agente embutido** — um processo de agente por
Gateway, com seu próprio workspace, arquivos de bootstrap e armazenamento de sessão. Esta página
cobre esse contrato de runtime: o que o workspace deve conter, quais arquivos são
injetados e como as sessões fazem bootstrap com base nisso.

## Workspace (obrigatório)

O OpenClaw usa um único diretório de workspace do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `openclaw setup` para criar `~/.openclaw/openclaw.json` se ele estiver ausente e inicializar os arquivos do workspace.

Layout completo do workspace + guia de backup: [Agent workspace](/pt-BR/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões não principais podem sobrescrever isso com
workspaces por sessão em `agents.defaults.sandbox.workspaceRoot` (consulte
[Gateway configuration](/pt-BR/gateway/configuration)).

## Arquivos de bootstrap (injetados)

Dentro de `agents.defaults.workspace`, o OpenClaw espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` — instruções operacionais + “memória”
- `SOUL.md` — persona, limites, tom
- `TOOLS.md` — observações de ferramentas mantidas pelo usuário (por exemplo `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` — ritual único da primeira execução (excluído após a conclusão)
- `IDENTITY.md` — nome/vibe/emoji do agente
- `USER.md` — perfil do usuário + forma preferida de tratamento

No primeiro turno de uma nova sessão, o OpenClaw injeta o conteúdo desses arquivos diretamente no contexto do agente.

Arquivos em branco são ignorados. Arquivos grandes são recortados e truncados com um marcador para manter os prompts enxutos (leia o arquivo para ver o conteúdo completo).

Se um arquivo estiver ausente, o OpenClaw injeta uma única linha marcadora de “arquivo ausente” (e `openclaw setup` criará um template padrão seguro).

`BOOTSTRAP.md` só é criado para um **workspace totalmente novo** (nenhum outro arquivo de bootstrap presente). Se você excluí-lo após concluir o ritual, ele não deverá ser recriado em reinicializações posteriores.

Para desabilitar totalmente a criação de arquivos de bootstrap (para workspaces já preparados), defina:

```json5
{ agent: { skipBootstrap: true } }
```

## Ferramentas integradas

Ferramentas principais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlado por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; ele é
uma orientação sobre como _você_ quer que elas sejam usadas.

## Skills

O OpenClaw carrega Skills destes locais (maior precedência primeiro):

- Workspace: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills pessoais de agente: `~/.agents/skills`
- Gerenciadas/locais: `~/.openclaw/skills`
- Empacotadas (enviadas com a instalação)
- Pastas extras de Skills: `skills.load.extraDirs`

As Skills podem ser controladas por config/env (consulte `skills` em [Gateway configuration](/pt-BR/gateway/configuration)).

## Limites do runtime

O runtime do agente embutido é construído sobre o núcleo de agente Pi (modelos, ferramentas e
pipeline de prompt). Gerenciamento de sessão, descoberta, ligação de ferramentas e
entrega por canal são camadas do OpenClaw sobre esse núcleo.

## Sessões

Transcrições de sessão são armazenadas como JSONL em:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenClaw.
Pastas de sessão legadas de outras ferramentas não são lidas.

## Direcionamento durante streaming

Quando o modo de fila é `steer`, mensagens recebidas são injetadas na execução atual.
O direcionamento enfileirado é entregue **depois que o turno atual do assistente termina
de executar suas chamadas de ferramenta**, antes da próxima chamada ao LLM. O direcionamento não
ignora mais chamadas de ferramenta restantes da mensagem atual do assistente; ele injeta a mensagem
enfileirada no próximo limite do modelo.

Quando o modo de fila é `followup` ou `collect`, mensagens recebidas são mantidas até o
fim do turno atual, então um novo turno de agente começa com as cargas enfileiradas. Consulte
[Queue](/pt-BR/concepts/queue) para o comportamento de modo + debounce/limite.

O block streaming envia blocos completos do assistente assim que são concluídos; ele fica
**desabilitado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite com `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; o padrão é text_end).
Controle a fragmentação suave de blocos com `agents.defaults.blockStreamingChunk` (o padrão é
800–1200 caracteres; prefere quebras de parágrafo, depois novas linhas; frases por último).
Una chunks transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (mesclagem baseada em inatividade antes do envio). Canais que não sejam Telegram exigem
`*.blockStreaming: true` explícito para habilitar respostas em bloco.
Resumos detalhados de ferramentas são emitidos no início da ferramenta (sem debounce); a UI Control
transmite a saída da ferramenta por eventos do agente quando disponível.
Mais detalhes: [Streaming + chunking](/pt-BR/concepts/streaming).

## Referências de modelo

Referências de modelo na configuração (por exemplo `agents.defaults.model` e `agents.defaults.models`) são analisadas dividindo no **primeiro** `/`.

- Use `provider/model` ao configurar modelos.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma
  correspondência exclusiva de provedor configurado para esse ID exato de modelo e só então usa fallback
  para o provedor padrão configurado. Se esse provedor não expuser mais o
  modelo padrão configurado, o OpenClaw usará fallback para o primeiro
  provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_Próximo: [Group Chats](/pt-BR/channels/group-messages)_ 🦞

## Relacionados

- [Agent workspace](/pt-BR/concepts/agent-workspace)
- [Multi-agent routing](/pt-BR/concepts/multi-agent)
- [Session management](/pt-BR/concepts/session)
