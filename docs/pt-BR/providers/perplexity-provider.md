---
read_when:
    - Você deseja configurar o Perplexity como um provedor de pesquisa na web
    - Você precisa da chave da API Perplexity ou da configuração de proxy do OpenRouter
summary: Configuração do provedor de pesquisa na web Perplexity (chave de API, modos de pesquisa, filtragem)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:05:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

O Plugin Perplexity fornece recursos de pesquisa na web por meio da API de Pesquisa
Perplexity ou do Perplexity Sonar via OpenRouter.

<Note>
Esta página é a configuração do **provedor** Perplexity. Para a **ferramenta** Perplexity (como o agente a usa), consulte [ferramenta Perplexity](/pt-BR/tools/perplexity-search).
</Note>

| Propriedade           | Valor                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Tipo                  | Provedor de pesquisa na web (não é um provedor de modelo)              |
| Autenticação          | `PERPLEXITY_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Caminho de configuração | `plugins.entries.perplexity.config.webSearch.apiKey`                 |

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Set the API key">
    Execute o fluxo interativo de configuração de pesquisa na web:

    ```bash
    openclaw configure --section web
    ```

    Ou defina a chave diretamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Start searching">
    O agente usará automaticamente o Perplexity para pesquisas na web assim que a
    chave estiver configurada. Nenhuma etapa adicional é necessária.
  </Step>
</Steps>

## Modos de pesquisa

O Plugin seleciona automaticamente o transporte com base no prefixo da chave de API:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Quando sua chave começa com `pplx-`, o OpenClaw usa a API de Pesquisa
    Perplexity nativa. Esse transporte retorna resultados estruturados e oferece suporte a filtros de domínio, idioma
    e data (consulte as opções de filtragem abaixo).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando sua chave começa com `sk-or-`, o OpenClaw roteia por meio do OpenRouter usando
    o modelo Perplexity Sonar. Esse transporte retorna respostas sintetizadas por IA com
    citações.
  </Tab>
</Tabs>

| Prefixo da chave | Transporte                  | Recursos                                                |
| ---------------- | --------------------------- | ------------------------------------------------------- |
| `pplx-`          | API de Pesquisa Perplexity nativa | Resultados estruturados, filtros de domínio/idioma/data |
| `sk-or-`         | OpenRouter (Sonar)          | Respostas sintetizadas por IA com citações              |

## Filtragem da API nativa

<Note>
As opções de filtragem só estão disponíveis ao usar a API Perplexity nativa
(chave `pplx-`). Pesquisas via OpenRouter/Sonar não oferecem suporte a esses parâmetros.
</Note>

Ao usar a API Perplexity nativa, as pesquisas oferecem suporte aos seguintes filtros:

| Filtro              | Descrição                                  | Exemplo                             |
| ------------------- | ------------------------------------------ | ----------------------------------- |
| País                | Código de país de 2 letras                 | `us`, `de`, `jp`                    |
| Idioma              | Código de idioma ISO 639-1                 | `en`, `fr`, `zh`                    |
| Intervalo de datas  | Janela de recência                         | `day`, `week`, `month`, `year`      |
| Filtros de domínio  | Lista de permissões ou de bloqueio (máx. 20 domínios) | `example.com`                       |
| Orçamento de conteúdo | Limites de tokens por resposta / por página | `max_tokens`, `max_tokens_per_page` |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    Se o Gateway do OpenClaw for executado como um daemon (launchd/systemd), garanta que
    `PERPLEXITY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave exportada apenas em um shell interativo não ficará visível para um
    daemon launchd/systemd, a menos que esse ambiente seja importado explicitamente. Defina
    a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway
    possa lê-la.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy setup">
    Se preferir rotear pesquisas do Perplexity por meio do OpenRouter, defina uma
    `OPENROUTER_API_KEY` (prefixo `sk-or-`) em vez de uma chave Perplexity nativa.
    O OpenClaw detectará o prefixo e alternará para o transporte Sonar
    automaticamente.

    <Tip>
    O transporte OpenRouter é útil se você já tem uma conta OpenRouter
    e quer faturamento consolidado entre vários provedores.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/pt-BR/tools/perplexity-search" icon="magnifying-glass">
    Como o agente invoca pesquisas do Perplexity e interpreta os resultados.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração, incluindo entradas de Plugin.
  </Card>
</CardGroup>
