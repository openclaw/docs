---
read_when:
    - Você quer configurar o Perplexity como um provider de busca na web
    - Você precisa da chave de API do Perplexity ou da configuração de proxy do OpenRouter
summary: Configuração do provider de busca na web Perplexity (chave de API, modos de busca, filtragem)
title: Perplexity
x-i18n:
    generated_at: "2026-04-12T23:32:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55c089e96601ebe05480d305364272c7f0ac721caa79746297c73002a9f20f55
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Provider de busca na web)

O plugin Perplexity fornece capacidades de busca na web por meio da API de Busca do Perplexity
ou do Perplexity Sonar via OpenRouter.

<Note>
Esta página cobre a configuração do **provider** Perplexity. Para a **ferramenta**
Perplexity (como o agente a usa), consulte [ferramenta Perplexity](/pt-BR/tools/perplexity-search).
</Note>

| Propriedade   | Valor                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Tipo          | Provider de busca na web (não é um provider de modelo)                 |
| Autenticação  | `PERPLEXITY_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Caminho de configuração | `plugins.entries.perplexity.config.webSearch.apiKey`         |

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API">
    Execute o fluxo interativo de configuração de busca na web:

    ```bash
    openclaw configure --section web
    ```

    Ou defina a chave diretamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Comece a buscar">
    O agente usará automaticamente o Perplexity para buscas na web assim que a chave
    estiver configurada. Nenhuma etapa adicional é necessária.
  </Step>
</Steps>

## Modos de busca

O plugin seleciona automaticamente o transporte com base no prefixo da chave de API:

<Tabs>
  <Tab title="API nativa do Perplexity (pplx-)">
    Quando sua chave começa com `pplx-`, o OpenClaw usa a API de Busca nativa do Perplexity.
    Esse transporte retorna resultados estruturados e oferece suporte a filtros de domínio, idioma
    e data (veja as opções de filtragem abaixo).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Quando sua chave começa com `sk-or-`, o OpenClaw roteia por meio do OpenRouter usando
    o modelo Perplexity Sonar. Esse transporte retorna respostas sintetizadas por IA com
    citações.
  </Tab>
</Tabs>

| Prefixo da chave | Transporte                    | Recursos                                         |
| ---------------- | ----------------------------- | ------------------------------------------------ |
| `pplx-`          | API de Busca nativa do Perplexity | Resultados estruturados, filtros de domínio/idioma/data |
| `sk-or-`         | OpenRouter (Sonar)            | Respostas sintetizadas por IA com citações       |

## Filtragem da API nativa

<Note>
As opções de filtragem só estão disponíveis ao usar a API nativa do Perplexity
(chave `pplx-`). Buscas via OpenRouter/Sonar não oferecem suporte a esses parâmetros.
</Note>

Ao usar a API nativa do Perplexity, as buscas oferecem suporte aos seguintes filtros:

| Filtro         | Descrição                            | Exemplo                             |
| -------------- | ------------------------------------ | ----------------------------------- |
| País           | Código de país de 2 letras           | `us`, `de`, `jp`                    |
| Idioma         | Código de idioma ISO 639-1           | `en`, `fr`, `zh`                    |
| Intervalo de datas | Janela de recência                | `day`, `week`, `month`, `year`      |
| Filtros de domínio | Allowlist ou denylist (máximo de 20 domínios) | `example.com`            |
| Orçamento de conteúdo | Limites de tokens por resposta / por página | `max_tokens`, `max_tokens_per_page` |

## Observações avançadas

<AccordionGroup>
  <Accordion title="Variável de ambiente para processos daemon">
    Se o Gateway do OpenClaw rodar como daemon (launchd/systemd), garanta que
    `PERPLEXITY_API_KEY` esteja disponível para esse processo.

    <Warning>
    Uma chave definida apenas em `~/.profile` não ficará visível para um daemon
    launchd/systemd, a menos que esse ambiente seja importado explicitamente. Defina a chave em
    `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway possa
    lê-la.
    </Warning>

  </Accordion>

  <Accordion title="Configuração de proxy do OpenRouter">
    Se você preferir rotear buscas do Perplexity por meio do OpenRouter, defina uma
    `OPENROUTER_API_KEY` (prefixo `sk-or-`) em vez de uma chave nativa do Perplexity.
    O OpenClaw detectará o prefixo e mudará para o transporte Sonar
    automaticamente.

    <Tip>
    O transporte via OpenRouter é útil se você já tiver uma conta no OpenRouter
    e quiser cobrança consolidada entre vários providers.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Ferramenta de busca Perplexity" href="/pt-BR/tools/perplexity-search" icon="magnifying-glass">
    Como o agente invoca buscas Perplexity e interpreta os resultados.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração, incluindo entradas de plugin.
  </Card>
</CardGroup>
