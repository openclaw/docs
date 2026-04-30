---
read_when:
    - Você quer configurar o Perplexity como um provedor de pesquisa na web
    - Você precisa da chave de API da Perplexity ou da configuração de proxy do OpenRouter
summary: Configuração do provedor de pesquisa na web Perplexity (chave de API, modos de pesquisa, filtragem)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T10:05:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

O Plugin Perplexity fornece recursos de busca na web por meio da API de Busca do Perplexity
ou do Perplexity Sonar via OpenRouter.

<Note>
Esta página é a configuração do **provedor** Perplexity. Para a **ferramenta** Perplexity (como o agente a usa), consulte [ferramenta Perplexity](/pt-BR/tools/perplexity-search).
</Note>

| Propriedade | Valor                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Tipo        | Provedor de busca na web (não é um provedor de modelo)                 |
| Auth        | `PERPLEXITY_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Caminho de configuração | `plugins.entries.perplexity.config.webSearch.apiKey`       |

## Introdução

<Steps>
  <Step title="Set the API key">
    Execute o fluxo interativo de configuração de busca na web:

    ```bash
    openclaw configure --section web
    ```

    Ou defina a chave diretamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Start searching">
    O agente usará automaticamente o Perplexity para buscas na web assim que a chave estiver
    configurada. Nenhuma etapa adicional é necessária.
  </Step>
</Steps>

## Modos de busca

O Plugin seleciona automaticamente o transporte com base no prefixo da chave de API:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Quando sua chave começa com `pplx-`, o OpenClaw usa a API de Busca Perplexity
    nativa. Esse transporte retorna resultados estruturados e oferece suporte a filtros
    de domínio, idioma e data (veja as opções de filtragem abaixo).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando sua chave começa com `sk-or-`, o OpenClaw encaminha por meio do OpenRouter usando
    o modelo Perplexity Sonar. Esse transporte retorna respostas sintetizadas por IA com
    citações.
  </Tab>
</Tabs>

| Prefixo da chave | Transporte                   | Recursos                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | API de Busca Perplexity nativa | Resultados estruturados, filtros de domínio/idioma/data |
| `sk-or-`   | OpenRouter (Sonar)           | Respostas sintetizadas por IA com citações       |

## Filtragem da API nativa

<Note>
As opções de filtragem só estão disponíveis ao usar a API Perplexity nativa
(chave `pplx-`). Buscas via OpenRouter/Sonar não oferecem suporte a esses parâmetros.
</Note>

Ao usar a API Perplexity nativa, as buscas oferecem suporte aos seguintes filtros:

| Filtro         | Descrição                              | Exemplo                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| País           | Código de país de 2 letras             | `us`, `de`, `jp`                    |
| Idioma         | Código de idioma ISO 639-1             | `en`, `fr`, `zh`                    |
| Intervalo de datas | Janela de recência                 | `day`, `week`, `month`, `year`      |
| Filtros de domínio | Lista de permissões ou de bloqueios (máx. 20 domínios) | `example.com`                       |
| Orçamento de conteúdo | Limites de tokens por resposta / por página | `max_tokens`, `max_tokens_per_page` |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    Se o OpenClaw Gateway for executado como daemon (launchd/systemd), certifique-se de que
    `PERPLEXITY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um daemon
    launchd/systemd, a menos que esse ambiente seja explicitamente importado. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy setup">
    Se você preferir encaminhar buscas do Perplexity pelo OpenRouter, defina uma
    `OPENROUTER_API_KEY` (prefixo `sk-or-`) em vez de uma chave Perplexity nativa.
    O OpenClaw detectará o prefixo e alternará para o transporte Sonar
    automaticamente.

    <Tip>
    O transporte OpenRouter é útil se você já tem uma conta OpenRouter
    e deseja cobrança consolidada entre vários provedores.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/pt-BR/tools/perplexity-search" icon="magnifying-glass">
    Como o agente invoca buscas do Perplexity e interpreta resultados.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração, incluindo entradas de Plugin.
  </Card>
</CardGroup>
