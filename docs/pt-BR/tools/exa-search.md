---
read_when:
    - Você deseja usar o Exa para web_search
    - Você precisa de uma EXA_API_KEY
    - Você quer busca neural ou extração de conteúdo
summary: Pesquisa do Exa AI — pesquisa neural e por palavras-chave com extração de conteúdo
title: Pesquisa Exa
x-i18n:
    generated_at: "2026-07-12T15:48:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) é um provedor de `web_search` com modos de pesquisa neural, por palavra-chave e
híbrida, além de extração de conteúdo integrada (destaques, texto,
resumos).

## Instalar o plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Obter uma chave de API

<Steps>
  <Step title="Criar uma conta">
    Cadastre-se em [exa.ai](https://exa.ai/) e gere uma chave de API no seu
    painel.
  </Step>
  <Step title="Armazenar a chave">
    Defina `EXA_API_KEY` no ambiente do Gateway ou configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuração

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // opcional se EXA_API_KEY estiver definida
            baseUrl: "https://api.exa.ai", // opcional; o OpenClaw acrescenta /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternativa por variável de ambiente:** defina `EXA_API_KEY` no ambiente do Gateway. Para
uma instalação do Gateway, coloque-a em `~/.openclaw/.env`. Consulte
[Variáveis de ambiente](/pt-BR/help/faq#env-vars-and-env-loading).

## Substituição da URL base

Defina `plugins.entries.exa.config.webSearch.baseUrl` para encaminhar as solicitações
de pesquisa da Exa por um proxy compatível ou endpoint alternativo. O OpenClaw
normaliza hosts sem protocolo prefixando `https://` e acrescenta `/search`, a menos que
o caminho já termine assim. O endpoint resolvido faz parte da chave do cache de
pesquisa, portanto os resultados de endpoints diferentes nunca são compartilhados.

## Parâmetros da ferramenta

<ParamField path="query" type="string" required>
Consulta de pesquisa.
</ParamField>

<ParamField path="count" type="number" default="5">
Resultados a retornar (1-100, sujeito aos limites do tipo de pesquisa da Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modo de pesquisa.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tempo. Não pode ser combinado com `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Resultados posteriores a esta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Resultados anteriores a esta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opções de extração de conteúdo (veja abaixo).
</ParamField>

### Extração de conteúdo

Passe um objeto `contents` para controlar o conteúdo extraído nos resultados:

```javascript
await web_search({
  query: "arquitetura de transformers explicada",
  type: "neural",
  contents: {
    text: true, // texto completo da página
    highlights: { numSentences: 3 }, // frases principais
    summary: true, // resumo gerado por IA
  },
});
```

| Opção de conteúdo | Tipo                                                                  | Descrição                        |
| ----------------- | --------------------------------------------------------------------- | -------------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Extrair o texto completo da página |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extrair frases principais        |
| `summary`         | `boolean \| { query }`                                                | Resumo gerado por IA             |

Se `contents` for omitido, a Exa usará `{ highlights: true }` por padrão, para que os resultados
incluam trechos com frases principais. As descrições dos resultados são obtidas primeiro dos destaques,
depois do resumo e, em seguida, do texto completo -- usando o primeiro que estiver disponível. Os resultados
também preservam os campos brutos `highlightScores` e `summary` da resposta da API da Exa,
quando disponíveis.

### Modos de pesquisa

| Modo             | Descrição                                  |
| ---------------- | ------------------------------------------ |
| `auto`           | A Exa escolhe o melhor modo (padrão)       |
| `neural`         | Pesquisa semântica/baseada em significado  |
| `fast`           | Pesquisa rápida por palavra-chave          |
| `deep`           | Pesquisa aprofundada e abrangente          |
| `deep-reasoning` | Pesquisa aprofundada com raciocínio        |
| `instant`        | Resultados mais rápidos                     |

## Observações

- `count` aceita até 100, sujeito aos limites do tipo de pesquisa da Exa.
- Os resultados são armazenados em cache por 15 minutos por padrão. Configure
  `tools.web.search.cacheTtlMinutes` (minutos) e
  `tools.web.search.timeoutSeconds` (padrão de 30s) compartilhados para alterar o cache e
  o tempo limite das solicitações de todos os provedores de `web_search`, incluindo a Exa.

## Relacionados

- [Visão geral da pesquisa na Web](/pt-BR/tools/web) -- todos os provedores e detecção automática
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com filtros de país/idioma
- [Perplexity Search](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
