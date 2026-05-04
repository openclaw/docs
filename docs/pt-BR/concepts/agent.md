---
read_when:
    - Alteração do ambiente de execução do agente, da inicialização do espaço de trabalho ou do comportamento da sessão
summary: Tempo de execução do agente, contrato do ambiente de trabalho e inicialização da sessão
title: Ambiente de execução do agente
x-i18n:
    generated_at: "2026-05-04T02:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw executa um **runtime de agente incorporado único** — um processo de agente por
Gateway, com seu próprio workspace, arquivos de bootstrap e armazenamento de sessões. Esta página
cobre esse contrato de runtime: o que o workspace deve conter, quais arquivos são
injetados e como as sessões fazem bootstrap com base nele.

## Workspace (obrigatório)

OpenClaw usa um único diretório de workspace do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `openclaw setup` para criar `~/.openclaw/openclaw.json` se ele estiver ausente e inicializar os arquivos do workspace.

Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões que não sejam principais podem sobrescrever isso com
workspaces por sessão em `agents.defaults.sandbox.workspaceRoot` (consulte
[Configuração do Gateway](/pt-BR/gateway/configuration)).

## Arquivos de bootstrap (injetados)

Dentro de `agents.defaults.workspace`, OpenClaw espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` — instruções operacionais + “memória”
- `SOUL.md` — persona, limites, tom
- `TOOLS.md` — notas de ferramentas mantidas pelo usuário (por exemplo, `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` — ritual único da primeira execução (excluído após a conclusão)
- `IDENTITY.md` — nome/vibe/emoji do agente
- `USER.md` — perfil do usuário + forma preferida de tratamento

No primeiro turno de uma nova sessão, OpenClaw injeta o conteúdo desses arquivos no Contexto do Projeto do prompt do sistema.

Arquivos em branco são ignorados. Arquivos grandes são aparados e truncados com um marcador para que os prompts permaneçam enxutos (leia o arquivo para ver o conteúdo completo).

Se um arquivo estiver ausente, OpenClaw injeta uma única linha de marcador de “arquivo ausente” (e `openclaw setup` criará um modelo padrão seguro).

`BOOTSTRAP.md` só é criado para um **workspace totalmente novo** (sem outros arquivos de bootstrap presentes). Enquanto ele estiver pendente, OpenClaw o mantém no Contexto do Projeto e adiciona orientações de bootstrap ao prompt do sistema para o ritual inicial, em vez de copiá-lo para a mensagem do usuário. Se você excluí-lo depois de concluir o ritual, ele não deve ser recriado em reinicializações posteriores.

Para desabilitar totalmente a criação de arquivos de bootstrap (para workspaces pré-preenchidos), defina:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ferramentas integradas

Ferramentas principais (leitura/execução/edição/escrita e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlado por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; ele é
uma orientação sobre como _você_ quer que elas sejam usadas.

## Skills

OpenClaw carrega Skills destes locais (maior precedência primeiro):

- Workspace: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills de agente pessoais: `~/.agents/skills`
- Gerenciadas/locais: `~/.openclaw/skills`
- Incluídas (distribuídas com a instalação)
- Pastas extras de Skills: `skills.load.extraDirs`

Skills podem ser controladas por configuração/env (consulte `skills` em [Configuração do Gateway](/pt-BR/gateway/configuration)).

## Limites do runtime

O runtime de agente incorporado é construído sobre o núcleo de agente Pi (modelos, ferramentas e
pipeline de prompt). Gerenciamento de sessões, descoberta, conexão de ferramentas e entrega por canais
são camadas pertencentes ao OpenClaw sobre esse núcleo.

## Sessões

Transcrições de sessão são armazenadas como JSONL em:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenClaw.
Pastas de sessão legadas de outras ferramentas não são lidas.

## Direcionamento durante streaming

Quando o modo de fila é `steer`, mensagens de entrada são injetadas na execução atual.
O direcionamento enfileirado é entregue **depois que o turno atual do assistente termina
de executar suas chamadas de ferramenta**, antes da próxima chamada ao LLM. Pi drena todas as mensagens de
direcionamento pendentes juntas para `steer`; o `queue` legado drena uma mensagem por
limite de modelo. O direcionamento não ignora mais as chamadas de ferramenta restantes da mensagem
atual do assistente.

Quando o modo de fila é `followup` ou `collect`, mensagens de entrada são retidas até o
turno atual terminar; então, um novo turno do agente começa com os payloads enfileirados. Consulte
[Fila](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering) para o comportamento de modo
e limites.

O streaming por blocos envia blocos concluídos do assistente assim que eles terminam; ele fica
**desativado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; o padrão é text_end).
Controle a divisão suave de blocos com `agents.defaults.blockStreamingChunk` (padrão de
800 a 1200 caracteres; prefere quebras de parágrafo, depois novas linhas; frases por último).
Agrupe chunks transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (mesclagem baseada em inatividade antes do envio). Canais que não sejam Telegram exigem
`*.blockStreaming: true` explícito para habilitar respostas em bloco.
Resumos detalhados de ferramentas são emitidos no início da ferramenta (sem debounce); a UI de Controle
transmite a saída da ferramenta por eventos do agente quando disponível.
Mais detalhes: [Streaming + divisão em chunks](/pt-BR/concepts/streaming).

## Referências de modelo

Referências de modelo na configuração (por exemplo, `agents.defaults.model` e `agents.defaults.models`) são analisadas dividindo na **primeira** `/`.

- Use `provider/model` ao configurar modelos.
- Se o ID do modelo em si contiver `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, OpenClaw tenta primeiro um alias, depois uma correspondência única
  de provedor configurado para esse ID de modelo exato e só então recorre
  ao provedor padrão configurado. Se esse provedor não expuser mais o
  modelo padrão configurado, OpenClaw recorre ao primeiro
  provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_Próximo: [Conversas em grupo](/pt-BR/channels/group-messages)_ 🦞

## Relacionados

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
