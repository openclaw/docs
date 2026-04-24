---
read_when:
    - Você quer resultados mais curtos de ferramentas `exec` ou `bash` no OpenClaw
    - Você quer habilitar o Plugin empacotado tokenjuice
    - Você precisa entender o que o tokenjuice altera e o que ele mantém bruto
summary: Compacte resultados ruidosos das ferramentas exec e bash com um Plugin empacotado opcional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T06:19:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` é um Plugin empacotado opcional que compacta resultados ruidosos das ferramentas `exec` e `bash`
depois que o comando já foi executado.

Ele altera o `tool_result` retornado, não o comando em si. O Tokenjuice não
reescreve a entrada do shell, não executa comandos novamente nem altera códigos de saída.

Hoje isso se aplica a execuções embarcadas no Pi, em que o Tokenjuice usa hook no caminho de `tool_result`
embarcado e reduz a saída que volta para a sessão.

## Habilitar o Plugin

Caminho rápido:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

O OpenClaw já envia o Plugin. Não há uma etapa separada de `plugins install`
ou `tokenjuice install openclaw`.

Se você preferir editar a configuração diretamente:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## O que o Tokenjuice altera

- Compacta resultados ruidosos de `exec` e `bash` antes de serem enviados de volta para a sessão.
- Mantém intacta a execução original do comando.
- Preserva leituras exatas de conteúdo de arquivo e outros comandos que o Tokenjuice deve manter brutos.
- Continua sendo opt-in: desabilite o Plugin se quiser saída literal em todos os lugares.

## Verificar se está funcionando

1. Habilite o Plugin.
2. Inicie uma sessão que possa chamar `exec`.
3. Execute um comando ruidoso como `git status`.
4. Verifique se o resultado retornado da ferramenta está mais curto e mais estruturado do que a saída bruta do shell.

## Desabilitar o Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou:

```bash
openclaw plugins disable tokenjuice
```

## Relacionados

- [Exec tool](/pt-BR/tools/exec)
- [Thinking levels](/pt-BR/tools/thinking)
- [Context engine](/pt-BR/concepts/context-engine)
