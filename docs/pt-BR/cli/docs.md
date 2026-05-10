---
read_when:
    - Você quer pesquisar a documentação online do OpenClaw pelo terminal
    - Você precisa saber quais binários auxiliares a CLI da documentação invoca via shell
summary: Referência da CLI para `openclaw docs` (pesquise no índice ativo da documentação)
title: Documentação
x-i18n:
    generated_at: "2026-05-10T19:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Pesquise o índice de documentação ao vivo do OpenClaw pelo terminal. O comando chama o endpoint público de busca MCP da documentação hospedada no Mintlify em `https://docs.openclaw.ai/mcp.SearchOpenClaw` e exibe os resultados no seu terminal.

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

Sem consulta, `openclaw docs` imprime a URL do ponto de entrada da documentação mais um exemplo de comando de busca, em vez de executar uma busca.

## Como funciona

`openclaw docs` invoca a CLI `mcporter` para chamar a ferramenta MCP de busca da documentação e, em seguida, analisa os blocos `Title: / Link: / Content:` da saída da ferramenta em uma lista de resultados.

Para resolver `mcporter`, o OpenClaw verifica na ordem:

1. `mcporter` no `PATH` (usado diretamente se estiver presente).
2. `pnpm dlx mcporter ...` se `pnpm` estiver instalado.
3. `npx -y mcporter ...` se `npx` estiver instalado.

Se nenhum estiver disponível, o comando falha com uma dica para instalar `pnpm` (`npm install -g pnpm`).

A chamada de busca usa um tempo limite fixo de 30 segundos. Os trechos dos resultados são truncados para cerca de 220 caracteres por entrada.

## Saída

Em um terminal avançado (TTY), os resultados são exibidos como um título seguido por uma lista com marcadores. Cada marcador mostra o título da página, a URL vinculada da documentação e um trecho curto na linha seguinte. Resultados vazios imprimem "Nenhum resultado.".

Em saída sem recursos avançados (redirecionada por pipe, `--no-color`, scripts), os mesmos dados são exibidos como Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Códigos de saída

| Código | Significado                                                    |
| ------ | -------------------------------------------------------------- |
| `0`    | A busca foi bem-sucedida (incluindo respostas sem resultados). |
| `1`    | A chamada da ferramenta MCP falhou; a saída de erro padrão é impressa em linha. |

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Documentação ao vivo](https://docs.openclaw.ai)
