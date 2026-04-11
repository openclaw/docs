---
read_when:
    - Você quer entender para que serve a memória ativa
    - Você quer ativar a memória ativa para um agente conversacional
    - Você quer ajustar o comportamento da memória ativa sem ativá-la em todos os lugares
summary: Um subagente de memória com bloqueio controlado pelo plugin que injeta memória relevante em sessões de chat interativas
title: Memória ativa
x-i18n:
    generated_at: "2026-04-11T05:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8b0e6539e09678e9e8def68795f8bcb992f98509423da3da3123eda88ec1dd5
    source_path: concepts/active-memory.md
    workflow: 15
---

# Memória ativa

A memória ativa é um subagente de memória opcional, com bloqueio e controlado por plugin, que é executado antes da resposta principal em sessões conversacionais qualificadas.

Ela existe porque a maioria dos sistemas de memória é capaz, mas reativa. Eles dependem do agente principal para decidir quando pesquisar a memória, ou do usuário para dizer coisas como "lembre-se disso" ou "pesquise na memória". Nessa altura, o momento em que a memória teria tornado a resposta mais natural já passou.

A memória ativa dá ao sistema uma chance limitada de trazer à tona memória relevante antes que a resposta principal seja gerada.

## Cole isto no seu agente

Cole isto no seu agente se quiser ativar a Memória ativa com uma configuração autônoma e segura por padrão:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          enabled: true,
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallbackPolicy: "default-remote",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Isso ativa o plugin para o agente `main`, mantém seu uso limitado a sessões no estilo de mensagem direta por padrão, permite que ele herde primeiro o modelo da sessão atual e ainda permite o fallback remoto integrado caso nenhum modelo explícito ou herdado esteja disponível.

Depois disso, reinicie o gateway:

```bash
openclaw gateway
```

Para inspecioná-la ao vivo em uma conversa:

```text
/verbose on
```

## Ativar a memória ativa

A configuração mais segura é:

1. ativar o plugin
2. direcioná-lo para um agente conversacional
3. manter o logging ativado apenas durante o ajuste

Comece com isto em `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallbackPolicy: "default-remote",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Em seguida, reinicie o gateway:

```bash
openclaw gateway
```

O que isso significa:

- `plugins.entries.active-memory.enabled: true` ativa o plugin
- `config.agents: ["main"]` habilita a memória ativa apenas para o agente `main`
- `config.allowedChatTypes: ["direct"]` mantém a memória ativa habilitada por padrão apenas para sessões no estilo de mensagem direta
- se `config.model` não estiver definido, a memória ativa primeiro herda o modelo da sessão atual
- `config.modelFallbackPolicy: "default-remote"` mantém o fallback remoto integrado como padrão quando nenhum modelo explícito ou herdado está disponível
- `config.promptStyle: "balanced"` usa o estilo de prompt padrão de uso geral para o modo `recent`
- a memória ativa ainda é executada apenas em sessões de chat persistentes e interativas qualificadas

## Como vê-la

A memória ativa injeta contexto oculto de sistema para o modelo. Ela não expõe tags brutas `<active_memory_plugin>...</active_memory_plugin>` ao cliente.

## Alternância por sessão

Use o comando do plugin quando quiser pausar ou retomar a memória ativa para a sessão de chat atual sem editar a configuração:

```text
/active-memory status
/active-memory off
/active-memory on
```

Isso vale apenas para a sessão. Não altera
`plugins.entries.active-memory.enabled`, o direcionamento por agente nem outras
configurações globais.

Se quiser que o comando grave a configuração e pause ou retome a memória ativa para
todas as sessões, use a forma global explícita:

```text
/active-memory status --global
/active-memory off --global
/active-memory on --global
```

A forma global grava `plugins.entries.active-memory.config.enabled`. Ela mantém
`plugins.entries.active-memory.enabled` ativado para que o comando continue disponível para
reativar a memória ativa mais tarde.

Se quiser ver o que a memória ativa está fazendo em uma sessão ao vivo, ative o modo
verbose para essa sessão:

```text
/verbose on
```

Com o verbose ativado, o OpenClaw pode mostrar:

- uma linha de status da memória ativa, como `Active Memory: ok 842ms recent 34 chars`
- um resumo de depuração legível, como `Active Memory Debug: Lemon pepper wings with blue cheese.`

Essas linhas são derivadas da mesma execução da memória ativa que alimenta o contexto
oculto do sistema, mas são formatadas para humanos em vez de expor marcação bruta do prompt.

Por padrão, a transcrição do subagente de memória com bloqueio é temporária e excluída
após a conclusão da execução.

Fluxo de exemplo:

```text
/verbose on
what wings should i order?
```

Formato de resposta visível esperado:

```text
...normal assistant reply...

🧩 Active Memory: ok 842ms recent 34 chars
🔎 Active Memory Debug: Lemon pepper wings with blue cheese.
```

## Quando ela é executada

A memória ativa usa duas barreiras:

1. **Opt-in de configuração**
   O plugin deve estar ativado, e o id do agente atual deve aparecer em
   `plugins.entries.active-memory.config.agents`.
2. **Qualificação estrita em tempo de execução**
   Mesmo quando ativada e direcionada, a memória ativa só é executada em sessões de chat persistentes e interativas qualificadas.

A regra real é:

```text
plugin enabled
+
agent id targeted
+
allowed chat type
+
eligible interactive persistent chat session
=
active memory runs
```

Se qualquer uma dessas condições falhar, a memória ativa não será executada.

## Tipos de sessão

`config.allowedChatTypes` controla quais tipos de conversa podem executar a Memória
ativa.

O padrão é:

```json5
allowedChatTypes: ["direct"]
```

Isso significa que a Memória ativa é executada por padrão em sessões no estilo de
mensagem direta, mas não em sessões de grupo ou canal, a menos que você as habilite explicitamente.

Exemplos:

```json5
allowedChatTypes: ["direct"]
```

```json5
allowedChatTypes: ["direct", "group"]
```

```json5
allowedChatTypes: ["direct", "group", "channel"]
```

## Onde ela é executada

A memória ativa é um recurso de enriquecimento conversacional, não um recurso de
inferência para toda a plataforma.

| Superfície                                                          | Executa memória ativa?                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------- |
| Control UI / sessões persistentes do chat na web                    | Sim, se o plugin estiver ativado e o agente for direcionado |
| Outras sessões interativas de canal no mesmo caminho de chat persistente | Sim, se o plugin estiver ativado e o agente for direcionado |
| Execuções headless de uso único                                     | Não                                                     |
| Execuções de heartbeat/em segundo plano                             | Não                                                     |
| Caminhos internos genéricos de `agent-command`                      | Não                                                     |
| Execução de subagente/helper interno                                | Não                                                     |

## Por que usá-la

Use a memória ativa quando:

- a sessão for persistente e voltada ao usuário
- o agente tiver memória de longo prazo significativa para pesquisar
- continuidade e personalização importarem mais do que determinismo bruto do prompt

Ela funciona especialmente bem para:

- preferências estáveis
- hábitos recorrentes
- contexto de longo prazo do usuário que deve surgir naturalmente

Ela é pouco adequada para:

- automação
- workers internos
- tarefas de API de uso único
- lugares em que personalização oculta seria surpreendente

## Como ela funciona

O formato em tempo de execução é:

```mermaid
flowchart LR
  U["User Message"] --> Q["Build Memory Query"]
  Q --> R["Active Memory Blocking Memory Sub-Agent"]
  R -->|NONE or empty| M["Main Reply"]
  R -->|relevant summary| I["Append Hidden active_memory_plugin System Context"]
  I --> M["Main Reply"]
```

O subagente de memória com bloqueio pode usar apenas:

- `memory_search`
- `memory_get`

Se a conexão estiver fraca, ele deve retornar `NONE`.

## Modos de consulta

`config.queryMode` controla quanto da conversa o subagente de memória com bloqueio vê.

## Estilos de prompt

`config.promptStyle` controla o quão disposto ou rigoroso o subagente de memória com bloqueio é
ao decidir se deve retornar memória.

Estilos disponíveis:

- `balanced`: padrão de uso geral para o modo `recent`
- `strict`: menos disposto; melhor quando você quer pouquíssima interferência do contexto próximo
- `contextual`: mais favorável à continuidade; melhor quando o histórico da conversa deve importar mais
- `recall-heavy`: mais disposto a trazer memória à tona em correspondências mais suaves, mas ainda plausíveis
- `precision-heavy`: prefere agressivamente `NONE`, a menos que a correspondência seja óbvia
- `preference-only`: otimizado para favoritos, hábitos, rotinas, gostos e fatos pessoais recorrentes

Mapeamento padrão quando `config.promptStyle` não está definido:

```text
message -> strict
recent -> balanced
full -> contextual
```

Se você definir `config.promptStyle` explicitamente, essa substituição prevalece.

Exemplo:

```json5
promptStyle: "preference-only"
```

## Política de fallback do modelo

Se `config.model` não estiver definido, a Memória ativa tenta resolver um modelo nesta ordem:

```text
explicit plugin model
-> current session model
-> agent primary model
-> optional built-in remote fallback
```

`config.modelFallbackPolicy` controla a última etapa.

Padrão:

```json5
modelFallbackPolicy: "default-remote"
```

Outra opção:

```json5
modelFallbackPolicy: "resolved-only"
```

Use `resolved-only` se quiser que a Memória ativa ignore a recordação em vez de fazer
fallback para o padrão remoto integrado quando nenhum modelo explícito ou herdado
estiver disponível.

## Válvulas de escape avançadas

Essas opções intencionalmente não fazem parte da configuração recomendada.

`config.thinking` pode substituir o nível de raciocínio do subagente de memória com bloqueio:

```json5
thinking: "medium"
```

Padrão:

```json5
thinking: "off"
```

Não ative isso por padrão. A Memória ativa é executada no caminho da resposta, então o tempo extra
de raciocínio aumenta diretamente a latência visível para o usuário.

`config.promptAppend` adiciona instruções extras do operador após o prompt padrão da Memória
ativa e antes do contexto da conversa:

```json5
promptAppend: "Prefer stable long-term preferences over one-off events."
```

`config.promptOverride` substitui o prompt padrão da Memória ativa. O OpenClaw
ainda acrescenta o contexto da conversa depois:

```json5
promptOverride: "You are a memory search agent. Return NONE or one compact user fact."
```

A personalização de prompt não é recomendada, a menos que você esteja testando deliberadamente um
contrato de recordação diferente. O prompt padrão é ajustado para retornar `NONE`
ou um contexto compacto de fato do usuário para o modelo principal.

### `message`

Somente a mensagem mais recente do usuário é enviada.

```text
Latest user message only
```

Use isto quando:

- você quiser o comportamento mais rápido
- você quiser o viés mais forte em direção à recordação de preferências estáveis
- turnos de acompanhamento não precisarem de contexto conversacional

Tempo limite recomendado:

- comece em torno de `3000` a `5000` ms

### `recent`

A mensagem mais recente do usuário mais uma pequena cauda recente da conversa são enviadas.

```text
Recent conversation tail:
user: ...
assistant: ...
user: ...

Latest user message:
...
```

Use isto quando:

- você quiser um melhor equilíbrio entre velocidade e embasamento conversacional
- perguntas de acompanhamento frequentemente dependerem dos últimos turnos

Tempo limite recomendado:

- comece em torno de `15000` ms

### `full`

A conversa completa é enviada ao subagente de memória com bloqueio.

```text
Full conversation context:
user: ...
assistant: ...
user: ...
...
```

Use isto quando:

- a qualidade máxima de recordação importar mais do que a latência
- a conversa contiver uma preparação importante muito antes no tópico

Tempo limite recomendado:

- aumente-o substancialmente em comparação com `message` ou `recent`
- comece em torno de `15000` ms ou mais, dependendo do tamanho do tópico

Em geral, o tempo limite deve aumentar com o tamanho do contexto:

```text
message < recent < full
```

## Persistência da transcrição

As execuções do subagente de memória com bloqueio da memória ativa criam uma transcrição real `session.jsonl`
durante a chamada do subagente de memória com bloqueio.

Por padrão, essa transcrição é temporária:

- ela é gravada em um diretório temporário
- ela é usada apenas para a execução do subagente de memória com bloqueio
- ela é excluída imediatamente após a conclusão da execução

Se quiser manter essas transcrições do subagente de memória com bloqueio em disco para depuração ou
inspeção, ative a persistência explicitamente:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          persistTranscripts: true,
          transcriptDir: "active-memory",
        },
      },
    },
  },
}
```

Quando ativada, a memória ativa armazena transcrições em um diretório separado dentro da
pasta de sessões do agente de destino, e não no caminho principal de transcrição da conversa
do usuário.

O layout padrão, em termos conceituais, é:

```text
agents/<agent>/sessions/active-memory/<blocking-memory-sub-agent-session-id>.jsonl
```

Você pode alterar o subdiretório relativo com `config.transcriptDir`.

Use isso com cuidado:

- as transcrições do subagente de memória com bloqueio podem se acumular rapidamente em sessões movimentadas
- o modo de consulta `full` pode duplicar muito contexto de conversa
- essas transcrições contêm contexto oculto de prompt e memórias recuperadas

## Configuração

Toda a configuração da memória ativa fica em:

```text
plugins.entries.active-memory
```

Os campos mais importantes são:

| Chave                       | Tipo                                                                                                 | Significado                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `boolean`                                                                                            | Ativa o próprio plugin                                                                                  |
| `config.agents`             | `string[]`                                                                                           | IDs de agentes que podem usar memória ativa                                                             |
| `config.model`              | `string`                                                                                             | Referência opcional do modelo do subagente de memória com bloqueio; quando não definido, a memória ativa usa o modelo da sessão atual |
| `config.queryMode`          | `"message" \| "recent" \| "full"`                                                                    | Controla quanto da conversa o subagente de memória com bloqueio vê                                     |
| `config.promptStyle`        | `"balanced" \| "strict" \| "contextual" \| "recall-heavy" \| "precision-heavy" \| "preference-only"` | Controla o quão disposto ou rigoroso o subagente de memória com bloqueio é ao decidir se deve retornar memória |
| `config.thinking`           | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "adaptive"`                         | Substituição avançada de raciocínio para o subagente de memória com bloqueio; padrão `off` para velocidade |
| `config.promptOverride`     | `string`                                                                                             | Substituição avançada completa do prompt; não recomendada para uso normal                              |
| `config.promptAppend`       | `string`                                                                                             | Instruções extras avançadas anexadas ao prompt padrão ou substituído                                   |
| `config.timeoutMs`          | `number`                                                                                             | Tempo limite rígido para o subagente de memória com bloqueio                                           |
| `config.maxSummaryChars`    | `number`                                                                                             | Número máximo total de caracteres permitidos no resumo da memória ativa                                |
| `config.logging`            | `boolean`                                                                                            | Emite logs da memória ativa durante o ajuste                                                            |
| `config.persistTranscripts` | `boolean`                                                                                            | Mantém as transcrições do subagente de memória com bloqueio em disco em vez de excluir arquivos temporários |
| `config.transcriptDir`      | `string`                                                                                             | Diretório relativo das transcrições do subagente de memória com bloqueio dentro da pasta de sessões do agente |

Campos úteis para ajuste:

| Chave                         | Tipo     | Significado                                                 |
| ----------------------------- | -------- | ----------------------------------------------------------- |
| `config.maxSummaryChars`      | `number` | Número máximo total de caracteres permitidos no resumo da memória ativa |
| `config.recentUserTurns`      | `number` | Turnos anteriores do usuário a incluir quando `queryMode` for `recent` |
| `config.recentAssistantTurns` | `number` | Turnos anteriores do assistente a incluir quando `queryMode` for `recent` |
| `config.recentUserChars`      | `number` | Máximo de caracteres por turno recente do usuário           |
| `config.recentAssistantChars` | `number` | Máximo de caracteres por turno recente do assistente        |
| `config.cacheTtlMs`           | `number` | Reutilização de cache para consultas idênticas repetidas    |

## Configuração recomendada

Comece com `recent`.

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          logging: true,
        },
      },
    },
  },
}
```

Se quiser inspecionar o comportamento em tempo real durante o ajuste, use `/verbose on` na
sessão em vez de procurar um comando de depuração separado da memória ativa.

Depois passe para:

- `message` se quiser menor latência
- `full` se decidir que contexto extra vale o subagente de memória com bloqueio mais lento

## Depuração

Se a memória ativa não estiver aparecendo onde você espera:

1. Confirme que o plugin está ativado em `plugins.entries.active-memory.enabled`.
2. Confirme que o ID do agente atual está listado em `config.agents`.
3. Confirme que você está testando por meio de uma sessão de chat persistente e interativa.
4. Ative `config.logging: true` e observe os logs do gateway.
5. Verifique se a própria pesquisa de memória funciona com `openclaw memory status --deep`.

Se os resultados de memória estiverem ruidosos, ajuste mais:

- `maxSummaryChars`

Se a memória ativa estiver lenta demais:

- reduza `queryMode`
- reduza `timeoutMs`
- reduza a contagem de turnos recentes
- reduza os limites de caracteres por turno

## Páginas relacionadas

- [Pesquisa de memória](/pt-BR/concepts/memory-search)
- [Referência de configuração de memória](/pt-BR/reference/memory-config)
- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
