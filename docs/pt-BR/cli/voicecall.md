---
read_when:
    - Você usa o Plugin voice-call e quer todos os pontos de entrada da CLI
    - Você precisa de tabelas de flags e valores padrão para setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose e start
summary: Referência da CLI para `openclaw voicecall` (superfície de comandos do Plugin de chamada de voz)
title: Chamada de voz
x-i18n:
    generated_at: "2026-05-10T19:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` é um comando fornecido por Plugin. Ele aparece somente quando o Plugin voice-call está instalado e habilitado.

Quando o Gateway está em execução, os comandos operacionais (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) são roteados para o runtime de chamada de voz desse Gateway. Se nenhum Gateway estiver acessível, eles recorrem a um runtime CLI independente.

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

| Subcomando | Descrição                                                       |
| ---------- | --------------------------------------------------------------- |
| `setup`    | Mostra verificações de prontidão do provedor e do Webhook.      |
| `smoke`    | Executa verificações de prontidão; faz uma chamada de teste real somente com `--yes`. |
| `call`     | Inicia uma chamada de voz de saída.                             |
| `start`    | Alias para `call` com `--to` obrigatório e `--message` opcional. |
| `continue` | Fala uma mensagem e aguarda a próxima resposta.                 |
| `speak`    | Fala uma mensagem sem aguardar uma resposta.                    |
| `dtmf`     | Envia dígitos DTMF para uma chamada ativa.                      |
| `end`      | Desliga uma chamada ativa.                                      |
| `status`   | Inspeciona chamadas ativas (ou uma por `--call-id`).            |
| `tail`     | Acompanha `calls.jsonl` (útil durante testes de provedor).      |
| `latency`  | Resume métricas de latência de turno de `calls.jsonl`.          |
| `expose`   | Alterna Tailscale serve/funnel para o endpoint do Webhook.      |

## Configuração e smoke

### `setup`

Imprime verificações de prontidão legíveis por humanos por padrão. Passe `--json` para scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Executa as mesmas verificações de prontidão. Ele não fará uma chamada telefônica real a menos que `--to` e `--yes` estejam presentes.

| Flag               | Padrão                            | Descrição                                   |
| ------------------ | --------------------------------- | ------------------------------------------- |
| `-t, --to <phone>` | (nenhum)                          | Número de telefone para ligar em um smoke real. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Mensagem a ser falada durante a chamada smoke. |
| `--mode <mode>`    | `notify`                          | Modo da chamada: `notify` ou `conversation`. |
| `--yes`            | `false`                           | Faz de fato a chamada de saída real.        |
| `--json`           | `false`                           | Imprime JSON legível por máquina.           |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
Para provedores externos (`twilio`, `telnyx`, `plivo`), `setup` e `smoke` exigem uma URL pública de Webhook de `publicUrl`, um túnel ou exposição por Tailscale. Um fallback de loopback ou serve privado é rejeitado porque as operadoras não conseguem alcançá-lo.
</Note>

## Ciclo de vida da chamada

### `call`

Inicia uma chamada de voz de saída.

| Flag                   | Obrigatório | Padrão            | Descrição                                                                  |
| ---------------------- | ----------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | sim         | (nenhum)          | Mensagem a ser falada quando a chamada conectar.                           |
| `-t, --to <phone>`     | não         | config `toNumber` | Número de telefone E.164 para ligar.                                       |
| `--mode <mode>`        | não         | `conversation`    | Modo da chamada: `notify` (desliga após a mensagem) ou `conversation` (permanece aberta). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias para `call` com um formato de flags padrão diferente.

| Flag               | Obrigatório | Padrão         | Descrição                                      |
| ------------------ | ----------- | -------------- | ---------------------------------------------- |
| `--to <phone>`     | sim         | (nenhum)       | Número de telefone para ligar.                 |
| `--message <text>` | não         | (nenhum)       | Mensagem a ser falada quando a chamada conectar. |
| `--mode <mode>`    | não         | `conversation` | Modo da chamada: `notify` ou `conversation`.   |

### `continue`

Fala uma mensagem e aguarda uma resposta.

| Flag               | Obrigatório | Descrição          |
| ------------------ | ----------- | ------------------ |
| `--call-id <id>`   | sim         | ID da chamada.     |
| `--message <text>` | sim         | Mensagem a ser falada. |

### `speak`

Fala uma mensagem sem aguardar uma resposta.

| Flag               | Obrigatório | Descrição          |
| ------------------ | ----------- | ------------------ |
| `--call-id <id>`   | sim         | ID da chamada.     |
| `--message <text>` | sim         | Mensagem a ser falada. |

### `dtmf`

Envia dígitos DTMF para uma chamada ativa.

| Flag                | Obrigatório | Descrição                                  |
| ------------------- | ----------- | ------------------------------------------ |
| `--call-id <id>`    | sim         | ID da chamada.                             |
| `--digits <digits>` | sim         | Dígitos DTMF (por exemplo, `ww123456#` para esperas). |

### `end`

Desliga uma chamada ativa.

| Flag             | Obrigatório | Descrição      |
| ---------------- | ----------- | -------------- |
| `--call-id <id>` | sim         | ID da chamada. |

### `status`

Inspeciona chamadas ativas.

| Flag             | Padrão    | Descrição                         |
| ---------------- | --------- | --------------------------------- |
| `--call-id <id>` | (nenhum)  | Restringe a saída a uma chamada.  |
| `--json`         | `false`   | Imprime JSON legível por máquina. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Logs e métricas

### `tail`

Acompanha o log JSONL de chamadas de voz. Imprime as últimas `--since` linhas ao iniciar e, em seguida, transmite novas linhas conforme são gravadas.

| Flag            | Padrão                     | Descrição                                  |
| --------------- | -------------------------- | ------------------------------------------ |
| `--file <path>` | resolvido pelo store do Plugin | Caminho para `calls.jsonl`.             |
| `--since <n>`   | `25`                       | Linhas a imprimir antes de acompanhar.     |
| `--poll <ms>`   | `250` (mínimo 50)          | Intervalo de sondagem em milissegundos.    |

### `latency`

Resume métricas de latência de turno e espera de escuta de `calls.jsonl`. A saída é JSON com resumos de `recordsScanned`, `turnLatency` e `listenWait`.

| Flag            | Padrão                     | Descrição                                  |
| --------------- | -------------------------- | ------------------------------------------ |
| `--file <path>` | resolvido pelo store do Plugin | Caminho para `calls.jsonl`.             |
| `--last <n>`    | `200` (mínimo 1)           | Número de registros recentes a analisar.   |

## Expondo Webhooks

### `expose`

Habilita, desabilita ou altera a configuração de Tailscale serve/funnel para o Webhook de voz.

| Flag                  | Padrão                                    | Descrição                                     |
| --------------------- | ----------------------------------------- | --------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet) ou `funnel` (público). |
| `--path <path>`       | config `tailscale.path` ou `--serve-path` | Caminho Tailscale a expor.                    |
| `--port <port>`       | config `serve.port` ou `3334`             | Porta local do Webhook.                       |
| `--serve-path <path>` | config `serve.path` ou `/voice/webhook`   | Caminho local do Webhook.                     |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Exponha o endpoint do Webhook somente a redes em que você confia. Prefira Tailscale Serve em vez de Funnel quando possível.
</Warning>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)
