---
read_when:
    - Adição ou modificação do comportamento de execução em segundo plano
    - Depuração de tarefas exec de longa duração
summary: Execução em segundo plano e gerenciamento de processos
title: Execução em segundo plano e ferramenta de processos
x-i18n:
    generated_at: "2026-07-11T23:54:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

O OpenClaw executa comandos de shell por meio da ferramenta `exec` e mantém tarefas de longa duração na memória. A ferramenta `process` gerencia essas sessões em segundo plano.

## Ferramenta exec

Parâmetros:

| Parâmetro    | Descrição                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `command`    | Obrigatório. Comando de shell a ser executado.                                                                                                                                                   |
| `workdir`    | Diretório de trabalho; omita para usar o diretório de trabalho atual padrão.                                                                                                                      |
| `env`        | Variáveis de ambiente adicionais para o comando.                                                                                                                                                 |
| `yieldMs`    | Milissegundos de espera antes de passar para segundo plano (padrão: 10000).                                                                                                                       |
| `background` | Executa imediatamente em segundo plano.                                                                                                                                                          |
| `timeout`    | Tempo limite em segundos (padrão: `tools.exec.timeoutSec`); encerra o processo quando expira. Defina `timeout: 0` para desativar o tempo limite do processo exec nessa chamada.                    |
| `pty`        | Executa em um pseudoterminal quando disponível (CLIs que exigem TTY, agentes de programação).                                                                                                    |
| `elevated`   | Executa fora do sandbox se o modo elevado estiver habilitado/permitido (`gateway` por padrão ou `node` quando o destino de exec for `node`).                                                      |
| `host`       | Destino de exec: `auto`, `sandbox`, `gateway` ou `node`.                                                                                                                                         |
| `node`       | ID/nome do Node, usado com `host: "node"`.                                                                                                                                                       |

Comportamento:

- Execuções em primeiro plano retornam a saída diretamente.
- Quando executada em segundo plano (explicitamente ou devido ao tempo limite de `yieldMs`), a ferramenta retorna `status: "running"` + `sessionId` e um pequeno trecho final da saída.
- Execuções em segundo plano e com `yieldMs` herdam `tools.exec.timeoutSec`, a menos que a chamada forneça um `timeout` explícito.
- A saída permanece na memória até que a sessão seja consultada ou removida.
- Se a ferramenta `process` não for permitida, `exec` será executada de forma síncrona e ignorará `yieldMs`/`background`.
- Os comandos exec iniciados recebem `OPENCLAW_SHELL=exec` para regras de shell/perfil sensíveis ao contexto.
- Para trabalhos de longa duração que começam agora: inicie-os uma vez e conte com a ativação automática após a conclusão (quando habilitada), assim que o comando produzir saída ou falhar.
- Se a ativação automática após a conclusão não estiver disponível ou você precisar confirmar o êxito silencioso de um comando que termina corretamente sem saída, consulte com `process`.
- Não simule lembretes ou acompanhamentos adiados com loops de `sleep` ou consultas repetidas — use cron para trabalhos futuros.

### Substituições por variáveis de ambiente

| Variável                                 | Efeito                                                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Espera padrão antes de passar para segundo plano (ms). Padrão: 10000, limitada ao intervalo de 10 a 120000.                                           |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Limite da saída em memória (caracteres).                                                                                                              |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Limite da saída stdout/stderr pendente por fluxo (caracteres).                                                                                        |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL para sessões concluídas (ms), limitado ao intervalo de 1 min a 3 h.                                                                               |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Limite de inatividade da saída antes que sessões em segundo plano graváveis sejam marcadas como provavelmente aguardando entrada. Padrão: 15000.      |

### Configuração (preferível às substituições por variáveis de ambiente)

| Chave                                 | Padrão  | Efeito                                                                                                  |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | Igual a `OPENCLAW_BASH_YIELD_MS`.                                                                       |
| `tools.exec.timeoutSec`               | 1800    | Tempo limite padrão por chamada.                                                                        |
| `tools.exec.cleanupMs`                | 1800000 | Igual a `OPENCLAW_BASH_JOB_TTL_MS`.                                                                     |
| `tools.exec.notifyOnExit`             | true    | Enfileira um evento do sistema + solicita um Heartbeat quando uma execução em segundo plano termina.    |
| `tools.exec.notifyOnExitEmptySuccess` | false   | Também enfileira eventos de conclusão para execuções em segundo plano bem-sucedidas e sem saída.        |

## Integração de processos filhos

Ao iniciar processos filhos de longa duração fora das ferramentas exec/process (reinicializações da CLI, auxiliares do Gateway), anexe o auxiliar de integração de processos filhos para que os sinais de encerramento sejam encaminhados e os listeners sejam desconectados na saída ou em caso de erro. Isso evita processos órfãos no systemd e mantém o encerramento consistente entre plataformas.

## Ferramenta process

Ações:

| Ação        | Efeito                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| `list`      | Sessões em execução + concluídas.                                                                        |
| `poll`      | Obtém a nova saída de uma sessão (também informa o status de saída).                                     |
| `log`       | Lê a saída agregada e dicas de recuperação de entrada. Oferece suporte a `offset` + `limit`.             |
| `write`     | Envia dados para stdin (`data`, com `eof` opcional).                                                     |
| `send-keys` | Envia tokens de teclas explícitos ou bytes para uma sessão baseada em PTY.                               |
| `submit`    | Envia Enter/retorno de carro para uma sessão baseada em PTY.                                             |
| `paste`     | Envia texto literal, opcionalmente delimitado pelo modo de colagem entre colchetes.                      |
| `kill`      | Encerra uma sessão em segundo plano.                                                                     |
| `clear`     | Remove uma sessão concluída da memória.                                                                  |
| `remove`    | Encerra se estiver em execução; caso contrário, remove se estiver concluída.                             |

Observações:

- Somente sessões em segundo plano são listadas/persistidas — apenas na memória, não no disco. As sessões são perdidas quando o processo é reiniciado.
- Uma sessão ativa em segundo plano bloqueia a suspensão cooperativa do host e a reinicialização segura do Gateway até que o proprietário do processo confirme que ele realmente terminou.
- `process remove` pode ocultar imediatamente uma sessão em execução após solicitar o encerramento; a suspensão e a reinicialização permanecem bloqueadas até a confirmação da saída.
- Os logs da sessão só são salvos no histórico do chat se você executar `process poll`/`log` e o resultado da ferramenta for registrado.
- `process` tem escopo por agente; ela só vê sessões iniciadas por esse agente.
- Use `poll`/`log` para verificar o status, os logs ou a conclusão quando a ativação automática após a conclusão não estiver disponível.
- Use `log` antes de recuperar uma CLI interativa, para que a transcrição atual, o estado de stdin e a indicação de espera por entrada fiquem visíveis em conjunto.
- Use `write`/`send-keys`/`submit`/`paste`/`kill` quando precisar fornecer entrada ou intervir.
- `process list` inclui um `name` derivado (verbo do comando + destino) para consultas rápidas.
- `process list`, `poll` e `log` informam `waitingForInput` somente quando a sessão ainda tem stdin gravável e permanece inativa por mais tempo que o limite de espera por entrada (padrão: 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` usa `offset`/`limit` com base em linhas. Quando ambos são omitidos, retorna as últimas 200 linhas com uma indicação de paginação. Quando `offset` é definido e `limit` não é, retorna de `offset` até o fim (sem limite de 200).
- O `timeout` de `poll` aguarda até essa quantidade de milissegundos antes de retornar; valores acima de 30000 são limitados a 30000.
- A consulta serve para obter o status sob demanda, não para agendar loops de espera. Se o trabalho precisar ocorrer posteriormente, use cron.

## Exemplos

Execute uma tarefa longa e consulte posteriormente:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspecione uma sessão interativa antes de enviar uma entrada:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Inicie imediatamente em segundo plano:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Envie dados para stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envie teclas de PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Envie a linha atual:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Cole texto literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Relacionados

- [Ferramenta exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
