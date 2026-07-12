---
read_when:
    - Você quer uma pesquisa na Web com suporte do Tavily
    - Você precisa de uma chave de API da Tavily
    - Você quer o Tavily como provedor de web_search
    - Você deseja extrair conteúdo de URLs
summary: Ferramentas de busca e extração do Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T00:28:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) é uma API de pesquisa projetada para aplicações de IA. O OpenClaw a disponibiliza de duas formas:

- como o provedor `web_search` para a ferramenta genérica de pesquisa
- como ferramentas explícitas do plugin: `tavily_search` e `tavily_extract`

A Tavily retorna resultados estruturados otimizados para consumo por LLMs, com profundidade de pesquisa configurável, filtragem por tópico, filtros de domínio, resumos de respostas gerados por IA e extração de conteúdo de URLs (incluindo páginas renderizadas por JavaScript).

| Propriedade  | Valor                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| ID do plugin | `tavily`                                                                                                 |
| Pacote       | `@openclaw/tavily-plugin`                                                                                |
| Autenticação | variável de ambiente `TAVILY_API_KEY` ou configuração `apiKey`                                           |
| URL base     | `https://api.tavily.com` (padrão); variável de ambiente `TAVILY_BASE_URL` ou configuração `baseUrl` para substituir |
| Tempos limite | 30 s para pesquisa, 60 s para extração (padrão)                                                         |
| Ferramentas  | `tavily_search`, `tavily_extract`                                                                        |

## Primeiros passos

<Steps>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Obtenha uma chave de API">
    Crie uma conta da Tavily em [tavily.com](https://tavily.com) e gere uma chave de API no painel.
  </Step>
  <Step title="Configure o plugin e o provedor">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // opcional se TAVILY_API_KEY estiver definida
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifique se a pesquisa é executada">
    Acione uma `web_search` por meio de qualquer agente ou chame `tavily_search` diretamente.
  </Step>
</Steps>

<Tip>
Selecionar a Tavily durante a integração inicial ou em `openclaw configure --section web` instala e habilita o plugin oficial da Tavily quando necessário.
</Tip>

## Referência das ferramentas

### `tavily_search`

Use esta ferramenta quando quiser controles de pesquisa específicos da Tavily em vez da `web_search` genérica.

| Parâmetro         | Tipo             | Restrições/padrão                       | Descrição                                           |
| ----------------- | ---------------- | --------------------------------------- | --------------------------------------------------- |
| `query`           | string           | obrigatório                             | String da consulta de pesquisa.                     |
| `search_depth`    | enum             | `basic` (padrão), `advanced`            | `advanced` é mais lento, mas oferece maior relevância. |
| `topic`           | enum             | `general` (padrão), `news`, `finance`   | Filtra por categoria de tópico.                     |
| `max_results`     | número inteiro   | 1–20, padrão `5`                        | Número de resultados.                               |
| `include_answer`  | booleano         | padrão `false`                          | Inclui um resumo de resposta gerado pela IA da Tavily. |
| `time_range`      | enum             | `day`, `week`, `month`, `year`          | Filtra os resultados por atualidade.                |
| `include_domains` | array de strings | (nenhum)                                | Inclui somente resultados destes domínios.          |
| `exclude_domains` | array de strings | (nenhum)                                | Exclui resultados destes domínios.                  |

Comparação das profundidades de pesquisa:

| Profundidade | Velocidade | Relevância | Mais indicada para                                  |
| ------------ | ---------- | ---------- | --------------------------------------------------- |
| `basic`      | Mais rápida | Alta       | Consultas de uso geral (padrão).                    |
| `advanced`   | Mais lenta  | Máxima     | Pesquisa precisa e apuração de fatos.               |

### `tavily_extract`

Use esta ferramenta para extrair conteúdo limpo de uma ou mais URLs. Ela processa páginas renderizadas por JavaScript e permite dividir o conteúdo em trechos direcionados por consulta para uma extração específica.

| Parâmetro           | Tipo             | Restrições/padrão                  | Descrição                                                        |
| ------------------- | ---------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `urls`              | array de strings | obrigatório, 1–20                  | URLs das quais extrair conteúdo.                                 |
| `query`             | string           | (opcional)                         | Reordena os trechos extraídos pela relevância para esta consulta. |
| `extract_depth`     | enum             | `basic` (padrão), `advanced`       | Use `advanced` para páginas com muito JS, SPAs ou tabelas dinâmicas. |
| `chunks_per_source` | número inteiro   | 1–5; **requer `query`**            | Trechos retornados por URL. Gera um erro se definido sem `query`. |
| `include_images`    | booleano         | padrão `false`                     | Inclui URLs de imagens nos resultados.                           |

Comparação das profundidades de extração:

| Profundidade | Quando usar                                      |
| ------------ | ----------------------------------------------- |
| `basic`      | Páginas simples. Experimente esta opção primeiro. |
| `advanced`   | SPAs renderizadas por JS, conteúdo dinâmico e tabelas. |

<Tip>
Divida listas maiores de URLs em várias chamadas de `tavily_extract` (máximo de 20 por solicitação). Use `query` com `chunks_per_source` para obter somente o conteúdo relevante, em vez de páginas completas.
</Tip>

## Escolha da ferramenta adequada

| Necessidade                                    | Ferramenta       |
| --------------------------------------------- | ---------------- |
| Pesquisa rápida na web, sem opções especiais  | `web_search`     |
| Pesquisa com profundidade, tópico e respostas de IA | `tavily_search` |
| Extração de conteúdo de URLs específicas      | `tavily_extract` |

<Note>
A ferramenta genérica `web_search` com a Tavily como provedor aceita `query` e `count` (até 20 resultados). Para controles específicos da Tavily (`search_depth`, `topic`, `include_answer`, filtros de domínio e intervalo de tempo), use `tavily_search`.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Ordem de resolução da chave de API">
    O cliente da Tavily procura a chave de API nesta ordem:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (resolvida por meio de SecretRefs).
    2. `TAVILY_API_KEY` do ambiente do Gateway.

    Tanto `tavily_search` quanto `tavily_extract` geram um erro de configuração se nenhuma delas estiver presente.

  </Accordion>

  <Accordion title="URL base personalizada">
    Substitua `plugins.entries.tavily.config.webSearch.baseUrl` ou defina `TAVILY_BASE_URL` caso você disponibilize a Tavily por meio de um proxy. A configuração tem prioridade sobre a variável de ambiente. O padrão é `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requer `query`">
    `tavily_extract` rejeita chamadas que forneçam `chunks_per_source` sem uma `query`. A Tavily classifica os trechos pela relevância para a consulta, portanto o parâmetro não tem sentido sem ela.
  </Accordion>
</AccordionGroup>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Visão geral da pesquisa na web" href="/pt-BR/tools/web" icon="magnifying-glass">
    Todos os provedores e regras de detecção automática.
  </Card>
  <Card title="Firecrawl" href="/pt-BR/tools/firecrawl" icon="fire">
    Pesquisa e coleta de dados com extração de conteúdo.
  </Card>
  <Card title="Pesquisa Exa" href="/pt-BR/tools/exa-search" icon="binoculars">
    Pesquisa neural com extração de conteúdo.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Esquema completo de configuração para entradas de plugins e roteamento de ferramentas.
  </Card>
</CardGroup>
