---
read_when:
    - Você quer fazer buscas na web sem uma chave de API
    - Você quer a API de pesquisa paga da Parallel
    - Você quer trechos densos classificados pela eficiência de contexto para LLMs
summary: Pesquisa paralela — trechos densos de fontes da web otimizados para LLMs
title: Pesquisa paralela
x-i18n:
    generated_at: "2026-07-12T00:28:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

O Plugin Parallel fornece dois provedores de `web_search` da [Parallel](https://parallel.ai/), ambos retornando trechos classificados e otimizados para LLM a partir de um índice da web criado para agentes de IA:

| Provedor                       | id              | Autenticação                                                                                         |
| ------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------- |
| Pesquisa Parallel (gratuita)   | `parallel-free` | Nenhuma — [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito da Parallel   |
| Pesquisa Parallel              | `parallel`      | `PARALLEL_API_KEY` — API de pesquisa paga, limites de taxa maiores e ajuste de objetivos             |

Defina `tools.web.search.provider` como `parallel-free` ou `parallel` para selecionar um deles explicitamente; nenhum dos dois é detectado automaticamente.

<Note>
  Os modelos diretos de Responses da OpenAI (`api: "openai-responses"`, provedor
  `openai`, URL base oficial da API) usam automaticamente a pesquisa nativa na web
  hospedada pela OpenAI quando `tools.web.search.provider` não está definido, está vazio, é `"auto"`
  ou `"openai"` — portanto, ignoram a Parallel por padrão. Defina
  `tools.web.search.provider` como `parallel-free` ou `parallel` para encaminhá-los
  pela Parallel. Consulte a [visão geral da pesquisa na web](/pt-BR/tools/web).
</Note>

## Instalar o Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Chave de API (provedor pago)

`parallel-free` não precisa de chave, mas ainda deve ser selecionado explicitamente. O provedor pago
`parallel` precisa de uma chave de API:

<Steps>
  <Step title="Criar uma conta">
    Cadastre-se em [platform.parallel.ai](https://platform.parallel.ai) e
    gere uma chave de API no seu painel.
  </Step>
  <Step title="Armazenar a chave">
    Defina `PARALLEL_API_KEY` no ambiente do Gateway ou configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuração

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // opcional se PARALLEL_API_KEY estiver definida
            baseUrl: "https://api.parallel.ai", // opcional; o OpenClaw acrescenta /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" para o Search MCP gratuito ou "parallel" para o
        // provedor baseado na API paga mostrado aqui.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa por variável de ambiente:** defina `PARALLEL_API_KEY` no ambiente do Gateway. Para uma instalação do Gateway, coloque-a em `~/.openclaw/.env`.

## Substituição da URL base

Aplica-se apenas ao provedor pago `parallel`; `parallel-free` sempre usa
`https://search.parallel.ai/mcp` e ignora essa configuração.

Defina `plugins.entries.parallel.config.webSearch.baseUrl` para encaminhar solicitações pagas por um proxy compatível ou endpoint alternativo (por exemplo, o Cloudflare AI Gateway). O OpenClaw normaliza hosts sem esquema acrescentando `https://` no início e acrescenta `/v1/search`, a menos que o caminho já termine assim. O endpoint resolvido faz parte da chave do cache de pesquisa, portanto os resultados de endpoints diferentes nunca são compartilhados.

## Parâmetros da ferramenta

Ambos os provedores expõem o formato de pesquisa nativo da Parallel para que o modelo preencha um objetivo em linguagem natural e algumas consultas curtas por palavras-chave — a combinação que a Parallel [recomenda](https://docs.parallel.ai/search/best-practices) para obter os melhores resultados.

<ParamField path="objective" type="string" required>
Descrição em linguagem natural da pergunta ou do objetivo subjacente (máximo de 5.000 caracteres). Deve ser autossuficiente.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Consultas de pesquisa concisas por palavras-chave, com 3 a 6 palavras cada (de 1 a 5 entradas, máximo de 200 caracteres cada). Forneça de 2 a 3 consultas variadas para obter os melhores resultados.
</ParamField>

<ParamField path="count" type="number">
Resultados a retornar (1 a 40).
</ParamField>

<ParamField path="session_id" type="string">
ID de sessão opcional da Parallel proveniente do `sessionId` de um resultado anterior. Passe-o em pesquisas subsequentes da mesma tarefa para que a Parallel agrupe chamadas relacionadas e melhore os resultados posteriores. Máximo de 1.000 caracteres em `parallel`; o Search MCP gratuito `parallel-free` limita-o a 100. Um ID acima do limite é descartado (pago) ou um novo é gerado (gratuito).
</ParamField>

<ParamField path="client_model" type="string">
Identificador opcional do modelo que faz a chamada (por exemplo, `claude-opus-4-7`, `gpt-5.6-sol`), com no máximo 100 caracteres. Permite que a Parallel adapte as configurações padrão às capacidades do seu modelo. Passe o identificador exato do modelo ativo; não o abrevie para um alias de família.
</ParamField>

## Observações

- A Parallel classifica e compacta os resultados visando sua utilidade para o raciocínio de LLMs, não para cliques humanos; espere trechos densos por resultado, em vez do conteúdo completo das páginas.
- Os trechos dos resultados são retornados como o array `excerpts` e também são unidos em `description` para manter a compatibilidade com o contrato genérico de `web_search`.
- Ambos os provedores retornam um `session_id`; o OpenClaw o expõe como `sessionId` na carga útil da ferramenta para que os chamadores possam agrupar pesquisas subsequentes. Um ID de sessão gerado pela Parallel (que o chamador não forneceu) é excluído da entrada do cache, pois tarefas não relacionadas com consultas idênticas não devem herdá-lo.
- `searchId`, `warnings` e `usage` da Parallel são repassados quando estão presentes.
- O OpenClaw sempre encaminha uma contagem de resultados resolvida à Parallel como `advanced_settings.max_results` (`parallel`) ou aplica `count` no lado do cliente após a resposta de tamanho fixo da Parallel (`parallel-free`). O argumento `count` do chamador tem prioridade, seguido por `tools.web.search.maxResults`; caso contrário, é usado o padrão genérico de `web_search` do OpenClaw (5) — o padrão da própria API da Parallel é 10.
- Os resultados são armazenados em cache por 15 minutos por padrão (`cacheTtlMinutes`).
- `parallel-free` gera um novo `session_id` por chamada por meio de seu handshake MCP quando o chamador não fornece um; `parallel` não o define nesse caso.

## Relacionados

- [Visão geral da pesquisa na web](/pt-BR/tools/web) — todos os provedores e a detecção automática
- [Pesquisa Exa](/pt-BR/tools/exa-search) — pesquisa neural com extração de conteúdo
- [Pesquisa Perplexity](/pt-BR/tools/perplexity-search) — resultados estruturados com filtragem por domínio
