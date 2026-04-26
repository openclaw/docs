---
read_when:
    - Você quer reduzir o crescimento do contexto causado por saídas de ferramentas
    - Você quer entender a otimização do cache de prompt da Anthropic
summary: Remoção de resultados antigos de ferramentas para manter o contexto enxuto e o cache eficiente
title: Poda de sessão
x-i18n:
    generated_at: "2026-04-26T11:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
---

A poda de sessão remove **resultados antigos de ferramentas** do contexto antes de cada
chamada ao LLM. Ela reduz o inchaço do contexto causado pelo acúmulo de saídas de ferramentas (resultados de exec, leituras de arquivo, resultados de busca) sem reescrever o texto normal da conversa.

<Info>
A poda ocorre apenas em memória -- ela não modifica a transcrição da sessão em disco.
Seu histórico completo é sempre preservado.
</Info>

## Por que isso importa

Sessões longas acumulam saída de ferramentas que infla a janela de contexto. Isso
aumenta o custo e pode forçar [Compaction](/pt-BR/concepts/compaction) mais cedo do que o
necessário.

A poda é especialmente valiosa para o cache de prompt da Anthropic. Após o TTL do cache
expirar, a próxima solicitação armazena novamente em cache o prompt completo. A poda reduz o
tamanho da gravação do cache, diminuindo diretamente o custo.

## Como funciona

1. Aguarde o TTL do cache expirar (padrão de 5 minutos).
2. Encontre resultados antigos de ferramentas para a poda normal (o texto da conversa é deixado intacto).
3. **Corte suave** em resultados grandes demais -- mantenha o início e o fim, insira `...`.
4. **Limpeza rígida** no restante -- substitua por um placeholder.
5. Redefina o TTL para que solicitações seguintes reutilizem o cache novo.

## Limpeza legada de imagens

O OpenClaw também constrói uma visualização de replay idempotente separada para sessões que
persistem blocos brutos de imagem ou marcadores de mídia de hidratação de prompt no histórico.

- Ela preserva os **3 turnos concluídos mais recentes** byte por byte para que os
  prefixos de cache de prompt para acompanhamentos recentes permaneçam estáveis.
- Na visualização de replay, blocos de imagem mais antigos já processados do histórico de `user` ou
  `toolResult` podem ser substituídos por
  `[image data removed - already processed by model]`.
- Referências textuais de mídia mais antigas, como `[media attached: ...]`,
  `[Image: source: ...]` e `media://inbound/...`, podem ser substituídas por
  `[media reference removed - already processed by model]`. Marcadores de anexo do turno atual
  permanecem intactos para que modelos de visão ainda possam hidratar imagens novas.
- A transcrição bruta da sessão não é reescrita, então visualizadores de histórico ainda podem
  renderizar as entradas originais de mensagem e suas imagens.
- Isso é separado da poda normal por TTL de cache. Existe para impedir que
  cargas repetidas de imagem ou refs de mídia obsoletas invalidem caches de prompt em turnos posteriores.

## Padrões inteligentes

O OpenClaw ativa automaticamente a poda para perfis Anthropic:

| Tipo de perfil                                         | Poda ativada | Heartbeat |
| ------------------------------------------------------ | ------------ | --------- |
| Autenticação OAuth/token da Anthropic (incluindo reutilização do Claude CLI) | Sim          | 1 hora    |
| Chave de API                                           | Sim          | 30 min    |

Se você definir valores explícitos, o OpenClaw não os substituirá.

## Ativar ou desativar

A poda fica desativada por padrão para provedores não Anthropic. Para ativar:

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

## Poda vs Compaction

|            | Poda                | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **O quê**  | Remove resultados de ferramentas | Resume a conversa |
| **Salvo?** | Não (por solicitação) | Sim (na transcrição)  |
| **Escopo** | Apenas resultados de ferramentas | Conversa inteira     |

Elas se complementam -- a poda mantém a saída de ferramentas enxuta entre
ciclos de Compaction.

## Leitura adicional

- [Compaction](/pt-BR/concepts/compaction) -- redução de contexto baseada em sumarização
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todos os ajustes de configuração de poda
  (`contextPruning.*`)

## Relacionados

- [Gerenciamento de sessão](/pt-BR/concepts/session)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
