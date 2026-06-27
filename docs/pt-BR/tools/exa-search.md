---
read_when:
    - Você quer usar Exa para web_search
    - Você precisa de uma EXA_API_KEY
    - Você quer busca neural ou extração de conteúdo
summary: Exa AI Search -- busca neural e por palavra-chave com extração de conteúdo
title: Pesquisa Exa
x-i18n:
    generated_at: "2026-06-27T18:14:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

O OpenClaw oferece suporte à [Exa AI](https://exa.ai/) como provedor de `web_search`. A Exa
oferece modos de busca neural, por palavra-chave e híbrida com extração de conteúdo
integrada (destaques, texto, resumos).

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

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
    Defina `EXA_API_KEY` no ambiente do Gateway ou configure via:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Alternativa de ambiente:** defina `EXA_API_KEY` no ambiente do Gateway.
Para uma instalação do gateway, coloque-a em `~/.openclaw/.env`.

## Substituição da URL base

Defina `plugins.entries.exa.config.webSearch.baseUrl` quando as solicitações de busca da Exa
devem passar por um proxy compatível ou endpoint alternativo da Exa. O OpenClaw
normaliza hosts simples prefixando `https://` e acrescenta `/search`, a menos que o
caminho já termine ali. O endpoint resolvido é incluído na chave do cache de busca,
então os resultados de diferentes endpoints da Exa não são compartilhados.

## Parâmetros da ferramenta

<ParamField path="query" type="string" required>
Consulta de busca.
</ParamField>

<ParamField path="count" type="number">
Resultados a retornar (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modo de busca.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtro de tempo.
</ParamField>

<ParamField path="date_after" type="string">
Resultados após esta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Resultados antes desta data (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opções de extração de conteúdo (veja abaixo).
</ParamField>

### Extração de conteúdo

A Exa pode retornar conteúdo extraído junto com os resultados da busca. Passe um objeto `contents`
para habilitar:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Opção de contents | Tipo                                                                  | Descrição                     |
| ----------------- | --------------------------------------------------------------------- | ----------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Extrair texto completo da página |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extrair frases principais     |
| `summary`         | `boolean \| { query }`                                                | Resumo gerado por IA          |

### Modos de busca

| Modo             | Descrição                              |
| ---------------- | -------------------------------------- |
| `auto`           | A Exa escolhe o melhor modo (padrão)   |
| `neural`         | Busca semântica/baseada em significado |
| `fast`           | Busca rápida por palavra-chave         |
| `deep`           | Busca profunda minuciosa               |
| `deep-reasoning` | Busca profunda com raciocínio          |
| `instant`        | Resultados mais rápidos                |

## Observações

- Se nenhuma opção `contents` for fornecida, a Exa usa `{ highlights: true }` por padrão
  para que os resultados incluam trechos de frases principais
- Os resultados preservam os campos `highlightScores` e `summary` da resposta da API da Exa
  quando disponíveis
- As descrições dos resultados são resolvidas primeiro a partir dos destaques, depois do resumo e então
  do texto completo — o que estiver disponível
- `freshness` e `date_after`/`date_before` não podem ser combinados — use um
  modo de filtro de tempo
- Até 100 resultados podem ser retornados por consulta (sujeito aos limites de
  tipo de busca da Exa)
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável via
  `cacheTtlMinutes`)
- A Exa é uma integração oficial de API com respostas JSON estruturadas

## Relacionado

- [Visão geral de Web Search](/pt-BR/tools/web) -- todos os provedores e autodetecção
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com filtros de país/idioma
- [Perplexity Search](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
