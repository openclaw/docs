---
read_when:
    - Você quer resultados de ferramenta `exec` ou `bash` mais curtos no OpenClaw
    - Você quer instalar ou habilitar o Plugin Tokenjuice
    - Você precisa entender o que tokenjuice altera e o que ele deixa bruto
summary: Compacte resultados ruidosos das ferramentas exec e bash com o Plugin opcional Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` é um plugin externo opcional que compacta resultados ruidosos das ferramentas `exec` e `bash`
depois que o comando já foi executado.

Ele altera o `tool_result` retornado, não o comando em si. O Tokenjuice não
reescreve a entrada do shell, não executa comandos novamente nem altera códigos de saída.

Hoje isso se aplica a execuções incorporadas do OpenClaw e a ferramentas dinâmicas do OpenClaw no harness app-server do Codex. O Tokenjuice se conecta ao middleware de resultados de ferramenta do OpenClaw e
reduz a saída antes que ela volte para a sessão ativa do harness.

## Habilitar o plugin

Instale uma vez:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Em seguida, habilite-o:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

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
- Mantém a execução original do comando intacta.
- Preserva leituras exatas de conteúdo de arquivos e outros comandos que o tokenjuice deve deixar brutos.
- Permanece opcional: desabilite o plugin se quiser saída literal em todos os lugares.

## Verificar se está funcionando

1. Habilite o plugin.
2. Inicie uma sessão que possa chamar `exec`.
3. Execute um comando ruidoso, como `git status`.
4. Verifique se o resultado retornado pela ferramenta está mais curto e mais estruturado do que a saída bruta do shell.

## Desabilitar o plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou:

```bash
openclaw plugins disable tokenjuice
```

## Relacionados

- [Ferramenta Exec](/pt-BR/tools/exec)
- [Níveis de pensamento](/pt-BR/tools/thinking)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
