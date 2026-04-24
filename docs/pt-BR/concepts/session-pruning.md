---
read_when:
    - Você quer reduzir o crescimento do contexto causado por saídas de ferramentas
    - Você quer entender a otimização do cache de prompt da Anthropic
summary: Remover resultados antigos de ferramentas para manter o contexto enxuto e o cache eficiente
title: Pruning de sessão
x-i18n:
    generated_at: "2026-04-24T05:49:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

O pruning de sessão remove **resultados antigos de ferramentas** do contexto antes de cada chamada ao LLM. Ele reduz o inchaço do contexto causado pelo acúmulo de saídas de ferramentas (resultados de exec, leituras de arquivos, resultados de pesquisa) sem reescrever o texto normal da conversa.

<Info>
O pruning é feito apenas em memória -- ele não modifica a transcrição da sessão em disco.
Seu histórico completo é sempre preservado.
</Info>

## Por que isso importa

Sessões longas acumulam saída de ferramentas que infla a janela de contexto. Isso
aumenta o custo e pode forçar [Compaction](/pt-BR/concepts/compaction) antes do
necessário.

O pruning é especialmente valioso para o **cache de prompt da Anthropic**. Depois que o
TTL do cache expira, a solicitação seguinte recacheia o prompt completo. O pruning reduz o
tamanho da escrita no cache, diminuindo diretamente o custo.

## Como funciona

1. Espera o TTL do cache expirar (padrão de 5 minutos).
2. Encontra resultados antigos de ferramentas para o pruning normal (o texto da conversa é deixado intacto).
3. **Soft-trim** de resultados grandes demais -- mantém o início e o fim, inserindo `...`.
4. **Hard-clear** do restante -- substitui por um placeholder.
5. Redefine o TTL para que solicitações seguintes reutilizem o cache atualizado.

## Limpeza legada de imagens

O OpenClaw também executa uma limpeza idempotente separada para sessões legadas antigas que
persistiam blocos brutos de imagem no histórico.

- Ele preserva os **3 turnos concluídos mais recentes** byte a byte para que os
  prefixos de cache de prompt para acompanhamentos recentes permaneçam estáveis.
- Blocos de imagem antigos já processados no histórico de `user` ou `toolResult` podem ser
  substituídos por `[image data removed - already processed by model]`.
- Isso é separado do pruning normal por TTL do cache. Existe para impedir que
  payloads repetidos de imagem invalidem caches de prompt em turnos posteriores.

## Padrões inteligentes

O OpenClaw ativa automaticamente o pruning para perfis Anthropic:

| Tipo de perfil                                         | Pruning ativado | Heartbeat |
| ------------------------------------------------------ | --------------- | --------- |
| OAuth/autenticação por token da Anthropic (incluindo reutilização do Claude CLI) | Sim             | 1 hora    |
| Chave de API                                           | Sim             | 30 min    |

Se você definir valores explícitos, o OpenClaw não os sobrescreverá.

## Ativar ou desativar

O pruning vem desativado por padrão para providers que não sejam Anthropic. Para ativar:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Para desativar: defina `mode: "off"`.

## Pruning vs Compaction

|            | Pruning                 | Compaction               |
| ---------- | ----------------------- | ------------------------ |
| **O que**  | Remove resultados de ferramentas | Resume a conversa |
| **Salvo?** | Não (por solicitação)   | Sim (na transcrição)     |
| **Escopo** | Apenas resultados de ferramentas | Conversa inteira |

Eles se complementam -- o pruning mantém a saída de ferramentas enxuta entre
ciclos de Compaction.

## Leitura adicional

- [Compaction](/pt-BR/concepts/compaction) -- redução de contexto baseada em resumo
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todos os ajustes de configuração de pruning
  (`contextPruning.*`)

## Relacionado

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Context Engine](/pt-BR/concepts/context-engine)
