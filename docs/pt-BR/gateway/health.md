---
read_when:
    - Diagnosticando a conectividade do canal ou a integridade do Gateway
    - Entendendo os comandos e opções da CLI de verificação de integridade
summary: Comandos de verificação de integridade e monitoramento de integridade do Gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-06-27T17:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Guia breve para verificar a conectividade de canais sem adivinhação.

## Verificações rápidas

- `openclaw status` — resumo local: acessibilidade/modo do Gateway, dica de atualização, idade da autenticação do canal vinculado, sessões + atividade recente.
- `openclaw status --all` — diagnóstico local completo (somente leitura, colorido, seguro para colar em depuração).
- `openclaw status --deep` — solicita ao Gateway em execução uma sondagem de integridade ao vivo (`health` com `probe:true`), incluindo sondagens de canal por conta quando houver suporte.
- `openclaw health` — solicita ao Gateway em execução seu instantâneo de integridade (somente WS; sem sockets de canal diretos pela CLI).
- `openclaw health --verbose` — força uma sondagem de integridade ao vivo e imprime detalhes da conexão com o Gateway.
- `openclaw health --json` — saída de instantâneo de integridade legível por máquina.
- Envie `/status` como uma mensagem independente no WhatsApp/WebChat para receber uma resposta de status sem invocar o agente.
- Logs: acompanhe `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord e outros provedores de chat, linhas de sessão não indicam vivacidade do socket.
`openclaw sessions`, `sessions.list` do Gateway e a ferramenta `sessions_list` do agente
leem o estado de conversa armazenado. Um provedor pode se reconectar e mostrar status
de canal íntegro antes que qualquer nova linha de sessão seja materializada. Use os comandos
de status de canal e integridade acima para verificações de conectividade ao vivo.

## Diagnósticos profundos

- Credenciais em disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime deve ser recente).
- Armazenamento de sessão: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (o caminho pode ser sobrescrito na configuração). A contagem e os destinatários recentes são exibidos via `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecerem nos logs. (Observação: o fluxo de login por QR reinicia automaticamente uma vez para o status 515 após o pareamento.)
- Diagnósticos são habilitados por padrão. O Gateway registra fatos operacionais, a menos que `diagnostics.enabled: false` esteja definido. Eventos de memória registram contagens de bytes de RSS/heap, pressão de limite e pressão de crescimento. Pressão crítica de memória é registrada pelo logger do Gateway. Quando `diagnostics.memoryPressureSnapshot: true` está definido, pressão crítica de memória também grava um pacote de estabilidade pré-OOM com estatísticas de heap do V8, contadores de cgroup do Linux quando disponíveis, contagens de recursos ativos e os maiores arquivos de sessão/transcrição por caminho relativo redigido. Avisos de vivacidade registram atraso do loop de eventos, utilização do loop de eventos, proporção de núcleos de CPU e contagens de sessões ativas/em espera/enfileiradas quando o processo está em execução, mas saturado. Eventos de carga útil superdimensionada registram o que foi rejeitado, truncado ou dividido em partes, além de tamanhos e limites quando disponíveis. Eles não registram o texto da mensagem, conteúdo de anexos, corpo do Webhook, corpo bruto da solicitação ou resposta, tokens, cookies ou valores secretos. O mesmo Heartbeat inicia o gravador de estabilidade limitado, disponível por `openclaw gateway stability` ou pelo RPC `diagnostics.stability` do Gateway. Saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização após reinício persistem o instantâneo mais recente do gravador em `~/.openclaw/logs/stability/` quando houver eventos; pressão crítica de memória também faz isso somente quando `diagnostics.memoryPressureSnapshot: true` está definido. Inspecione o pacote salvo mais recente com `openclaw gateway stability --bundle latest`.
- Para relatórios de bug, execute `openclaw gateway diagnostics export` e anexe o zip gerado. A exportação combina um resumo em Markdown, o pacote de estabilidade mais recente, metadados de log sanitizados, instantâneos sanitizados de status/integridade do Gateway e o formato da configuração. Ela foi feita para ser compartilhada: texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem e valores secretos são omitidos ou redigidos. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: com que frequência o Gateway verifica a integridade do canal. Padrão: `5`. Defina `0` para desabilitar reinícios do monitor de integridade globalmente.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode permanecer ocioso antes que o monitor de integridade o trate como obsoleto e o reinicie. Padrão: `30`. Mantenha isto maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite móvel de uma hora para reinícios do monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desabilita reinícios do monitor de integridade para um canal específico enquanto mantém o monitoramento global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescrita de múltiplas contas que prevalece sobre a configuração no nível do canal.
- Essas sobrescritas por canal se aplicam aos monitores de canal integrados que as expõem hoje: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Monitoramento de uptime

Serviços externos de monitoramento de uptime devem usar o endpoint dedicado `/health`, não `/v1/chat/completions`.

- **Use:** `GET /health` — resposta instantânea, nenhuma sessão criada, nenhuma chamada de LLM, retorna `{"ok":true,"status":"live"}`
- **Não use:** `/v1/chat/completions` para verificações de integridade — cada solicitação cria uma sessão completa do agente com instantâneo de Skills, montagem de contexto e chamadas de LLM

Quando nenhum cabeçalho `x-openclaw-session-key` ou campo `user` é fornecido, `/v1/chat/completions` gera uma nova sessão aleatória para cada solicitação. Serviços de monitoramento que fazem ping a cada 15 minutos criam ~96 sessões/dia, cada uma consumindo 4–22 KB. Com o tempo, isso causa inchaço no armazenamento de sessões e pode levar a estouro da janela de contexto.

### Exemplos de configuração de serviços de monitoramento

- **BetterStack:** Defina a URL da verificação de integridade como `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Adicione um novo monitor HTTP com a URL `https://<your-gateway-host>:<port>/health`
- **Genérico:** Qualquer HTTP GET para `/health` retorna 200 com `{"ok":true}` quando o Gateway está íntegro

## Quando algo falha

- `logged out` ou status 409–515 → revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível → inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Nenhuma mensagem de entrada → confirme que o telefone vinculado está online e que o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, garanta que a lista de permissões + regras de menção correspondam (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` solicita ao Gateway em execução seu instantâneo de integridade (sem sockets de canal
diretos pela CLI). Por padrão, ele pode retornar um instantâneo recente em cache do Gateway; então o
Gateway atualiza esse cache em segundo plano. `openclaw health --verbose` força
uma sondagem ao vivo em vez disso. O comando relata idade de credenciais/autenticação vinculadas quando disponível,
resumos de sondagem por canal, resumo do armazenamento de sessões e uma duração de sondagem. Ele sai
com código diferente de zero se o Gateway estiver inacessível ou se a sondagem falhar/atingir timeout.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: sobrescreve o timeout padrão de sondagem de 10 s
- `--verbose`: força uma sondagem ao vivo e imprime detalhes da conexão com o Gateway
- `--debug`: alias para `--verbose`

O instantâneo de integridade inclui: `ok` (booleano), `ts` (carimbo de data/hora), `durationMs` (tempo da sondagem), status por canal, disponibilidade do agente e resumo do armazenamento de sessões.

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
