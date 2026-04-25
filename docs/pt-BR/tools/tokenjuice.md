---
read_when:
    - Você quer resultados mais curtos da ferramenta `exec` ou `bash` no OpenClaw
    - Você quer habilitar o Plugin tokenjuice incluído
    - Você precisa entender o que o tokenjuice altera e o que ele deixa bruto
summary: Compactar resultados ruidosos de exec e da ferramenta bash com um Plugin incluído opcional
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T13:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` é um Plugin incluído opcional que compacta resultados ruidosos das ferramentas `exec` e `bash`
depois que o comando já foi executado.

Ele altera o `tool_result` retornado, não o comando em si. O Tokenjuice não
reescreve a entrada do shell, não executa novamente comandos nem altera códigos de saída.

Hoje isso se aplica a execuções incorporadas do Pi e a ferramentas dinâmicas do OpenClaw
no harness app-server do Codex. O Tokenjuice se conecta ao middleware de resultado de ferramenta do OpenClaw e
reduz a saída antes que ela volte para a sessão ativa do harness.

## Habilitar o Plugin

Caminho rápido:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

O OpenClaw já inclui o Plugin. Não existe uma etapa separada de `plugins install`
ou `tokenjuice install openclaw`.

Se preferir editar a configuração diretamente:

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

## O que o tokenjuice altera

- Compacta resultados ruidosos de `exec` e `bash` antes que eles sejam devolvidos para a sessão.
- Mantém intacta a execução original do comando.
- Preserva leituras exatas de conteúdo de arquivos e outros comandos que o tokenjuice deve deixar brutos.
- Continua opcional: desative o Plugin se quiser saída literal em todos os lugares.

## Verificar se está funcionando

1. Habilite o Plugin.
2. Inicie uma sessão que possa chamar `exec`.
3. Execute um comando ruidoso, como `git status`.
4. Verifique se o resultado retornado da ferramenta está mais curto e mais estruturado do que a saída bruta do shell.

## Desabilitar o Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou:

```bash
openclaw plugins disable tokenjuice
```

## Relacionado

- [Ferramenta Exec](/pt-BR/tools/exec)
- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Motor de contexto](/pt-BR/concepts/context-engine)
