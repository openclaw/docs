---
read_when:
    - Você quer busca na web baseada no Tavily
    - Você precisa de uma chave de API da Tavily
    - Você quer o Tavily como provedor de web_search
    - Você quer extrair conteúdo de URLs
summary: Ferramentas de busca e extração do Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:54:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) é uma API de busca projetada para aplicações de IA. O OpenClaw a expõe de duas formas:

- como o provedor `web_search` para a ferramenta genérica de busca
- como ferramentas explícitas de Plugin: `tavily_search` e `tavily_extract`

A Tavily retorna resultados estruturados otimizados para consumo por LLMs, com profundidade de busca configurável, filtragem por tópico, filtros de domínio, resumos de resposta gerados por IA e extração de conteúdo de URLs (incluindo páginas renderizadas por JavaScript).

| Propriedade          | Valor                               |
| -------------------- | ----------------------------------- |
| ID do Plugin         | `tavily`                            |
| Autenticação         | `TAVILY_API_KEY` ou config `apiKey` |
| URL base             | `https://api.tavily.com` (padrão)   |
| Ferramentas incluídas | `tavily_search`, `tavily_extract`   |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma conta da Tavily em [tavily.com](https://tavily.com) e, em seguida, gere uma chave de API no painel.
  </Step>
  <Step title="Configure o Plugin e o provedor">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
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
  <Step title="Verifique se a busca é executada">
    Acione uma `web_search` a partir de qualquer agente ou chame `tavily_search` diretamente.
  </Step>
</Steps>

<Tip>
Escolher Tavily no onboarding ou em `openclaw configure --section web` habilita automaticamente o Plugin Tavily incluído.
</Tip>

## Referência das ferramentas

### `tavily_search`

Use isto quando quiser controles de busca específicos da Tavily em vez do `web_search` genérico.

| Parâmetro         | Tipo         | Restrições / padrão                    | Descrição                                       |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | obrigatório                            | String da consulta de busca. Mantenha abaixo de 400 caracteres. |
| `search_depth`    | enum         | `basic` (padrão), `advanced`           | `advanced` é mais lento, mas tem maior relevância. |
| `topic`           | enum         | `general` (padrão), `news`, `finance`  | Filtre por família de tópicos.                  |
| `max_results`     | integer      | 1-20                                   | Número de resultados.                           |
| `include_answer`  | boolean      | padrão `false`                         | Inclua um resumo de resposta gerado por IA pela Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Filtre os resultados por recência.              |
| `include_domains` | string array | (nenhum)                               | Inclua apenas resultados destes domínios.       |
| `exclude_domains` | string array | (nenhum)                               | Exclua resultados destes domínios.              |

Compromisso da profundidade de busca:

| Profundidade | Velocidade | Relevância | Melhor para                          |
| ------------ | ---------- | ---------- | ------------------------------------ |
| `basic`      | Mais rápida | Alta       | Consultas de uso geral (padrão).     |
| `advanced`   | Mais lenta | Mais alta  | Pesquisa precisa e apuração de fatos. |

### `tavily_extract`

Use isto para extrair conteúdo limpo de uma ou mais URLs. Lida com páginas renderizadas por JavaScript e oferece suporte a fragmentação focada em consulta para extração direcionada.

| Parâmetro           | Tipo         | Restrições / padrão            | Descrição                                                 |
| ------------------- | ------------ | ------------------------------ | --------------------------------------------------------- |
| `urls`              | string array | obrigatório, 1-20              | URLs das quais extrair conteúdo.                          |
| `query`             | string       | (opcional)                     | Reclassifique os trechos extraídos por relevância para esta consulta. |
| `extract_depth`     | enum         | `basic` (padrão), `advanced`   | Use `advanced` para páginas pesadas em JS, SPAs ou tabelas dinâmicas. |
| `chunks_per_source` | integer      | 1-5; **requer `query`**        | Trechos retornados por URL. Gera erro se definido sem `query`. |
| `include_images`    | boolean      | padrão `false`                 | Inclua URLs de imagens nos resultados.                    |

Compromisso da profundidade de extração:

| Profundidade | Quando usar                                |
| ------------ | ------------------------------------------ |
| `basic`      | Páginas simples. Tente isto primeiro.      |
| `advanced`   | SPAs renderizadas por JS, conteúdo dinâmico, tabelas. |

<Tip>
Divida listas maiores de URLs em várias chamadas `tavily_extract` (máximo de 20 por solicitação). Use `query` mais `chunks_per_source` para obter apenas conteúdo relevante em vez de páginas completas.
</Tip>

## Escolhendo a ferramenta certa

| Necessidade                          | Ferramenta       |
| ------------------------------------ | ---------------- |
| Busca rápida na web, sem opções especiais | `web_search` |
| Busca com profundidade, tópico, respostas de IA | `tavily_search` |
| Extrair conteúdo de URLs específicas | `tavily_extract` |

<Note>
A ferramenta genérica `web_search` com Tavily como provedor oferece suporte a `query` e `count` (até 20 resultados). Para controles específicos da Tavily (`search_depth`, `topic`, `include_answer`, filtros de domínio, intervalo de tempo), use `tavily_search`.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Ordem de resolução da chave de API">
    O cliente Tavily procura sua chave de API nesta ordem:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (resolvida por meio de SecretRefs).
    2. `TAVILY_API_KEY` do ambiente do gateway.

    `tavily_extract` gera um erro de configuração se nenhum dos dois estiver presente.

  </Accordion>

  <Accordion title="URL base personalizada">
    Substitua `plugins.entries.tavily.config.webSearch.baseUrl` se você encaminhar a Tavily por meio de um proxy. O padrão é `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requer `query`">
    `tavily_extract` rejeita chamadas que passam `chunks_per_source` sem uma `query`. A Tavily classifica os trechos por relevância da consulta, portanto o parâmetro não tem sentido sem uma.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Visão geral do Web Search" href="/pt-BR/tools/web" icon="magnifying-glass">
    Todos os provedores e regras de detecção automática.
  </Card>
  <Card title="Firecrawl" href="/pt-BR/tools/firecrawl" icon="fire">
    Busca mais scraping com extração de conteúdo.
  </Card>
  <Card title="Exa Search" href="/pt-BR/tools/exa-search" icon="binoculars">
    Busca neural com extração de conteúdo.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Esquema de configuração completo para entradas de Plugin e roteamento de ferramentas.
  </Card>
</CardGroup>
