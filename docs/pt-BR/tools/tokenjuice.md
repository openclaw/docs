---
read_when:
    - Você quer resultados mais curtos das ferramentas `exec` ou `bash` no OpenClaw
    - Você quer instalar ou habilitar o plugin Tokenjuice
    - Você precisa entender o que o Tokenjuice altera e o que ele deixa bruto
summary: Compacte resultados ruidosos das ferramentas exec e bash com o plugin opcional Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T15:45:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` é um plugin externo opcional que compacta resultados ruidosos das ferramentas `exec` e `bash`
depois que o comando já foi executado.

Ele altera o `tool_result` retornado, não o comando em si. O Tokenjuice não
reescreve a entrada do shell, não executa comandos novamente nem altera códigos de saída.

Atualmente, isso se aplica às execuções incorporadas do OpenClaw e às ferramentas dinâmicas do OpenClaw no
harness app-server do Codex. O Tokenjuice se conecta ao middleware de resultados de ferramentas do OpenClaw e
reduz a saída antes que ela retorne à sessão ativa do harness.

## Ativar o plugin

Instale uma vez:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Em seguida, ative-o:

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

- Compacta resultados ruidosos de `exec` e `bash` antes que sejam reenviados à sessão.
- Mantém a execução original do comando intacta.
- Aplica uma política de inventário seguro: leituras exatas do conteúdo de arquivos permanecem brutas, comandos independentes de inventário do repositório podem ser compactados e sequências mistas de comandos não seguras permanecem brutas.
- Continua sendo opcional: desative o plugin se quiser saída literal em todos os casos.

## Verificar se está funcionando

1. Ative o plugin.
2. Inicie uma sessão que possa chamar `exec`.
3. Execute um comando ruidoso, como `git status`.
4. Verifique se o resultado retornado pela ferramenta é mais curto e estruturado do que a saída bruta do shell.

## Desativar o plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou:

```bash
openclaw plugins disable tokenjuice
```

## Relacionados

- [Ferramenta Exec](/pt-BR/tools/exec)
- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Mecanismo de contexto](/pt-BR/concepts/context-engine)
