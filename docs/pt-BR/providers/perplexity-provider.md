---
read_when:
    - Você quer configurar o Perplexity como um provedor de pesquisa na web
    - Você precisa da chave da API do Perplexity ou da configuração do proxy do OpenRouter
summary: Configuração do provedor de pesquisa na web Perplexity (chave de API, modos de pesquisa, filtragem)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T15:34:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

O Plugin Perplexity registra um provedor `web_search` com dois transportes: a
API Search nativa da Perplexity (resultados estruturados com filtros) e as
conclusões de chat do Perplexity Sonar, diretamente ou via OpenRouter (respostas
sintetizadas por IA com citações).

<Note>
Esta página aborda a configuração do **provedor** Perplexity. Para a **ferramenta** Perplexity (como o agente a utiliza), consulte [Pesquisa com Perplexity](/pt-BR/tools/perplexity-search).
</Note>

| Propriedade       | Valor                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| Tipo              | Provedor de pesquisa na web (não é um provedor de modelos)                 |
| Autenticação      | `PERPLEXITY_API_KEY` (nativa) ou `OPENROUTER_API_KEY` (via OpenRouter)      |
| Caminho de config | `plugins.entries.perplexity.config.webSearch.apiKey`                       |
| Substituições     | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`           |
| Obter uma chave   | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)       |

## Instalar o Plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API">
    ```bash
    openclaw configure --section web
    ```

    Ou defina a chave diretamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Uma chave exportada como `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` no
    ambiente do Gateway também funciona.

  </Step>
  <Step title="Começar a pesquisar">
    `web_search` detecta automaticamente a Perplexity assim que sua chave é a
    credencial de pesquisa disponível; nenhuma configuração adicional é
    necessária. Para fixar explicitamente o provedor:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Modos de pesquisa

O Plugin resolve o transporte nesta ordem:

1. `webSearch.baseUrl` ou `webSearch.model` definido: sempre encaminha pelas conclusões de chat do Sonar nesse endpoint, independentemente do tipo de chave.
2. Caso contrário, a origem da chave determina o endpoint: o prefixo de uma chave configurada seleciona o transporte (a configuração tem precedência sobre as variáveis de ambiente); uma chave de ambiente usa diretamente seu endpoint correspondente.

| Prefixo da chave | Transporte                                                 | Recursos                                                 |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| `pplx-`          | API Search nativa da Perplexity (`https://api.perplexity.ai`) | Resultados estruturados, filtros de domínio/idioma/data |
| `sk-or-`         | OpenRouter (`https://openrouter.ai/api/v1`), modelo Sonar  | Respostas sintetizadas por IA com citações               |

Uma chave configurada com qualquer outro prefixo também usa a API Search nativa.
O caminho de conclusões de chat usa por padrão o modelo
`perplexity/sonar-pro`; substitua-o com
`plugins.entries.perplexity.config.webSearch.model`.

## Filtragem da API nativa

| Filtro                               | Descrição                                                               | Transporte      |
| ------------------------------------ | ----------------------------------------------------------------------- | --------------- |
| `count`                              | Resultados por pesquisa, 1-10 (padrão: 5)                               | Apenas nativo   |
| `freshness`                          | Intervalo de atualidade: `day`, `week`, `month`, `year`                 | Ambos           |
| `country`                            | Código de país de 2 letras (`us`, `de`, `jp`)                           | Apenas nativo   |
| `language`                           | Código de idioma ISO 639-1 (`en`, `fr`, `zh`)                           | Apenas nativo   |
| `date_after` / `date_before`         | Intervalo de datas de publicação em `YYYY-MM-DD`                        | Apenas nativo   |
| `domain_filter`                      | Máx. de 20 domínios; lista de permitidos ou de bloqueados com prefixo `-`, nunca misturadas | Apenas nativo |
| `max_tokens` / `max_tokens_per_page` | Orçamento de conteúdo em todos os resultados / por página               | Apenas nativo   |

Filtros exclusivos da API nativa retornam um erro descritivo no caminho de
conclusões de chat. `freshness` não pode ser combinado com
`date_after`/`date_before`.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    <Warning>
    Uma chave exportada apenas em um shell interativo não fica visível para um
    daemon do Gateway executado por launchd/systemd, a menos que esse ambiente
    seja importado explicitamente. Defina a chave em `~/.openclaw/.env` ou via
    `env.shellEnv` para que o processo do Gateway possa lê-la. Consulte
    [Variáveis de ambiente](/pt-BR/help/environment) para ver a ordem completa de
    precedência.
    </Warning>
  </Accordion>

  <Accordion title="Configuração do proxy OpenRouter">
    Para encaminhar pesquisas da Perplexity pelo OpenRouter, defina uma
    `OPENROUTER_API_KEY` (prefixo `sk-or-`) em vez de uma chave nativa da
    Perplexity. O OpenClaw detecta a chave e muda automaticamente para o
    transporte Sonar. Isso é útil se você já configurou o faturamento do
    OpenRouter e deseja consolidar os provedores nele.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Ferramenta de pesquisa com Perplexity" href="/pt-BR/tools/perplexity-search" icon="magnifying-glass">
    Como o agente realiza pesquisas com a Perplexity e interpreta os resultados.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração, incluindo entradas de Plugins.
  </Card>
</CardGroup>
