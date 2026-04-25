---
read_when:
    - Alterando o runtime do agente, o bootstrap do workspace ou o comportamento da sessão
summary: Runtime do agente, contrato do workspace e bootstrap de sessão
title: Runtime do agente
x-i18n:
    generated_at: "2026-04-25T13:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

O OpenClaw executa um **único runtime de agente embutido** — um processo de agente por
Gateway, com seu próprio workspace, arquivos de bootstrap e armazenamento de sessão. Esta página
cobre esse contrato de runtime: o que o workspace precisa conter, quais arquivos são
injetados e como as sessões fazem bootstrap com base nele.

## Workspace (obrigatório)

O OpenClaw usa um único diretório de workspace do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `openclaw setup` para criar `~/.openclaw/openclaw.json` se estiver ausente e inicializar os arquivos do workspace.

Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver ativado, sessões que não sejam a principal podem sobrescrever isso com
workspaces por sessão em `agents.defaults.sandbox.workspaceRoot` (consulte
[Configuração do Gateway](/pt-BR/gateway/configuration)).

## Arquivos de bootstrap (injetados)

Dentro de `agents.defaults.workspace`, o OpenClaw espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` — instruções operacionais + “memória”
- `SOUL.md` — persona, limites, tom
- `TOOLS.md` — observações sobre ferramentas mantidas pelo usuário (por exemplo `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` — ritual único da primeira execução (excluído após a conclusão)
- `IDENTITY.md` — nome/vibe/emoji do agente
- `USER.md` — perfil do usuário + forma de tratamento preferida

No primeiro turno de uma nova sessão, o OpenClaw injeta o conteúdo desses arquivos diretamente no contexto do agente.

Arquivos em branco são ignorados. Arquivos grandes são reduzidos e truncados com um marcador para que os prompts permaneçam enxutos (leia o arquivo para ver o conteúdo completo).

Se um arquivo estiver ausente, o OpenClaw injeta uma única linha de marcador de “arquivo ausente” (e `openclaw setup` criará um template padrão seguro).

`BOOTSTRAP.md` só é criado para um **workspace totalmente novo** (sem outros arquivos de bootstrap presentes). Se você o excluir após concluir o ritual, ele não deverá ser recriado em reinicializações posteriores.

Para desativar completamente a criação de arquivos de bootstrap (para workspaces pré-preenchidos), defina:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ferramentas integradas

Ferramentas centrais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlado por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; ele é uma
orientação sobre como _você_ quer que elas sejam usadas.

## Skills

O OpenClaw carrega Skills destes locais (maior precedência primeiro):

- Workspace: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills de agente pessoais: `~/.agents/skills`
- Gerenciadas/locais: `~/.openclaw/skills`
- Integradas (enviadas com a instalação)
- Pastas extras de Skills: `skills.load.extraDirs`

Skills podem ser controladas por config/env (consulte `skills` em [Configuração do Gateway](/pt-BR/gateway/configuration)).

## Limites do runtime

O runtime de agente embutido é construído sobre o núcleo do agente Pi (modelos, ferramentas e
pipeline de prompt). Gerenciamento de sessão, descoberta, conexão de ferramentas e entrega por canal
são camadas controladas pelo OpenClaw sobre esse núcleo.

## Sessões

As transcrições de sessão são armazenadas como JSONL em:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenClaw.
Pastas de sessão legadas de outras ferramentas não são lidas.

## Direcionamento durante streaming

Quando o modo de fila é `steer`, mensagens recebidas são injetadas na execução atual.
O direcionamento enfileirado é entregue **depois que o turno atual do assistente termina
de executar suas chamadas de ferramenta**, antes da próxima chamada ao LLM. O direcionamento não ignora mais
as chamadas de ferramenta restantes da mensagem atual do assistente; em vez disso, ele injeta a mensagem
enfileirada no próximo limite do modelo.

Quando o modo de fila é `followup` ou `collect`, mensagens recebidas são mantidas até que o
turno atual termine; então um novo turno do agente começa com as cargas enfileiradas. Consulte
[Fila](/pt-BR/concepts/queue) para o comportamento de modo + debounce/limite.

O streaming em bloco envia blocos concluídos do assistente assim que terminam; ele fica
**desativado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite com `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; o padrão é text_end).
Controle o chunking suave de blocos com `agents.defaults.blockStreamingChunk` (padrão de
800–1200 caracteres; prefere quebras de parágrafo, depois novas linhas; frases por último).
Agrupe chunks transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (mesclagem baseada em inatividade antes do envio). Canais que não sejam Telegram exigem
`*.blockStreaming: true` explícito para ativar respostas em bloco.
Resumos detalhados de ferramentas são emitidos no início da ferramenta (sem debounce); a Control UI
transmite a saída da ferramenta por eventos do agente quando disponível.
Mais detalhes: [Streaming + chunking](/pt-BR/concepts/streaming).

## Referências de modelo

As referências de modelo em config (por exemplo `agents.defaults.model` e `agents.defaults.models`) são analisadas dividindo pelo **primeiro** `/`.

- Use `provider/model` ao configurar modelos.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma
  correspondência exclusiva de provedor configurado para aquele id exato de modelo, e só então faz fallback
  para o provedor padrão configurado. Se esse provedor não expuser mais o
  modelo padrão configurado, o OpenClaw faz fallback para o primeiro
  provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_Próximo: [Chats em grupo](/pt-BR/channels/group-messages)_ 🦞

## Relacionados

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Roteamento com vários agentes](/pt-BR/concepts/multi-agent)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
