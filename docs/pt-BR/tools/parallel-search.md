---
read_when:
    - Você quer pesquisa na web sem uma chave de API
    - Você quer a Search API paga da Parallel
    - Você quer trechos densos classificados por eficiência de contexto para LLM
summary: Busca paralela -- trechos densos otimizados para LLM de fontes da web
title: Busca paralela
x-i18n:
    generated_at: "2026-06-27T18:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

O Plugin Parallel fornece dois provedores `web_search` da [Parallel](https://parallel.ai/):

- **Busca Parallel (Grátis)** (`parallel-free`) -- o
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuito da Parallel. Não requer
  conta nem chave de API. Selecione-o explicitamente quando quiser o caminho de
  busca hospedado da Parallel sem chave.
- **Busca Parallel** (`parallel`) -- a API de Busca paga da Parallel. Requer uma
  `PARALLEL_API_KEY` e oferece limites de taxa maiores e ajuste de objetivo.

Ambos retornam trechos ranqueados e otimizados para LLM de um índice da web criado para agentes de IA.
Defina `tools.web.search.provider` como `parallel-free` ou `parallel` para escolher um
explicitamente.

<Note>
  Modelos OpenAI Responses usam a busca web nativa da OpenAI quando
  `tools.web.search.provider` não está definido, então eles ignoram os provedores Parallel.
  Defina `tools.web.search.provider` como `parallel-free` ou `parallel` para roteá-los
  pela Parallel.
</Note>

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Chave de API (provedor pago)

`parallel-free` não requer chave de API, mas ainda precisa ser selecionado como o
provedor gerenciado. O provedor pago `parallel` precisa de uma chave de API:

<Steps>
  <Step title="Criar uma conta">
    Cadastre-se em [platform.parallel.ai](https://platform.parallel.ai) e
    gere uma chave de API no seu painel.
  </Step>
  <Step title="Armazenar a chave">
    Defina `PARALLEL_API_KEY` no ambiente do Gateway, ou configure via:

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
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Alternativa de ambiente:** defina `PARALLEL_API_KEY` no ambiente do Gateway.
Para uma instalação do gateway, coloque-a em `~/.openclaw/.env`.

## Substituição da URL base

A substituição da URL base se aplica apenas ao provedor pago `parallel`. O provedor gratuito
`parallel-free` sempre usa `https://search.parallel.ai/mcp`.

Defina `plugins.entries.parallel.config.webSearch.baseUrl` quando as solicitações da Parallel
devem passar por um proxy compatível ou endpoint alternativo da Parallel (por
exemplo, o Cloudflare AI Gateway). O OpenClaw normaliza hosts simples
prefixando `https://` e acrescenta `/v1/search`, a menos que o caminho já termine
assim. O endpoint resolvido é incluído na chave de cache de busca, então resultados
de endpoints diferentes da Parallel não são compartilhados.

## Parâmetros da ferramenta

O OpenClaw expõe o formato de busca nativo da Parallel para que o modelo possa preencher tanto
o objetivo em linguagem natural quanto algumas consultas curtas por palavras-chave — a combinação
que a Parallel [recomenda](https://docs.parallel.ai/search/best-practices) para
melhores resultados.

<ParamField path="objective" type="string" required>
Descrição em linguagem natural da pergunta ou objetivo subjacente (máx. 5000
caracteres). Deve ser autocontida.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Consultas de busca concisas por palavras-chave, com 3 a 6 palavras cada (1 a 5 entradas, máx. 200 caracteres
cada). Forneça 2 a 3 consultas diversas para obter melhores resultados.
</ParamField>

<ParamField path="count" type="number">
Resultados a retornar (1 a 40).
</ParamField>

<ParamField path="session_id" type="string">
ID de sessão opcional da Parallel (máx. 1000 caracteres em `parallel`; o Search MCP gratuito
`parallel-free` limita a 100). Passe o `sessionId` de um resultado anterior da
Parallel em buscas de acompanhamento que fazem parte da mesma tarefa, para que a Parallel
possa agrupar chamadas relacionadas e melhorar resultados subsequentes. Um ID acima do limite é
descartado e um novo é gerado.
</ParamField>

<ParamField path="client_model" type="string">
Identificador opcional do modelo que faz a chamada (por exemplo, `claude-opus-4-7`,
`gpt-5.5`). Permite que a Parallel ajuste as configurações padrão para as
capacidades do seu modelo. Passe o slug exato do modelo ativo; não encurte para um alias
de família.
</ParamField>

## Observações

- A Parallel ranqueia e comprime resultados com base na utilidade para raciocínio de LLM, não em
  cliques humanos; espere trechos densos em cada resultado, em vez de
  conteúdo de página completa
- Trechos de resultado retornam como o array `excerpts` e também são unidos no
  campo `description` para compatibilidade com o contrato genérico `web_search`
- A Parallel retorna um `session_id` em toda resposta; o OpenClaw o expõe como
  `sessionId` no payload da ferramenta para que chamadores possam agrupar buscas de acompanhamento
- `searchId`, `warnings` e `usage` da Parallel são repassados quando
  presentes
- O OpenClaw sempre encaminha uma contagem de resultados resolvida para a Parallel como
  `advanced_settings.max_results`. O arg `count` do chamador prevalece, depois a
  configuração de nível superior `tools.web.search.maxResults`; caso contrário, é usado o
  padrão genérico de `web_search` do OpenClaw (5). Isso mantém o volume de resultados consistente
  ao alternar entre provedores; a Parallel, por conta própria, usa 10 por padrão
- Os resultados ficam em cache por 15 minutos por padrão (configurável via
  `cacheTtlMinutes`)
- O provedor gratuito `parallel-free` aceita os mesmos parâmetros. Ele aplica
  `count` no lado do cliente e gera um `session_id` por chamada quando nenhum é
  fornecido.

## Relacionados

- [Visão geral de Busca Web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Busca Exa](/pt-BR/tools/exa-search) -- busca neural com extração de conteúdo
- [Busca Perplexity](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
