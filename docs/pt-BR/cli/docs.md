---
read_when:
    - Você quer pesquisar a documentação ativa do OpenClaw pelo terminal
    - Você precisa saber qual API de busca hospedada a CLI da documentação chama
summary: Referência da CLI para `openclaw docs` (pesquise no índice da documentação online)
title: Documentação
x-i18n:
    generated_at: "2026-06-27T17:19:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Pesquise o índice de documentação ativo do OpenClaw pelo terminal. O comando chama a API de busca da documentação do OpenClaw hospedada na Cloudflare e renderiza os resultados no seu terminal.

## Uso

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumentos:

| Argumento    | Descrição                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------ |
| `[query...]` | Consulta de busca em formato livre. Consultas com várias palavras são unidas com espaços e enviadas como uma só. |

## Exemplos

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Sem consulta, `openclaw docs` imprime a URL de entrada da documentação mais um comando de busca de exemplo em vez de executar uma busca.

## Como funciona

`openclaw docs` chama `https://docs.openclaw.ai/api/search` e renderiza os resultados JSON. A chamada de busca usa um tempo limite fixo de 30 segundos.

## Saída

Em um terminal rico (TTY), os resultados são renderizados como um título seguido por uma lista com marcadores. Cada marcador mostra o título da página, a URL vinculada da documentação e um trecho curto na linha seguinte. Resultados vazios imprimem "Nenhum resultado.".

Em saída não rica (redirecionada, `--no-color`, scripts), os mesmos dados são renderizados como Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Códigos de saída

| Código | Significado                                                       |
| ------ | ----------------------------------------------------------------- |
| `0`    | A busca foi bem-sucedida (incluindo respostas sem resultados).    |
| `1`    | A chamada à API de busca da documentação hospedada falhou; stderr é impresso embutido. |

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Documentação ativa](https://docs.openclaw.ai)
