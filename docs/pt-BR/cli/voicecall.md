---
read_when:
    - Você usa o plugin de chamadas de voz e quer todos os pontos de entrada da CLI
    - Você precisa de tabelas de flags e valores padrão para setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose e start
summary: Referência da CLI para `openclaw voicecall` (interface de comandos do plugin de chamadas de voz)
title: Chamada de voz
x-i18n:
    generated_at: "2026-07-11T23:50:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` é um comando fornecido por um Plugin. Ele só aparece quando o Plugin de chamadas de voz está instalado e habilitado.

Quando o Gateway está em execução, os comandos operacionais (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) são encaminhados ao ambiente de execução de chamadas de voz desse Gateway. Se nenhum Gateway estiver acessível, eles recorrem a um ambiente de execução autônomo da CLI.

## Subcomandos

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Subcomando | Descrição                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| `setup`    | Exibe verificações de prontidão do provedor e do Webhook.                      |
| `smoke`    | Executa verificações de prontidão; faz uma chamada de teste real só com `--yes`. |
| `call`     | Inicia uma chamada de voz de saída.                                            |
| `start`    | Alias de `call`, com `--to` obrigatório e `--message` opcional.                |
| `continue` | Fala uma mensagem e aguarda a próxima resposta.                                |
| `speak`    | Fala uma mensagem sem aguardar uma resposta.                                   |
| `dtmf`     | Envia dígitos DTMF para uma chamada ativa.                                     |
| `end`      | Encerra uma chamada ativa.                                                     |
| `status`   | Inspeciona chamadas ativas (ou uma chamada por `--call-id`).                   |
| `tail`     | Acompanha `calls.jsonl` (útil durante testes do provedor).                     |
| `latency`  | Resume métricas de latência dos turnos de `calls.jsonl`.                       |
| `expose`   | Alterna o Tailscale Serve/Funnel para o endpoint do Webhook.                   |

## Configuração e teste de fumaça

### `setup`

Por padrão, imprime verificações de prontidão legíveis por humanos. Passe `--json` para uso em scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Executa as mesmas verificações de prontidão. Faz uma chamada telefônica real somente quando `--to` e `--yes` estão presentes.

| Opção              | Padrão                            | Descrição                                              |
| ------------------ | --------------------------------- | ------------------------------------------------------ |
| `-t, --to <phone>` | (nenhum)                          | Número de telefone para uma chamada de teste real.     |
| `--message <text>` | `OpenClaw voice call smoke test.` | Mensagem a ser falada durante a chamada de teste.      |
| `--mode <mode>`    | `notify`                          | Modo da chamada: `notify` ou `conversation`.           |
| `--yes`            | `false`                           | Efetivamente faz a chamada de saída real.              |
| `--json`           | `false`                           | Imprime JSON legível por máquina.                      |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # simulação
openclaw voicecall smoke --to "+15555550123" --yes  # chamada real de notificação
```

<Note>
Para provedores externos (`plivo`, `telnyx`, `twilio`), `setup` e `smoke` exigem uma URL pública de Webhook proveniente de `publicUrl`, um túnel ou exposição via Tailscale. Um fallback de serviço por local loopback ou privado é rejeitado porque as operadoras não conseguem acessá-lo.
</Note>

## Ciclo de vida da chamada

### `call`

Inicia uma chamada de voz de saída.

| Opção                  | Obrigatória | Padrão            | Descrição                                                                                           |
| ---------------------- | ----------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `-m, --message <text>` | sim         | (nenhum)          | Mensagem a ser falada quando a chamada for conectada.                                               |
| `-t, --to <phone>`     | não         | config `toNumber` | Número de telefone E.164 a ser chamado.                                                             |
| `--mode <mode>`        | não         | `conversation`    | Modo da chamada: `notify` (encerra após a mensagem) ou `conversation` (mantém a chamada aberta).    |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias de `call` com um formato padrão de opções diferente.

| Opção              | Obrigatória | Padrão         | Descrição                                             |
| ------------------ | ----------- | -------------- | ----------------------------------------------------- |
| `--to <phone>`     | sim         | (nenhum)       | Número de telefone a ser chamado.                     |
| `--message <text>` | não         | (nenhum)       | Mensagem a ser falada quando a chamada for conectada. |
| `--mode <mode>`    | não         | `conversation` | Modo da chamada: `notify` ou `conversation`.          |

### `continue`

Fala uma mensagem e aguarda uma resposta.

| Opção              | Obrigatória | Descrição          |
| ------------------ | ----------- | ------------------ |
| `--call-id <id>`   | sim         | ID da chamada.     |
| `--message <text>` | sim         | Mensagem a falar.  |

### `speak`

Fala uma mensagem sem aguardar uma resposta.

| Opção              | Obrigatória | Descrição          |
| ------------------ | ----------- | ------------------ |
| `--call-id <id>`   | sim         | ID da chamada.     |
| `--message <text>` | sim         | Mensagem a falar.  |

### `dtmf`

Envia dígitos DTMF para uma chamada ativa.

| Opção               | Obrigatória | Descrição                                                |
| ------------------- | ----------- | -------------------------------------------------------- |
| `--call-id <id>`    | sim         | ID da chamada.                                           |
| `--digits <digits>` | sim         | Dígitos DTMF (por exemplo, `ww123456#` para esperas).     |

### `end`

Encerra uma chamada ativa.

| Opção            | Obrigatória | Descrição      |
| ---------------- | ----------- | -------------- |
| `--call-id <id>` | sim         | ID da chamada. |

### `status`

Inspeciona chamadas ativas.

| Opção            | Padrão   | Descrição                            |
| ---------------- | -------- | ------------------------------------ |
| `--call-id <id>` | (nenhum) | Restringe a saída a uma chamada.     |
| `--json`         | `false`  | Imprime JSON legível por máquina.    |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Logs e métricas

### `tail`

Acompanha o log JSONL de chamadas de voz. Ao iniciar, imprime as últimas `--since` linhas e, em seguida, transmite as novas linhas à medida que são gravadas.

| Opção           | Padrão                               | Descrição                                     |
| --------------- | ------------------------------------ | --------------------------------------------- |
| `--file <path>` | resolvido a partir do armazenamento do Plugin | Caminho para `calls.jsonl`.          |
| `--since <n>`   | `25`                                 | Linhas a imprimir antes do acompanhamento.    |
| `--poll <ms>`   | `250` (mínimo de 50)                 | Intervalo de consulta em milissegundos.        |

### `latency`

Resume as métricas de latência dos turnos e de espera de escuta de `calls.jsonl`. A saída é um JSON com resumos de `recordsScanned`, `turnLatency` e `listenWait`.

| Opção           | Padrão                               | Descrição                                    |
| --------------- | ------------------------------------ | -------------------------------------------- |
| `--file <path>` | resolvido a partir do armazenamento do Plugin | Caminho para `calls.jsonl`.         |
| `--last <n>`    | `200` (mínimo de 1)                  | Número de registros recentes a analisar.     |

## Exposição de Webhooks

### `expose`

Habilita, desabilita ou altera a configuração de Tailscale Serve/Funnel para o Webhook de voz.

| Opção                 | Padrão                                     | Descrição                                            |
| --------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                   | `off`, `serve` (tailnet) ou `funnel` (público).      |
| `--path <path>`       | config `tailscale.path` ou `--serve-path`  | Caminho do Tailscale a ser exposto.                  |
| `--port <port>`       | config `serve.port` ou `3334`              | Porta local do Webhook.                              |
| `--serve-path <path>` | config `serve.path` ou `/voice/webhook`    | Caminho local do Webhook.                            |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Exponha o endpoint do Webhook somente a redes nas quais você confia. Prefira o Tailscale Serve ao Funnel quando possível.
</Warning>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Plugin de chamadas de voz](/pt-BR/plugins/voice-call)
