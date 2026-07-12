---
read_when:
    - Você quer reduzir o crescimento do contexto causado pelas saídas das ferramentas
    - Você quer entender a otimização do cache de prompts da Anthropic
summary: Remoção de resultados antigos de ferramentas para manter o contexto enxuto e o cache eficiente
title: Poda de sessões
x-i18n:
    generated_at: "2026-07-11T23:53:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

A poda de sessão reduz **resultados antigos de ferramentas** no contexto antes de cada chamada ao LLM. Ela diminui o inchaço do contexto causado pelo acúmulo de saídas de ferramentas (resultados de execução, leituras de arquivos, resultados de pesquisa) sem reescrever o texto normal da conversa.

<Info>
A poda ocorre somente na memória — ela não modifica a transcrição da sessão armazenada em disco. Seu histórico completo é sempre preservado.
</Info>

## Por que isso importa

Sessões longas acumulam saídas de ferramentas que aumentam a janela de contexto. Isso eleva o custo e pode forçar a [Compaction](/pt-BR/concepts/compaction) antes do necessário.

A poda é especialmente valiosa para o **cache de prompts da Anthropic**. Após o TTL do cache expirar, a próxima solicitação armazena novamente o prompt completo no cache. A poda reduz o tamanho da gravação no cache, diminuindo diretamente o custo.

## Como funciona

A poda é executada no modo `cache-ttl`, condicionada a uma verificação de tempo e a uma verificação do tamanho do contexto:

1. Aguarde o TTL do cache expirar (o padrão é 5 minutos quando definido manualmente; consulte [Padrões inteligentes](#smart-defaults) para ver o padrão automático da Anthropic). Antes que o TTL decorra, a poda é totalmente ignorada para preservar a reutilização do cache de prompts em interações próximas.
2. Depois que o TTL expirar, estime o tamanho total do contexto em relação à janela de contexto do modelo. Se a proporção estiver abaixo de `softTrimRatio` (padrão 0,3), ignore a poda e mantenha o relógio do TTL em execução.
3. **Reduza parcialmente** os resultados de ferramentas muito grandes acima da proporção: mantenha o início e o fim (por padrão, 1.500 caracteres de cada, limitados a 4.000 caracteres no total) e insira `...` entre eles.
4. Se a proporção ainda estiver igual ou acima de `hardClearRatio` (padrão 0,5) e restarem pelo menos `minPrunableToolChars` (padrão 50.000) caracteres de conteúdo de ferramentas que possa ser podado, **limpe completamente** esses resultados: substitua o conteúdo por um marcador de posição (padrão `[Conteúdo antigo do resultado da ferramenta removido]`).
5. Reinicie o relógio do TTL somente quando a poda realmente tiver alterado o contexto, para que as solicitações seguintes reutilizem o cache recém-criado.

Duas regras de segurança se aplicam independentemente dos limites: as `keepLastAssistants` interações mais recentes do assistente (padrão 3) nunca são podadas, e nada anterior à primeira mensagem do usuário na sessão é podado (isso protege leituras de inicialização como `SOUL.md`/`USER.md`).

Somente mensagens `toolResult` são elegíveis; o texto normal da conversa permanece inalterado. Use `agents.defaults.contextPruning.tools.{allow,deny}` para definir quais nomes de ferramentas podem ser podados.

## Limpeza de imagens legadas

O OpenClaw também cria uma visualização de reprodução separada e idempotente para sessões que mantêm no histórico blocos de imagens brutos ou marcadores de mídia de hidratação de prompts.

- Ela preserva, byte por byte, as **3 interações concluídas mais recentes**, para que os prefixos do cache de prompts permaneçam estáveis em continuidades recentes. Essa contagem inclui todas as interações concluídas, não apenas as que contêm imagens; portanto, interações somente com texto também ocupam essa janela.
- Na visualização de reprodução, blocos de imagens mais antigos e já processados no histórico de `user` ou `toolResult` são substituídos por `[dados da imagem removidos - já processados pelo modelo]`.
- Referências textuais de mídia mais antigas, como `[mídia anexada: ...]`, `[Imagem: origem: ...]` e `media://inbound/...`, são substituídas por `[referência de mídia removida - já processada pelo modelo]`. Os marcadores de anexos da interação atual permanecem intactos para que modelos de visão ainda possam hidratar imagens novas.
- A transcrição bruta da sessão não é reescrita; portanto, os visualizadores de histórico ainda podem renderizar as entradas originais das mensagens e suas imagens.
- Isso é separado da poda normal por TTL do cache descrita acima. Seu objetivo é impedir que cargas de imagens repetidas ou referências de mídia obsoletas invalidem os caches de prompts em interações posteriores.

## Padrões inteligentes

O Plugin integrado da Anthropic configura automaticamente a poda e a cadência do Heartbeat na primeira vez que resolve um perfil de autenticação da Anthropic (ou da CLI do Claude), mas somente para campos que você ainda não definiu explicitamente:

| Modo de autenticação                                  | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ----------------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (incluindo reutilização da CLI do Claude) | `cache-ttl`           | `1h`                 | `1h`              |
| Chave de API                                          | `cache-ttl`           | `1h`                 | `30m`             |

Se você definir `agents.defaults.contextPruning.mode` ou `agents.defaults.heartbeat.every`, o OpenClaw não os substituirá. Esse padrão automático só é aplicado à autenticação da família Anthropic; para outros provedores, a poda fica `off`, a menos que você a configure.

## Ativar ou desativar

A poda fica desativada por padrão para provedores que não são da Anthropic. Para ativá-la:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Para desativá-la: defina `mode: "off"`.

## Poda em comparação com Compaction

|              | Poda                           | Compaction           |
| ------------ | ------------------------------ | -------------------- |
| **O quê**    | Reduz resultados de ferramentas | Resume a conversa    |
| **Salvo?**   | Não (por solicitação)          | Sim (na transcrição) |
| **Escopo**   | Somente resultados de ferramentas | Toda a conversa   |

Elas se complementam — a poda mantém as saídas das ferramentas enxutas entre os ciclos de Compaction.

## Leitura adicional

- [Compaction](/pt-BR/concepts/compaction): redução do contexto baseada em resumos
- [Configuração do Gateway](/pt-BR/gateway/configuration): todas as opções de configuração da poda (`contextPruning.*`)

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Ferramentas de sessão](/pt-BR/concepts/session-tool)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
