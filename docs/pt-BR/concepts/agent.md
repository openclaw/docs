---
read_when:
    - Alteração do runtime do agente, da inicialização do workspace ou do comportamento da sessão
summary: Runtime do agente, contrato do espaço de trabalho e inicialização da sessão
title: Runtime do agente
x-i18n:
    generated_at: "2026-07-12T15:08:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e7b07f6db62c001d43e223eee28911b0515e1528e4b15c6c3748e88eaf405cfc
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw inclui um **runtime de agente incorporado**: um loop de agente integrado, a
conexão de ferramentas e a montagem de prompts, distinto de delegar turnos a um
processo de harness externo. Cada agente configurado (consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent)
para executar vários) tem seu próprio espaço de trabalho, arquivos de inicialização
e armazenamento de sessões. Esta página aborda esse contrato de runtime: o que o
espaço de trabalho deve conter, quais arquivos são injetados e como as sessões são
inicializadas com base nele.

## Espaço de trabalho (obrigatório)

Cada agente usa um único diretório de espaço de trabalho (`agents.defaults.workspace` ou
`agents.list[].workspace` por agente) como seu **único** diretório de trabalho (`cwd`)
para ferramentas e contexto.

Recomendação: use `openclaw setup` para criar `~/.openclaw/openclaw.json`, caso não exista, e inicializar os arquivos do espaço de trabalho.

Layout completo do espaço de trabalho + guia de backup: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões que não sejam a principal poderão substituir isso por
espaços de trabalho por sessão em `agents.defaults.sandbox.workspaceRoot` (consulte
[Configuração do Gateway](/pt-BR/gateway/configuration)).

## Arquivos de inicialização (injetados)

No espaço de trabalho, o OpenClaw espera estes arquivos editáveis pelo usuário:

| Arquivo        | Finalidade                                            |
| -------------- | ----------------------------------------------------- |
| `AGENTS.md`    | Instruções operacionais + "memória"                   |
| `SOUL.md`      | Persona, limites, tom                                  |
| `TOOLS.md`     | Notas e convenções de ferramentas mantidas pelo usuário |
| `IDENTITY.md`  | Nome/estilo/emoji do agente                            |
| `USER.md`      | Perfil do usuário + forma de tratamento preferida     |
| `HEARTBEAT.md` | Instruções específicas do Heartbeat                   |
| `BOOTSTRAP.md` | Ritual único da primeira execução (excluído após a conclusão) |
| `MEMORY.md`    | Arquivo raiz de memória de longo prazo, se presente   |

No primeiro turno de uma nova sessão, o OpenClaw injeta o conteúdo desses arquivos no Contexto do Projeto do prompt do sistema. `MEMORY.md` só é injetado quando existe na raiz do espaço de trabalho.

Arquivos vazios são ignorados. Arquivos grandes são reduzidos e truncados com um marcador para manter os prompts enxutos (leia o arquivo para ver o conteúdo completo). Um arquivo ausente (exceto `MEMORY.md`) injeta uma única linha de marcador de "arquivo ausente"; `openclaw setup` cria para ele um modelo padrão seguro.

`BOOTSTRAP.md` só é criado para um **espaço de trabalho totalmente novo** (sem outros arquivos de inicialização presentes). Enquanto estiver pendente, o OpenClaw o mantém no Contexto do Projeto e adiciona orientações de inicialização ao prompt do sistema para o ritual inicial, em vez de copiá-lo para a mensagem do usuário. Se você o excluir após concluir o ritual, ele não será recriado em reinicializações posteriores.

Depois que um espaço de trabalho é observado, o OpenClaw também mantém um marcador de atestação no diretório de estado para o caminho do espaço de trabalho. Se um espaço de trabalho atestado recentemente desaparecer ou for apagado, a inicialização se recusará a recriar silenciosamente o `BOOTSTRAP.md`; restaure o espaço de trabalho ou use uma redefinição completa de integração para que o espaço de trabalho e o marcador sejam apagados juntos.

Para desabilitar totalmente a criação de arquivos de inicialização (para espaços de trabalho pré-configurados), defina:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ferramentas integradas

As ferramentas principais (leitura/execução/edição/gravação e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` fica ativado por padrão para modelos da OpenAI e é controlado por
`tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`). `TOOLS.md` **não** controla quais ferramentas existem; ele
fornece orientações sobre como _você_ quer que elas sejam usadas.

## Skills

O OpenClaw carrega Skills destes locais (da maior para a menor precedência):

- Espaço de trabalho: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills pessoais do agente: `~/.agents/skills`
- Gerenciadas/locais: `~/.openclaw/skills`
- Incluídas (fornecidas com a instalação)
- Pastas adicionais de Skills: `skills.load.extraDirs`

As raízes de Skills podem conter pastas agrupadas, como
`<workspace>/skills/personal/foo/SKILL.md`; a Skill ainda é exposta pelo nome simples
no frontmatter, por exemplo, `foo`.

As Skills podem ser condicionadas por configuração/variáveis de ambiente (consulte `skills` em [Configuração do Gateway](/pt-BR/gateway/configuration)).

## Limites do runtime

O runtime de agente incorporado pertence ao OpenClaw: descoberta de modelos, conexão de ferramentas,
montagem de prompts, gerenciamento de sessões e entrega por canais compartilham uma única
superfície de runtime integrada.

## Sessões

As linhas de sessão são armazenadas no banco de dados SQLite por agente:

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Os arquivos de transcrição JSONL ainda podem ficar em
`~/.openclaw/agents/<agentId>/sessions/` como entradas de migração legadas, arquivos
excluídos ou redefinidos, importações, exportações e artefatos de suporte. O histórico
ativo do agente é armazenado no SQLite junto às linhas de sessão. O ID da sessão é
estável e escolhido pelo OpenClaw. O OpenClaw não lê pastas de sessão de outras ferramentas.

## Direcionamento durante o streaming

Os prompts de entrada que chegam durante uma execução são direcionados para a execução atual por padrão.
O direcionamento é entregue **depois que o turno atual do assistente termina de executar suas
chamadas de ferramentas**, antes da próxima chamada ao LLM, e não ignora mais as chamadas de ferramentas
restantes da mensagem atual do assistente.

`/queue steer` é o comportamento padrão durante uma execução ativa. `/queue followup` e
`/queue collect` fazem as mensagens aguardarem um turno posterior, em vez de direcioná-las.
`/queue interrupt` interrompe a execução ativa. Consulte [Fila](/pt-BR/concepts/queue)
e [Fila de direcionamento](/pt-BR/concepts/queue-steering) para conhecer o comportamento da fila e dos limites.

O streaming em blocos envia blocos concluídos do assistente assim que terminam; ele fica
**desativado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite por meio de `agents.defaults.blockStreamingBreak` (`text_end` em comparação com `message_end`; o padrão é `text_end`).
Controle a divisão flexível dos blocos com `agents.defaults.blockStreamingChunk` (o padrão é
800-1200 caracteres; prioriza quebras de parágrafo, depois novas linhas e, por último, frases).
Agrupe os fragmentos transmitidos com `agents.defaults.blockStreamingCoalesce` para reduzir
o excesso de linhas individuais (mesclagem baseada em inatividade antes do envio). Canais que não sejam o Telegram exigem
`*.blockStreaming: true` explícito para habilitar respostas em blocos.
Resumos detalhados de ferramentas são emitidos no início da ferramenta (sem debounce); a Control UI
transmite a saída das ferramentas por meio de eventos do agente, quando disponível.
Mais detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Referências de modelos

As referências de modelos na configuração (por exemplo, `agents.defaults.model` e `agents.defaults.models`) são analisadas pela divisão na **primeira** `/`.

- Use `provider/model` ao configurar modelos.
- Se o próprio ID do modelo contiver `/` (no estilo do OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw tentará primeiro um alias, depois uma
  correspondência exclusiva de provedor configurado para esse ID exato de modelo e, somente então, recorrerá
  ao provedor padrão configurado. Se esse provedor não disponibilizar mais o
  modelo padrão configurado, o OpenClaw recorrerá ao primeiro
  provedor/modelo configurado, em vez de expor um padrão obsoleto de um provedor removido.

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (altamente recomendado)

## Relacionados

- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Conversas em grupo](/pt-BR/channels/group-messages)
