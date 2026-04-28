---
read_when:
    - Você quer configurar o Perplexity como um provedor de pesquisa na web
    - Você precisa da chave de API do Perplexity ou da configuração de proxy do OpenRouter
summary: Configuração do provedor de pesquisa na web Perplexity (chave de API, modos de pesquisa, filtragem)
title: Perplexity
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T13:54:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

O Plugin Perplexity fornece recursos de pesquisa na web por meio da
API de Pesquisa do Perplexity ou do Perplexity Sonar via OpenRouter.

<Note>
Esta página cobre a configuração do **provedor** Perplexity. Para a **ferramenta**
Perplexity (como o agente a utiliza), consulte [ferramenta Perplexity](/pt-BR/tools/perplexity-search).
</Note>

| Property    | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Provedor de pesquisa na web (não é um provedor de modelo)             |
| Auth        | `PERPLEXITY_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Config path | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API">
    Execute o fluxo interativo de configuração de pesquisa na web:

    ```bash
    openclaw configure --section web
    ```

    Ou defina a chave diretamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Comece a pesquisar">
    O agente usará automaticamente o Perplexity para pesquisas na web assim que a chave
    estiver configurada. Nenhuma etapa adicional é necessária.
  </Step>
</Steps>

## Modos de pesquisa

O Plugin seleciona automaticamente o transporte com base no prefixo da chave de API:

<Tabs>
  <Tab title="API nativa do Perplexity (pplx-)">
    Quando sua chave começa com `pplx-`, o OpenClaw usa a API nativa de Pesquisa do Perplexity.
    Esse transporte retorna resultados estruturados e oferece suporte a filtros de domínio, idioma
    e data (consulte as opções de filtragem abaixo).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando sua chave começa com `sk-or-`, o OpenClaw roteia por meio do OpenRouter usando
    o modelo Perplexity Sonar. Esse transporte retorna respostas sintetizadas por IA com
    citações.
  </Tab>
</Tabs>

| Key prefix | Transport                    | Features                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | API nativa de Pesquisa do Perplexity | Resultados estruturados, filtros de domínio/idioma/data |
| `sk-or-`   | OpenRouter (Sonar)           | Respostas sintetizadas por IA com citações       |

## Filtragem da API nativa

<Note>
As opções de filtragem estão disponíveis somente ao usar a API nativa do Perplexity
(chave `pplx-`). Pesquisas com OpenRouter/Sonar não oferecem suporte a esses parâmetros.
</Note>

Ao usar a API nativa do Perplexity, as pesquisas oferecem suporte aos seguintes filtros:

| Filter         | Description                            | Example                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Country        | Código de país de 2 letras             | `us`, `de`, `jp`                    |
| Language       | Código de idioma ISO 639-1             | `en`, `fr`, `zh`                    |
| Date range     | Janela de recência                     | `day`, `week`, `month`, `year`      |
| Domain filters | Lista de permissão ou bloqueio (máx. 20 domínios) | `example.com`            |
| Content budget | Limites de tokens por resposta / por página | `max_tokens`, `max_tokens_per_page` |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o OpenClaw Gateway for executado como um daemon (launchd/systemd), certifique-se de que
    `PERPLEXITY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um daemon launchd/systemd,
    a menos que esse ambiente seja importado explicitamente. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway possa
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Configuração de proxy do OpenRouter">
    Se você preferir rotear pesquisas do Perplexity por meio do OpenRouter, defina uma
    `OPENROUTER_API_KEY` (prefixo `sk-or-`) em vez de uma chave nativa do Perplexity.
    O OpenClaw detectará o prefixo e mudará automaticamente para o transporte Sonar.

    <Tip>
    O transporte do OpenRouter é útil se você já tiver uma conta OpenRouter
    e quiser faturamento consolidado entre vários provedores.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Ferramenta de pesquisa Perplexity" href="/pt-BR/tools/perplexity-search" icon="magnifying-glass">
    Como o agente invoca pesquisas do Perplexity e interpreta os resultados.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração, incluindo entradas de Plugin.
  </Card>
</CardGroup>
