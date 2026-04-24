---
read_when:
    - Adicionar ou modificar o comportamento de exec em segundo plano
    - Depurar tarefas exec de longa duração
summary: Execução de exec em segundo plano e gerenciamento de processos
title: Exec em segundo plano e ferramenta de processo
x-i18n:
    generated_at: "2026-04-24T05:50:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# Exec em segundo plano + ferramenta de processo

O OpenClaw executa comandos de shell por meio da ferramenta `exec` e mantém tarefas de longa duração na memória. A ferramenta `process` gerencia essas sessões em segundo plano.

## Ferramenta exec

Parâmetros principais:

- `command` (obrigatório)
- `yieldMs` (padrão 10000): envia automaticamente para segundo plano após esse atraso
- `background` (bool): envia imediatamente para segundo plano
- `timeout` (segundos, padrão 1800): mata o processo após esse timeout
- `elevated` (bool): executa fora do sandbox se o modo elevado estiver ativado/permitido (`gateway` por padrão, ou `node` quando o alvo exec for `node`)
- Precisa de um TTY real? Defina `pty: true`.
- `workdir`, `env`

Comportamento:

- Execuções em primeiro plano retornam a saída diretamente.
- Quando enviada para segundo plano (explícita ou por timeout), a ferramenta retorna `status: "running"` + `sessionId` e uma cauda curta.
- A saída é mantida na memória até que a sessão seja consultada ou limpa.
- Se a ferramenta `process` não for permitida, `exec` será executada de forma síncrona e ignorará `yieldMs`/`background`.
- Comandos exec iniciados recebem `OPENCLAW_SHELL=exec` para regras de shell/profile sensíveis ao contexto.
- Para trabalhos de longa duração que começam agora, inicie-os uma vez e conte com o acionamento automático de conclusão quando ele estiver ativado e o comando emitir saída ou falhar.
- Se o acionamento automático de conclusão não estiver disponível, ou você precisar de confirmação silenciosa de sucesso para um comando que terminou corretamente sem saída, use `process` para confirmar a conclusão.
- Não simule lembretes ou acompanhamentos atrasados com loops `sleep` ou polling repetido; use Cron para trabalhos futuros.

## Ponte de processo filho

Ao iniciar processos filhos de longa duração fora das ferramentas exec/process (por exemplo, reinicializações de CLI ou helpers do gateway), anexe o helper de ponte de processo filho para que sinais de término sejam encaminhados e listeners sejam destacados em exit/error. Isso evita processos órfãos no systemd e mantém o comportamento de desligamento consistente entre plataformas.

Sobrescritas de ambiente:

- `PI_BASH_YIELD_MS`: yield padrão (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limite de saída em memória (caracteres)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limite pendente de stdout/stderr por stream (caracteres)
- `PI_BASH_JOB_TTL_MS`: TTL para sessões concluídas (ms, limitado entre 1 min e 3 h)

Configuração (preferida):

- `tools.exec.backgroundMs` (padrão 10000)
- `tools.exec.timeoutSec` (padrão 1800)
- `tools.exec.cleanupMs` (padrão 1800000)
- `tools.exec.notifyOnExit` (padrão true): coloca um evento de sistema na fila + solicita Heartbeat quando um exec em segundo plano termina.
- `tools.exec.notifyOnExitEmptySuccess` (padrão false): quando true, também coloca eventos de conclusão na fila para execuções em segundo plano bem-sucedidas que não produziram saída.

## Ferramenta process

Ações:

- `list`: sessões em execução + concluídas
- `poll`: drena nova saída de uma sessão (também relata status de saída)
- `log`: lê a saída agregada (oferece suporte a `offset` + `limit`)
- `write`: envia stdin (`data`, `eof` opcional)
- `send-keys`: envia tokens de tecla explícitos ou bytes para uma sessão com suporte a PTY
- `submit`: envia Enter / carriage return para uma sessão com suporte a PTY
- `paste`: envia texto literal, opcionalmente encapsulado em modo de colagem com colchetes
- `kill`: encerra uma sessão em segundo plano
- `clear`: remove uma sessão concluída da memória
- `remove`: mata se estiver em execução, caso contrário limpa se estiver concluída

Observações:

- Somente sessões enviadas para segundo plano são listadas/persistidas na memória.
- As sessões são perdidas ao reiniciar o processo (sem persistência em disco).
- Logs de sessão só são salvos no histórico do chat se você executar `process poll/log` e o resultado da ferramenta for registrado.
- `process` tem escopo por agente; ele só vê sessões iniciadas por esse agente.
- Use `poll` / `log` para status, logs, confirmação silenciosa de sucesso ou
  confirmação de conclusão quando o acionamento automático de conclusão não estiver disponível.
- Use `write` / `send-keys` / `submit` / `paste` / `kill` quando precisar de entrada
  ou intervenção.
- `process list` inclui um `name` derivado (verbo do comando + alvo) para verificações rápidas.
- `process log` usa `offset`/`limit` com base em linhas.
- Quando `offset` e `limit` são ambos omitidos, ele retorna as últimas 200 linhas e inclui uma dica de paginação.
- Quando `offset` é fornecido e `limit` é omitido, ele retorna de `offset` até o fim (sem limite de 200).
- Polling é para status sob demanda, não para agendamento de loop de espera. Se o trabalho
  deve acontecer depois, use Cron.

## Exemplos

Executar uma tarefa longa e consultar depois:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Iniciar imediatamente em segundo plano:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Enviar stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Enviar teclas PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Enviar a linha atual:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Colar texto literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Relacionado

- [Ferramenta exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
