---
read_when:
    - Você quer usar o Exa para `web_search`
    - Você precisa de um `EXA_API_KEY`
    - Você quer pesquisa neural ou extração de conteúdo
summary: Pesquisa Exa AI -- pesquisa neural e por palavra-chave com extração de conteúdo
title: Pesquisa Exa
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:16:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

O OpenClaw oferece suporte ao [Exa AI](https://exa.ai/) como provider de `web_search`. O Exa
oferece modos de pesquisa neural, por palavra-chave e híbrida com extração de conteúdo
integrada (highlights, texto, resumos).

## Obter uma chave de API

<Steps>
  <Step title="Criar uma conta">
    Cadastre-se em [exa.ai](https://exa.ai/) e gere uma chave de API no seu
    painel.
  </Step>
  <Step title="Armazenar a chave">
    Defina `EXA_API_KEY` no ambiente do Gateway, ou configure via:

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
            apiKey: "exa-...", // opcional se EXA_API_KEY estiver definido
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

**Alternativa por ambiente:** defina `EXA_API_KEY` no ambiente do Gateway.
Para uma instalação do gateway, coloque em `~/.openclaw/.env`.

## Parâmetros da ferramenta

<ParamField path="query" type="string" required>
Consulta de pesquisa.
</ParamField>

<ParamField path="count" type="number">
Resultados a retornar (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Modo de pesquisa.
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

O Exa pode retornar conteúdo extraído junto com os resultados da pesquisa. Passe um
objeto `contents` para ativar:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // texto completo da página
    highlights: { numSentences: 3 }, // frases principais
    summary: true, // resumo por IA
  },
});
```

| Opção de conteúdo | Tipo                                                                  | Descrição                 |
| ----------------- | --------------------------------------------------------------------- | ------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Extrai o texto completo da página |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extrai frases principais  |
| `summary`         | `boolean \| { query }`                                                | Resumo gerado por IA      |

### Modos de pesquisa

| Modo             | Descrição                              |
| ---------------- | -------------------------------------- |
| `auto`           | O Exa escolhe o melhor modo (padrão)   |
| `neural`         | Pesquisa semântica/baseada em significado |
| `fast`           | Pesquisa rápida por palavra-chave      |
| `deep`           | Pesquisa profunda e detalhada          |
| `deep-reasoning` | Pesquisa profunda com raciocínio       |
| `instant`        | Resultados mais rápidos                |

## Observações

- Se nenhuma opção `contents` for fornecida, o Exa usa por padrão `{ highlights: true }`
  para que os resultados incluam trechos com frases principais
- Os resultados preservam campos `highlightScores` e `summary` da
  resposta da API do Exa quando disponíveis
- Descrições dos resultados são resolvidas a partir de highlights primeiro, depois summary, depois
  texto completo — o que estiver disponível
- `freshness` e `date_after`/`date_before` não podem ser combinados — use apenas um
  modo de filtro temporal
- Até 100 resultados podem ser retornados por consulta (sujeito aos limites
  do tipo de pesquisa do Exa)
- Os resultados ficam em cache por 15 minutos por padrão (configurável via
  `cacheTtlMinutes`)
- Exa é uma integração oficial de API com respostas JSON estruturadas

## Relacionado

- [Visão geral de pesquisa na web](/pt-BR/tools/web) -- todos os providers e autodetecção
- [Brave Search](/pt-BR/tools/brave-search) -- resultados estruturados com filtros de país/idioma
- [Perplexity Search](/pt-BR/tools/perplexity-search) -- resultados estruturados com filtragem por domínio
