---
read_when:
    - Alterar o tempo de execução do agente, a inicialização do espaço de trabalho ou o comportamento da sessão
summary: Ambiente de execução do agente, contrato do espaço de trabalho e bootstrap da sessão
title: Tempo de execução do agente
x-i18n:
    generated_at: "2026-05-06T05:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

O OpenClaw executa um **runtime de agente incorporado único** - um processo de agente por
Gateway, com seu próprio espaço de trabalho, arquivos de inicialização e armazenamento de sessões. Esta página
cobre esse contrato de runtime: o que o espaço de trabalho deve conter, quais arquivos são
injetados e como as sessões são inicializadas com base nele.

## Espaço de trabalho (obrigatório)

O OpenClaw usa um único diretório de espaço de trabalho do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `openclaw setup` para criar `~/.openclaw/openclaw.json` se estiver ausente e inicializar os arquivos do espaço de trabalho.

Layout completo do espaço de trabalho + guia de backup: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões que não sejam a principal podem substituir isso com
espaços de trabalho por sessão em `agents.defaults.sandbox.workspaceRoot` (veja
[Configuração do Gateway](/pt-BR/gateway/configuration)).

## Arquivos de inicialização (injetados)

Dentro de `agents.defaults.workspace`, o OpenClaw espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` - instruções operacionais + "memória"
- `SOUL.md` - persona, limites, tom
- `TOOLS.md` - anotações de ferramentas mantidas pelo usuário (por exemplo, `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` - ritual único de primeira execução (excluído após a conclusão)
- `IDENTITY.md` - nome/vibe/emoji do agente
- `USER.md` - perfil do usuário + forma de tratamento preferida

No primeiro turno de uma nova sessão, o OpenClaw injeta o conteúdo desses arquivos no Contexto do Projeto do prompt do sistema.

Arquivos em branco são ignorados. Arquivos grandes são reduzidos e truncados com um marcador para manter os prompts enxutos (leia o arquivo para ver o conteúdo completo).

Se um arquivo estiver ausente, o OpenClaw injeta uma única linha de marcador de "arquivo ausente" (e `openclaw setup` criará um modelo padrão seguro).

`BOOTSTRAP.md` só é criado para um **espaço de trabalho totalmente novo** (sem outros arquivos de inicialização presentes). Enquanto ele estiver pendente, o OpenClaw o mantém no Contexto do Projeto e adiciona orientações de inicialização ao prompt do sistema para o ritual inicial, em vez de copiá-lo para a mensagem do usuário. Se você o excluir após concluir o ritual, ele não deverá ser recriado em reinicializações posteriores.

Para desabilitar completamente a criação de arquivos de inicialização (para espaços de trabalho pré-preenchidos), defina:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ferramentas integradas

As ferramentas principais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlada por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; ele é
uma orientação sobre como _você_ quer que elas sejam usadas.

## Skills

O OpenClaw carrega Skills destes locais (maior precedência primeiro):

- Espaço de trabalho: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills de agente pessoais: `~/.agents/skills`
- Gerenciadas/locais: `~/.openclaw/skills`
- Incluídas no pacote (enviadas com a instalação)
- Pastas extras de Skills: `skills.load.extraDirs`

Skills podem ser controladas por config/env (veja `skills` em [Configuração do Gateway](/pt-BR/gateway/configuration)).

## Limites do runtime

O runtime de agente incorporado é criado sobre o núcleo do agente Pi (modelos, ferramentas e
pipeline de prompt). Gerenciamento de sessões, descoberta, conexão de ferramentas e entrega
por canais são camadas de propriedade do OpenClaw sobre esse núcleo.

## Sessões

Os transcripts de sessão são armazenados como JSONL em:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenClaw.
Pastas de sessão legadas de outras ferramentas não são lidas.

## Direcionamento durante streaming

Quando o modo de fila é `steer`, mensagens recebidas são injetadas na execução atual.
O direcionamento enfileirado é entregue **depois que o turno atual do assistente termina
de executar suas chamadas de ferramenta**, antes da próxima chamada de LLM. O Pi drena todas as mensagens
de direcionamento pendentes juntas para `steer`; o `queue` legado drena uma mensagem por
limite de modelo. O direcionamento não pula mais as chamadas de ferramenta restantes da mensagem
atual do assistente.

Quando o modo de fila é `followup` ou `collect`, mensagens recebidas são mantidas até o
turno atual terminar; então um novo turno do agente começa com os payloads enfileirados. Veja
[Fila](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering) para comportamento de modo
e limite.

O streaming em blocos envia blocos concluídos do assistente assim que eles terminam; ele fica
**desativado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; o padrão é text_end).
Controle a divisão suave de blocos com `agents.defaults.blockStreamingChunk` (padrão de
800-1200 caracteres; prefere quebras de parágrafo, depois novas linhas; frases por último).
Combine chunks transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (mesclagem baseada em ociosidade antes do envio). Canais que não sejam Telegram exigem
`*.blockStreaming: true` explícito para habilitar respostas em bloco.
Resumos detalhados de ferramentas são emitidos no início da ferramenta (sem debounce); a Interface de Controle
transmite a saída da ferramenta via eventos do agente quando disponível.
Mais detalhes: [Streaming + divisão em chunks](/pt-BR/concepts/streaming).

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

_Próximo: [Conversas em grupo](/pt-BR/channels/group-messages)_ 🦞

## Relacionado

- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
