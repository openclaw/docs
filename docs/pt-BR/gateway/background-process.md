---
read_when:
    - Adicionar ou modificar o comportamento de exec em segundo plano
    - Depurando tarefas exec de longa duração
summary: Execução em segundo plano e gerenciamento de processos
title: Execução em segundo plano e ferramenta de processo
x-i18n:
    generated_at: "2026-06-27T17:28:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw executa comandos de shell por meio da ferramenta `exec` e mantém tarefas de longa duração na memória. A ferramenta `process` gerencia essas sessões em segundo plano.

## ferramenta exec

Parâmetros principais:

- `command` (obrigatório)
- `yieldMs` (padrão 10000): envia automaticamente para segundo plano após este atraso
- `background` (bool): envia imediatamente para segundo plano
- `timeout` (segundos, padrão `tools.exec.timeoutSec`): encerra o processo após esse tempo limite; defina `timeout: 0` somente para desabilitar o tempo limite do processo exec para essa chamada
- `elevated` (bool): executa fora da sandbox se o modo elevado estiver habilitado/permitido (`gateway` por padrão, ou `node` quando o destino do exec for `node`)
- Precisa de um TTY real? Defina `pty: true`.
- `workdir`, `env`

Comportamento:

- Execuções em primeiro plano retornam a saída diretamente.
- Quando enviado para segundo plano (explicitamente ou por tempo limite), a ferramenta retorna `status: "running"` + `sessionId` e uma cauda curta.
- Execuções em segundo plano e com `yieldMs` herdam `tools.exec.timeoutSec`, a menos que a chamada forneça um `timeout` explícito.
- A saída é mantida na memória até que a sessão seja consultada ou limpa.
- Se a ferramenta `process` não for permitida, `exec` executa de forma síncrona e ignora `yieldMs`/`background`.
- Comandos exec iniciados recebem `OPENCLAW_SHELL=exec` para regras de shell/perfil sensíveis ao contexto.
- Para trabalhos de longa duração que começam agora, inicie-os uma vez e conte com o despertar de conclusão automático quando ele estiver habilitado e o comando emitir saída ou falhar.
- Se o despertar de conclusão automático não estiver disponível, ou se você precisar de confirmação de sucesso silencioso para um comando que saiu corretamente sem saída, use `process` para confirmar a conclusão.
- Não emule lembretes ou acompanhamentos atrasados com loops de `sleep` ou consultas repetidas; use cron para trabalhos futuros.

## Ponte de processo filho

Ao iniciar processos filhos de longa duração fora das ferramentas exec/process (por exemplo, respawns de CLI ou auxiliares do Gateway), anexe o auxiliar de ponte de processo filho para que os sinais de término sejam encaminhados e os listeners sejam desconectados ao sair/erro. Isso evita processos órfãos no systemd e mantém o comportamento de desligamento consistente entre plataformas.

Substituições de ambiente:

- `OPENCLAW_BASH_YIELD_MS`: yield padrão (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: limite de saída em memória (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite de stdout/stderr pendente por stream (chars)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL para sessões finalizadas (ms, limitado a 1 min-3 h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: limite de saída ociosa antes que sessões em segundo plano graváveis sejam marcadas como provavelmente aguardando entrada (padrão 15000 ms)

Configuração (preferida):

- `tools.exec.backgroundMs` (padrão 10000)
- `tools.exec.timeoutSec` (padrão 1800)
- `tools.exec.cleanupMs` (padrão 1800000)
- `tools.exec.notifyOnExit` (padrão true): enfileira um evento de sistema + solicita Heartbeat quando um exec em segundo plano sai.
- `tools.exec.notifyOnExitEmptySuccess` (padrão false): quando true, também enfileira eventos de conclusão para execuções em segundo plano bem-sucedidas que não produziram saída.

## ferramenta process

Ações:

- `list`: sessões em execução + finalizadas
- `poll`: drena a nova saída de uma sessão (também relata o status de saída)
- `log`: lê a saída agregada e mostra dicas de recuperação de entrada (compatível com `offset` + `limit`)
- `write`: envia stdin (`data`, `eof` opcional)
- `send-keys`: envia tokens de teclas explícitos ou bytes para uma sessão baseada em PTY
- `submit`: envia Enter / retorno de carro para uma sessão baseada em PTY
- `paste`: envia texto literal, opcionalmente envolvido no modo de colagem com colchetes
- `kill`: termina uma sessão em segundo plano
- `clear`: remove uma sessão finalizada da memória
- `remove`: encerra se estiver em execução; caso contrário, limpa se estiver finalizada

Observações:

- Somente sessões em segundo plano são listadas/persistidas na memória.
- Sessões são perdidas na reinicialização do processo (sem persistência em disco).
- Logs de sessão só são salvos no histórico do chat se você executar `process poll/log` e o resultado da ferramenta for registrado.
- `process` é escopado por agente; ele só vê sessões iniciadas por esse agente.
- Use `poll` / `log` para status, logs, confirmação de sucesso silencioso ou confirmação de conclusão quando o despertar de conclusão automático não estiver disponível.
- Use `log` antes de recuperar uma CLI interativa para que a transcrição atual, o estado de stdin e a dica de espera por entrada fiquem visíveis juntos.
- Use `write` / `send-keys` / `submit` / `paste` / `kill` quando precisar de entrada ou intervenção.
- `process list` inclui um `name` derivado (verbo do comando + destino) para varreduras rápidas.
- `process list`, `poll` e `log` relatam `waitingForInput` somente quando a sessão ainda tem stdin gravável e ficou ociosa por mais tempo que o limite de espera por entrada.
- `process log` usa `offset`/`limit` baseados em linhas.
- Quando `offset` e `limit` são omitidos, ele retorna as últimas 200 linhas e inclui uma dica de paginação.
- Quando `offset` é fornecido e `limit` é omitido, ele retorna de `offset` até o fim (sem limitar a 200).
- A consulta é para status sob demanda, não para agendamento por loop de espera. Se o trabalho deve acontecer depois, use cron em vez disso.

## Exemplos

Execute uma tarefa longa e consulte depois:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Inspecione uma sessão interativa antes de enviar entrada:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
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
- [Aprovações Exec](/pt-BR/tools/exec-approvals)
