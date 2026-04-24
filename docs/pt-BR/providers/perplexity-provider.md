---
read_when:
    - Você quer configurar o Perplexity como provedor de busca web
    - Você precisa da chave de API do Perplexity ou da configuração de proxy do OpenRouter
summary: Configuração do provedor de busca web Perplexity (chave de API, modos de busca, filtragem)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T06:08:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Provedor de busca web)

O Plugin Perplexity oferece capacidades de busca na web por meio da API Perplexity
Search ou do Perplexity Sonar via OpenRouter.

<Note>
Esta página cobre a configuração do **provedor** Perplexity. Para a
**ferramenta** Perplexity (como o agente a usa), consulte [ferramenta Perplexity](/pt-BR/tools/perplexity-search).
</Note>

| Propriedade  | Valor                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Tipo         | Provedor de busca web (não é um provedor de modelo)                   |
| Auth         | `PERPLEXITY_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Caminho de configuração | `plugins.entries.perplexity.config.webSearch.apiKey`       |

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API">
    Execute o fluxo interativo de configuração de busca web:

    ```bash
    openclaw configure --section web
    ```

    Ou defina a chave diretamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Começar a pesquisar">
    O agente usará automaticamente o Perplexity para buscas na web assim que a chave estiver
    configurada. Nenhuma etapa adicional é necessária.
  </Step>
</Steps>

## Modos de busca

O Plugin seleciona automaticamente o transporte com base no prefixo da chave de API:

<Tabs>
  <Tab title="API nativa do Perplexity (pplx-)">
    Quando sua chave começa com `pplx-`, o OpenClaw usa a API nativa Perplexity Search.
    Esse transporte retorna resultados estruturados e oferece suporte a filtros de domínio, idioma
    e data (consulte as opções de filtragem abaixo).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando sua chave começa com `sk-or-`, o OpenClaw roteia via OpenRouter usando
    o modelo Perplexity Sonar. Esse transporte retorna respostas sintetizadas por IA com
    citações.
  </Tab>
</Tabs>

| Prefixo da chave | Transporte                    | Recursos                                         |
| ---------------- | ----------------------------- | ------------------------------------------------ |
| `pplx-`          | API nativa Perplexity Search  | Resultados estruturados, filtros de domínio/idioma/data |
| `sk-or-`         | OpenRouter (Sonar)            | Respostas sintetizadas por IA com citações       |

## Filtragem da API nativa

<Note>
As opções de filtragem estão disponíveis apenas ao usar a API nativa do Perplexity
(chave `pplx-`). Buscas via OpenRouter/Sonar não oferecem suporte a esses parâmetros.
</Note>

Ao usar a API nativa do Perplexity, as buscas oferecem suporte aos seguintes filtros:

| Filtro           | Descrição                              | Exemplo                             |
| ---------------- | -------------------------------------- | ----------------------------------- |
| País             | Código de país de 2 letras             | `us`, `de`, `jp`                    |
| Idioma           | Código de idioma ISO 639-1             | `en`, `fr`, `zh`                    |
| Intervalo de data | Janela de recência                    | `day`, `week`, `month`, `year`      |
| Filtros de domínio | Allowlist ou denylist (máx. 20 domínios) | `example.com`                    |
| Orçamento de conteúdo | Limites de token por resposta / por página | `max_tokens`, `max_tokens_per_page` |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o Gateway OpenClaw estiver em execução como daemon (launchd/systemd), certifique-se de que
    `PERPLEXITY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um
    daemon launchd/systemd, a menos que esse ambiente seja explicitamente importado. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway possa
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Configuração de proxy do OpenRouter">
    Se você preferir rotear buscas do Perplexity por meio do OpenRouter, defina
    `OPENROUTER_API_KEY` (prefixo `sk-or-`) em vez de uma chave nativa do Perplexity.
    O OpenClaw detectará o prefixo e mudará para o transporte Sonar
    automaticamente.

    <Tip>
    O transporte OpenRouter é útil se você já tem uma conta OpenRouter
    e quer cobrança consolidada entre vários provedores.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Ferramenta de busca Perplexity" href="/pt-BR/tools/perplexity-search" icon="magnifying-glass">
    Como o agente invoca buscas Perplexity e interpreta resultados.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração, incluindo entradas de Plugin.
  </Card>
</CardGroup>
