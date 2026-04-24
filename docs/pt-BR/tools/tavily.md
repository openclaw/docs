---
read_when:
    - Você quer pesquisa na web com suporte do Tavily
    - Você precisa de uma chave de API do Tavily
    - Você quer o Tavily como provider de `web_search`
    - Você quer extração de conteúdo de URLs
summary: Ferramentas de pesquisa e extração do Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-24T06:18:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

O OpenClaw pode usar **Tavily** de duas formas:

- como provider de `web_search`
- como ferramentas explícitas do plugin: `tavily_search` e `tavily_extract`

O Tavily é uma API de pesquisa projetada para aplicações de IA, retornando resultados estruturados
otimizados para consumo por LLMs. Ele oferece suporte a profundidade de pesquisa configurável, filtragem
por tópico, filtros de domínio, resumos de resposta gerados por IA e extração de conteúdo
a partir de URLs (incluindo páginas renderizadas por JavaScript).

## Obter uma chave de API

1. Crie uma conta Tavily em [tavily.com](https://tavily.com/).
2. Gere uma chave de API no painel.
3. Armazene-a na configuração ou defina `TAVILY_API_KEY` no ambiente do gateway.

## Configurar pesquisa Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // opcional se TAVILY_API_KEY estiver definido
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

Observações:

- Escolher Tavily no onboarding ou em `openclaw configure --section web` ativa
  automaticamente o plugin empacotado Tavily.
- Armazene a configuração do Tavily em `plugins.entries.tavily.config.webSearch.*`.
- `web_search` com Tavily oferece suporte a `query` e `count` (até 20 resultados).
- Para controles específicos do Tavily como `search_depth`, `topic`, `include_answer`
  ou filtros de domínio, use `tavily_search`.

## Ferramentas do plugin Tavily

### `tavily_search`

Use isto quando quiser controles de pesquisa específicos do Tavily em vez de
`web_search` genérico.

| Parâmetro         | Descrição                                                           |
| ----------------- | ------------------------------------------------------------------- |
| `query`           | String de consulta de pesquisa (mantenha abaixo de 400 caracteres)  |
| `search_depth`    | `basic` (padrão, equilibrado) ou `advanced` (máxima relevância, mais lento) |
| `topic`           | `general` (padrão), `news` (atualizações em tempo real) ou `finance` |
| `max_results`     | Número de resultados, 1-20 (padrão: 5)                              |
| `include_answer`  | Inclui um resumo de resposta gerado por IA (padrão: false)          |
| `time_range`      | Filtra por recência: `day`, `week`, `month` ou `year`               |
| `include_domains` | Array de domínios aos quais restringir resultados                   |
| `exclude_domains` | Array de domínios a excluir dos resultados                          |

**Profundidade de pesquisa:**

| Profundidade | Velocidade | Relevância | Melhor para                           |
| ------------ | ---------- | ---------- | ------------------------------------- |
| `basic`      | Mais rápido | Alta      | Consultas de uso geral (padrão)       |
| `advanced`   | Mais lento | Máxima    | Precisão, fatos específicos, pesquisa |

### `tavily_extract`

Use isto para extrair conteúdo limpo de uma ou mais URLs. Lida com
páginas renderizadas por JavaScript e oferece suporte a fragmentação focada em consulta para
extração direcionada.

| Parâmetro           | Descrição                                                |
| ------------------- | -------------------------------------------------------- |
| `urls`              | Array de URLs para extrair (1-20 por requisição)         |
| `query`             | Reordena fragmentos extraídos por relevância para esta consulta |
| `extract_depth`     | `basic` (padrão, rápido) ou `advanced` (para páginas com muito JS) |
| `chunks_per_source` | Fragmentos por URL, 1-5 (exige `query`)                  |
| `include_images`    | Inclui URLs de imagem nos resultados (padrão: false)     |

**Profundidade de extração:**

| Profundidade | Quando usar                                     |
| ------------ | ----------------------------------------------- |
| `basic`      | Páginas simples — tente isso primeiro           |
| `advanced`   | SPAs renderizadas por JS, conteúdo dinâmico, tabelas |

Dicas:

- Máximo de 20 URLs por requisição. Divida listas maiores em várias chamadas.
- Use `query` + `chunks_per_source` para obter apenas conteúdo relevante em vez de páginas inteiras.
- Tente `basic` primeiro; use fallback para `advanced` se o conteúdo estiver ausente ou incompleto.

## Escolher a ferramenta certa

| Necessidade                          | Ferramenta       |
| ------------------------------------ | ---------------- |
| Pesquisa web rápida, sem opções especiais | `web_search` |
| Pesquisa com profundidade, tópico, respostas por IA | `tavily_search` |
| Extrair conteúdo de URLs específicas | `tavily_extract` |

## Relacionado

- [Visão geral de pesquisa na web](/pt-BR/tools/web) -- todos os providers e autodetecção
- [Firecrawl](/pt-BR/tools/firecrawl) -- pesquisa + scraping com extração de conteúdo
- [Pesquisa Exa](/pt-BR/tools/exa-search) -- pesquisa neural com extração de conteúdo
