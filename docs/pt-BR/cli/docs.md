---
read_when:
    - Você quer pesquisar a documentação atual do OpenClaw pelo terminal
    - Você precisa saber qual API de pesquisa hospedada a CLI de documentação chama
summary: Referência da CLI para `openclaw docs` (pesquise no índice da documentação atual)
title: Documentação
x-i18n:
    generated_at: "2026-07-11T23:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Pesquise o índice ativo da documentação do OpenClaw pelo terminal.

## Uso

```bash
openclaw docs                       # exibe o ponto de entrada da documentação e um exemplo de pesquisa
openclaw docs <query...>            # pesquisa o índice ativo da documentação
```

| Argumento    | Descrição                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `[query...]` | Consulta de pesquisa em formato livre. Consultas com várias palavras são unidas com espaços e enviadas como uma única consulta. |

Sem uma consulta, `openclaw docs` exibe a URL do ponto de entrada da documentação e um comando de pesquisa de exemplo, em vez de executar uma pesquisa.

## Exemplos

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Como funciona

`openclaw docs` chama `https://docs.openclaw.ai/api/search` e renderiza os resultados em JSON. A solicitação de pesquisa usa um tempo limite fixo de 30 segundos.

## Saída

Em um terminal com formatação avançada (TTY), os resultados são renderizados como um título seguido por uma lista com marcadores: título da página, URL vinculada da documentação e um pequeno trecho na linha seguinte. Quando não há resultados, é exibido "Nenhum resultado.".

Em uma saída sem formatação avançada (redirecionada por pipe, `--no-color`, scripts), os mesmos dados são renderizados como Markdown:

```markdown
# Pesquisa na documentação: <query>

- [Título](https://docs.openclaw.ai/...) - trecho
- [Título](https://docs.openclaw.ai/...) - trecho
```

## Códigos de saída

| Código | Significado                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------- |
| `0`    | A pesquisa foi concluída com sucesso, incluindo respostas sem resultados.                       |
| `1`    | A chamada à API hospedada de pesquisa da documentação falhou; stderr exibe a mensagem de erro. |

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Documentação ativa](https://docs.openclaw.ai)
