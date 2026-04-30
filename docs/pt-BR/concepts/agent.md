---
read_when:
    - Alterar o runtime do agente, o bootstrap do workspace ou o comportamento da sessão
summary: Tempo de execução do agente, contrato do espaço de trabalho e inicialização da sessão
title: Tempo de execução do agente
x-i18n:
    generated_at: "2026-04-30T09:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw executa um **único runtime de agente incorporado** — um processo de agente por
Gateway, com seu próprio espaço de trabalho, arquivos de inicialização e armazenamento de sessões. Esta página
cobre esse contrato de runtime: o que o espaço de trabalho deve conter, quais arquivos são
injetados e como as sessões são inicializadas com base nele.

## Espaço de trabalho (obrigatório)

OpenClaw usa um único diretório de espaço de trabalho do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `openclaw setup` para criar `~/.openclaw/openclaw.json` caso esteja ausente e inicializar os arquivos do espaço de trabalho.

Layout completo do espaço de trabalho + guia de backup: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões que não sejam a principal podem substituir isso com
espaços de trabalho por sessão em `agents.defaults.sandbox.workspaceRoot` (consulte
[Configuração do Gateway](/pt-BR/gateway/configuration)).

## Arquivos de inicialização (injetados)

Dentro de `agents.defaults.workspace`, o OpenClaw espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` — instruções operacionais + “memória”
- `SOUL.md` — persona, limites, tom
- `TOOLS.md` — notas de ferramentas mantidas pelo usuário (por exemplo, `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` — ritual único da primeira execução (excluído após a conclusão)
- `IDENTITY.md` — nome/vibe/emoji do agente
- `USER.md` — perfil do usuário + forma de tratamento preferida

No primeiro turno de uma nova sessão, o OpenClaw injeta o conteúdo desses arquivos diretamente no contexto do agente.

Arquivos em branco são ignorados. Arquivos grandes são aparados e truncados com um marcador para manter os prompts enxutos (leia o arquivo para ver o conteúdo completo).

Se um arquivo estiver ausente, o OpenClaw injeta uma única linha de marcador de “arquivo ausente” (e `openclaw setup` criará um modelo padrão seguro).

`BOOTSTRAP.md` é criado apenas para um **espaço de trabalho totalmente novo** (sem outros arquivos de inicialização presentes). Se você o excluir após concluir o ritual, ele não deverá ser recriado em reinicializações posteriores.

Para desabilitar completamente a criação de arquivos de inicialização (para espaços de trabalho pré-preenchidos), defina:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ferramentas integradas

Ferramentas principais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlado por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; ele é
orientação sobre como _você_ quer que elas sejam usadas.

## Skills

O OpenClaw carrega Skills destes locais (maior precedência primeiro):

- Espaço de trabalho: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills pessoais do agente: `~/.agents/skills`
- Gerenciadas/locais: `~/.openclaw/skills`
- Incluídas (distribuídas com a instalação)
- Pastas extras de Skills: `skills.load.extraDirs`

Skills podem ser controladas por configuração/env (consulte `skills` em [Configuração do Gateway](/pt-BR/gateway/configuration)).

## Limites do runtime

O runtime de agente incorporado é construído sobre o núcleo de agente Pi (modelos, ferramentas e
pipeline de prompt). Gerenciamento de sessões, descoberta, conexão de ferramentas e entrega por canal
são camadas de responsabilidade do OpenClaw sobre esse núcleo.

## Sessões

As transcrições de sessão são armazenadas como JSONL em:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenClaw.
Pastas de sessão legadas de outras ferramentas não são lidas.

## Direcionamento durante streaming

Quando o modo de fila é `steer`, mensagens recebidas são injetadas na execução atual.
O direcionamento enfileirado é entregue **depois que o turno atual do assistente termina
de executar suas chamadas de ferramentas**, antes da próxima chamada ao LLM. O Pi drena todas as mensagens
de direcionamento pendentes juntas para `steer`; o `queue` legado drena uma mensagem por
limite de modelo. O direcionamento não ignora mais as chamadas de ferramentas restantes da mensagem
atual do assistente.

Quando o modo de fila é `followup` ou `collect`, mensagens recebidas são mantidas até o
turno atual terminar; então um novo turno do agente começa com os payloads enfileirados. Consulte
[Fila](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering) para comportamento de modo
e limites.

O streaming por blocos envia blocos concluídos do assistente assim que eles terminam; ele fica
**desativado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; o padrão é text_end).
Controle a fragmentação suave de blocos com `agents.defaults.blockStreamingChunk` (padrão de
800–1200 caracteres; prefere quebras de parágrafo, depois novas linhas; frases por último).
Agregue chunks transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (mesclagem baseada em inatividade antes do envio). Canais que não sejam Telegram exigem
`*.blockStreaming: true` explícito para habilitar respostas em blocos.
Resumos verbosos de ferramentas são emitidos no início da ferramenta (sem debounce); a Control UI
transmite a saída da ferramenta via eventos do agente quando disponível.
Mais detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Referências de modelo

Referências de modelo na configuração (por exemplo, `agents.defaults.model` e `agents.defaults.models`) são analisadas dividindo na **primeira** `/`.

- Use `provider/model` ao configurar modelos.
- Se o ID do modelo em si contiver `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única
  de provedor configurado para esse ID exato de modelo e só então recorre
  ao provedor padrão configurado. Se esse provedor não expuser mais o
  modelo padrão configurado, o OpenClaw recorre ao primeiro
  provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_A seguir: [Conversas em grupo](/pt-BR/channels/group-messages)_ 🦞

## Relacionados

- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
