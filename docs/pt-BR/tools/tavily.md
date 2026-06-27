---
read_when:
    - Você quer busca na web com suporte do Tavily
    - Você precisa de uma chave de API da Tavily
    - Você quer o Tavily como provedor `web_search`
    - Você quer extração de conteúdo de URLs
summary: Ferramentas de busca e extração do Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:19:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) é uma API de busca projetada para aplicações de IA. O OpenClaw a expõe de duas formas:

- como o provedor `web_search` para a ferramenta de busca genérica
- como ferramentas explícitas de Plugin: `tavily_search` e `tavily_extract`

O Tavily retorna resultados estruturados otimizados para consumo por LLMs, com profundidade de busca configurável, filtragem por tópico, filtros de domínio, resumos de respostas gerados por IA e extração de conteúdo de URLs (incluindo páginas renderizadas por JavaScript).

| Propriedade | Valor                                      |
| ----------- | ------------------------------------------ |
| ID do Plugin | `tavily`                                  |
| Pacote      | `@openclaw/tavily-plugin`                  |
| Auth        | `TAVILY_API_KEY` ou configuração `apiKey`  |
| URL base    | `https://api.tavily.com` (padrão)          |
| Ferramentas | `tavily_search`, `tavily_extract`          |

## Primeiros passos

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Get an API key">
    Crie uma conta Tavily em [tavily.com](https://tavily.com) e então gere uma chave de API no painel.
  </Step>
  <Step title="Configure the plugin and provider">
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
  <Step title="Verify search runs">
    Acione um `web_search` de qualquer agente ou chame `tavily_search` diretamente.
  </Step>
</Steps>

<Tip>
Escolher Tavily na integração inicial ou em `openclaw configure --section web` instala e habilita o Plugin oficial do Tavily quando necessário.
</Tip>

## Referência de ferramentas

### `tavily_search`

Use isto quando quiser controles de busca específicos do Tavily em vez do `web_search` genérico.

| Parâmetro         | Tipo              | Restrições / padrão                    | Descrição                                             |
| ----------------- | ----------------- | -------------------------------------- | ----------------------------------------------------- |
| `query`           | string            | obrigatório                            | String de consulta de busca. Mantenha abaixo de 400 caracteres. |
| `search_depth`    | enum              | `basic` (padrão), `advanced`           | `advanced` é mais lento, mas tem maior relevância.    |
| `topic`           | enum              | `general` (padrão), `news`, `finance`  | Filtra por família de tópicos.                        |
| `max_results`     | integer           | 1-20                                   | Número de resultados.                                 |
| `include_answer`  | boolean           | padrão `false`                         | Inclui um resumo de resposta gerado por IA do Tavily. |
| `time_range`      | enum              | `day`, `week`, `month`, `year`         | Filtra resultados por recência.                       |
| `include_domains` | array de strings  | (nenhum)                               | Inclui apenas resultados destes domínios.             |
| `exclude_domains` | array de strings  | (nenhum)                               | Exclui resultados destes domínios.                    |

Tradeoff de profundidade de busca:

| Profundidade | Velocidade | Relevância | Melhor para                              |
| ------------ | ---------- | ---------- | ---------------------------------------- |
| `basic`      | Mais rápido | Alta      | Consultas de uso geral (padrão).         |
| `advanced`   | Mais lento  | Máxima    | Pesquisa precisa e verificação de fatos. |

### `tavily_extract`

Use isto para extrair conteúdo limpo de uma ou mais URLs. Lida com páginas renderizadas por JavaScript e oferece suporte a divisão em chunks focada em consulta para extração direcionada.

| Parâmetro           | Tipo             | Restrições / padrão          | Descrição                                                   |
| ------------------- | ---------------- | ---------------------------- | ----------------------------------------------------------- |
| `urls`              | array de strings | obrigatório, 1-20            | URLs das quais extrair conteúdo.                            |
| `query`             | string           | (opcional)                   | Reordena chunks extraídos por relevância para esta consulta. |
| `extract_depth`     | enum             | `basic` (padrão), `advanced` | Use `advanced` para páginas pesadas em JS, SPAs ou tabelas dinâmicas. |
| `chunks_per_source` | integer          | 1-5; **requer `query`**      | Chunks retornados por URL. Gera erro se definido sem `query`. |
| `include_images`    | boolean          | padrão `false`               | Inclui URLs de imagens nos resultados.                      |

Tradeoff de profundidade de extração:

| Profundidade | Quando usar                                |
| ------------ | ------------------------------------------ |
| `basic`      | Páginas simples. Tente isto primeiro.      |
| `advanced`   | SPAs renderizadas por JS, conteúdo dinâmico, tabelas. |

<Tip>
Divida listas maiores de URLs em várias chamadas `tavily_extract` (máximo de 20 por solicitação). Use `query` mais `chunks_per_source` para obter apenas conteúdo relevante em vez de páginas completas.
</Tip>

## Escolhendo a ferramenta certa

| Necessidade                              | Ferramenta       |
| ---------------------------------------- | ---------------- |
| Busca web rápida, sem opções especiais   | `web_search`     |
| Busca com profundidade, tópico, respostas de IA | `tavily_search`  |
| Extrair conteúdo de URLs específicas     | `tavily_extract` |

<Note>
A ferramenta genérica `web_search` com Tavily como provedor oferece suporte a `query` e `count` (até 20 resultados). Para controles específicos do Tavily (`search_depth`, `topic`, `include_answer`, filtros de domínio, intervalo de tempo), use `tavily_search`.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="API key resolution order">
    O cliente Tavily procura sua chave de API nesta ordem:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (resolvida por SecretRefs).
    2. `TAVILY_API_KEY` do ambiente do Gateway.

    `tavily_extract` gera um erro de configuração se nenhum dos dois estiver presente.

  </Accordion>

  <Accordion title="Custom base URL">
    Substitua `plugins.entries.tavily.config.webSearch.baseUrl` se você expõe o Tavily por meio de um proxy. O padrão é `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` rejeita chamadas que passam `chunks_per_source` sem uma `query`. O Tavily classifica chunks por relevância da consulta, portanto o parâmetro não tem significado sem uma.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/pt-BR/tools/web" icon="magnifying-glass">
    Todos os provedores e regras de detecção automática.
  </Card>
  <Card title="Firecrawl" href="/pt-BR/tools/firecrawl" icon="fire">
    Busca mais scraping com extração de conteúdo.
  </Card>
  <Card title="Exa Search" href="/pt-BR/tools/exa-search" icon="binoculars">
    Busca neural com extração de conteúdo.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration" icon="gear">
    Esquema de configuração completo para entradas de Plugin e roteamento de ferramentas.
  </Card>
</CardGroup>
