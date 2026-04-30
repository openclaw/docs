---
read_when:
    - Adicionar ou modificar o comportamento de exec em segundo plano
    - Depuração de tarefas de execução de longa duração
summary: Execução de exec em segundo plano e gerenciamento de processos
title: Ferramenta de execução em segundo plano e processos
x-i18n:
    generated_at: "2026-04-30T09:47:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Exec em segundo plano + ferramenta process

O OpenClaw executa comandos shell por meio da ferramenta `exec` e mantém tarefas de longa duração na memória. A ferramenta `process` gerencia essas sessões em segundo plano.

## Ferramenta exec

Parâmetros principais:

- `command` (obrigatório)
- `yieldMs` (padrão 10000): move automaticamente para segundo plano após este atraso
- `background` (bool): move imediatamente para segundo plano
- `timeout` (segundos, padrão `tools.exec.timeoutSec`): encerra o processo após este tempo limite; defina `timeout: 0` apenas para desabilitar o tempo limite do processo exec para essa chamada
- `elevated` (bool): executa fora do sandbox se o modo elevado estiver habilitado/permitido (`gateway` por padrão, ou `node` quando o destino do exec for `node`)
- Precisa de um TTY real? Defina `pty: true`.
- `workdir`, `env`

Comportamento:

- Execuções em primeiro plano retornam a saída diretamente.
- Quando movida para segundo plano (explicitamente ou por tempo limite), a ferramenta retorna `status: "running"` + `sessionId` e um pequeno trecho final.
- Execuções em segundo plano e com `yieldMs` herdam `tools.exec.timeoutSec`, a menos que a chamada forneça um `timeout` explícito.
- A saída é mantida na memória até que a sessão seja consultada ou limpa.
- Se a ferramenta `process` não for permitida, `exec` executa de forma síncrona e ignora `yieldMs`/`background`.
- Comandos exec gerados recebem `OPENCLAW_SHELL=exec` para regras de shell/profile sensíveis ao contexto.
- Para trabalho de longa duração que começa agora, inicie-o uma vez e conte com o acionamento automático de conclusão quando ele estiver habilitado e o comando emitir saída ou falhar.
- Se o acionamento automático de conclusão não estiver disponível, ou se você precisar de confirmação de sucesso silencioso para um comando que saiu corretamente sem saída, use `process` para confirmar a conclusão.
- Não emule lembretes ou acompanhamentos adiados com loops de `sleep` ou consultas repetidas; use cron para trabalho futuro.

## Ponte de processos filhos

Ao gerar processos filhos de longa duração fora das ferramentas exec/process (por exemplo, reinicializações de CLI ou auxiliares de gateway), anexe o auxiliar de ponte de processo filho para que sinais de encerramento sejam encaminhados e listeners sejam desanexados em caso de saída/erro. Isso evita processos órfãos no systemd e mantém o comportamento de desligamento consistente entre plataformas.

Substituições de ambiente:

- `PI_BASH_YIELD_MS`: yield padrão (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite de saída em memória (caracteres)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite de stdout/stderr pendente por stream (caracteres)
- `PI_BASH_JOB_TTL_MS`: TTL para sessões concluídas (ms, limitado a 1m–3h)

Configuração (preferencial):

- `tools.exec.backgroundMs` (padrão 10000)
- `tools.exec.timeoutSec` (padrão 1800)
- `tools.exec.cleanupMs` (padrão 1800000)
- `tools.exec.notifyOnExit` (padrão true): enfileira um evento de sistema + solicita Heartbeat quando um exec em segundo plano sai.
- `tools.exec.notifyOnExitEmptySuccess` (padrão false): quando true, também enfileira eventos de conclusão para execuções bem-sucedidas em segundo plano que não produziram saída.

## Ferramenta process

Ações:

- `list`: sessões em execução + concluídas
- `poll`: drena nova saída de uma sessão (também informa o status de saída)
- `log`: lê a saída agregada (com suporte a `offset` + `limit`)
- `write`: envia stdin (`data`, `eof` opcional)
- `send-keys`: envia tokens de tecla explícitos ou bytes para uma sessão apoiada por PTY
- `submit`: envia Enter / retorno de carro para uma sessão apoiada por PTY
- `paste`: envia texto literal, opcionalmente envolto em modo de colagem com colchetes
- `kill`: encerra uma sessão em segundo plano
- `clear`: remove uma sessão concluída da memória
- `remove`: encerra se estiver em execução; caso contrário, limpa se estiver concluída

Observações:

- Apenas sessões em segundo plano são listadas/persistidas na memória.
- Sessões são perdidas ao reiniciar o processo (sem persistência em disco).
- Logs de sessão só são salvos no histórico de chat se você executar `process poll/log` e o resultado da ferramenta for registrado.
- `process` tem escopo por agente; ele só vê sessões iniciadas por esse agente.
- Use `poll` / `log` para status, logs, confirmação de sucesso silencioso ou confirmação de conclusão quando o acionamento automático de conclusão não estiver disponível.
- Use `write` / `send-keys` / `submit` / `paste` / `kill` quando precisar de entrada ou intervenção.
- `process list` inclui um `name` derivado (verbo do comando + destino) para verificações rápidas.
- `process log` usa `offset`/`limit` baseados em linhas.
- Quando `offset` e `limit` são omitidos, retorna as últimas 200 linhas e inclui uma dica de paginação.
- Quando `offset` é fornecido e `limit` é omitido, retorna de `offset` até o fim (sem limitar a 200).
- A consulta é para status sob demanda, não para agendamento em loop de espera. Se o trabalho deve acontecer mais tarde, use cron em vez disso.

## Exemplos

Execute uma tarefa longa e consulte depois:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inicie imediatamente em segundo plano:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Envie stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envie teclas PTY:

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

## Relacionado

- [Ferramenta Exec](/pt-BR/tools/exec)
- [Aprovações de Exec](/pt-BR/tools/exec-approvals)
