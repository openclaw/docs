---
read_when:
    - Diagnosticando a conectividade do canal ou a integridade do Gateway
    - Entendendo os comandos e opções da CLI de verificação de integridade
summary: Comandos de verificação de integridade e monitoramento da integridade do Gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-05-02T20:46:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Guia rápido para verificar a conectividade dos canais sem adivinhar.

## Verificações rápidas

- `openclaw status` — resumo local: alcance/modo do Gateway, dica de atualização, idade da autenticação do canal vinculado, sessões + atividade recente.
- `openclaw status --all` — diagnóstico local completo (somente leitura, colorido, seguro para colar em depuração).
- `openclaw status --deep` — pede ao Gateway em execução uma sondagem de integridade ao vivo (`health` com `probe:true`), incluindo sondagens de canal por conta quando compatível.
- `openclaw health` — pede ao Gateway em execução o snapshot de integridade dele (somente WS; sem sockets diretos de canal a partir da CLI).
- `openclaw health --verbose` — força uma sondagem de integridade ao vivo e imprime detalhes da conexão do Gateway.
- `openclaw health --json` — saída do snapshot de integridade legível por máquina.
- Envie `/status` como uma mensagem independente no WhatsApp/WebChat para receber uma resposta de status sem invocar o agente.
- Logs: acompanhe `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para Discord e outros provedores de chat, linhas de sessão não indicam vivacidade de socket.
`openclaw sessions`, `sessions.list` do Gateway e a ferramenta `sessions_list` do agente
leem o estado armazenado da conversa. Um provedor pode se reconectar e mostrar status
de canal íntegro antes que qualquer nova linha de sessão seja materializada. Use os comandos
de status de canal e integridade acima para verificações de conectividade ao vivo.

## Diagnósticos profundos

- Credenciais em disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (o mtime deve ser recente).
- Armazenamento de sessões: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (o caminho pode ser sobrescrito na configuração). A contagem e os destinatários recentes aparecem via `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecerem nos logs. (Observação: o fluxo de login por QR reinicia automaticamente uma vez para o status 515 após o pareamento.)
- Diagnósticos são habilitados por padrão. O Gateway registra fatos operacionais, a menos que `diagnostics.enabled: false` esteja definido. Eventos de memória registram contagens de bytes de RSS/heap, pressão de limite e pressão de crescimento. Avisos de vivacidade registram atraso do event loop, utilização do event loop, proporção de núcleos de CPU e contagens de sessões ativas/em espera/enfileiradas quando o processo está em execução, mas saturado. Eventos de payload grande demais registram o que foi rejeitado, truncado ou dividido em partes, além de tamanhos e limites quando disponíveis. Eles não registram o texto da mensagem, conteúdos de anexos, corpo de Webhook, corpo bruto da solicitação ou resposta, tokens, cookies ou valores secretos. O mesmo Heartbeat inicia o gravador de estabilidade limitado, disponível por meio de `openclaw gateway stability` ou do RPC `diagnostics.stability` do Gateway. Saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização após reinício persistem o snapshot mais recente do gravador em `~/.openclaw/logs/stability/` quando existem eventos; inspecione o pacote salvo mais recente com `openclaw gateway stability --bundle latest`.
- Para relatórios de bug, execute `openclaw gateway diagnostics export` e anexe o zip gerado. A exportação combina um resumo em Markdown, o pacote de estabilidade mais recente, metadados de log sanitizados, snapshots sanitizados de status/integridade do Gateway e o formato da configuração. Ela foi pensada para compartilhamento: texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem e valores secretos são omitidos ou redigidos. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: com que frequência o Gateway verifica a integridade do canal. Padrão: `5`. Defina `0` para desabilitar reinícios pelo monitor de integridade globalmente.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode ficar ocioso antes que o monitor de integridade o trate como obsoleto e o reinicie. Padrão: `30`. Mantenha este valor maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite móvel de uma hora para reinícios pelo monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desabilita reinícios pelo monitor de integridade para um canal específico, mantendo o monitoramento global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescrita para múltiplas contas que prevalece sobre a configuração no nível do canal.
- Essas sobrescritas por canal se aplicam aos monitores de canal integrados que as expõem hoje: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando algo falha

- `logged out` ou status 409–515 → revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível → inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Nenhuma mensagem de entrada → confirme se o telefone vinculado está online e se o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, garanta que a lista de permissões + regras de menção correspondam (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` pede ao Gateway em execução o snapshot de integridade dele (sem sockets diretos
de canal a partir da CLI). Por padrão, ele pode retornar um snapshot recente em cache do Gateway; o
Gateway então atualiza esse cache em segundo plano. `openclaw health --verbose` força
uma sondagem ao vivo em vez disso. O comando informa credenciais vinculadas/idade da autenticação quando disponíveis,
resumos de sondagem por canal, resumo do armazenamento de sessões e a duração da sondagem. Ele sai
com código diferente de zero se o Gateway estiver inacessível ou se a sondagem falhar/atingir timeout.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: sobrescreve o timeout padrão de 10s da sondagem
- `--verbose`: força uma sondagem ao vivo e imprime detalhes da conexão do Gateway
- `--debug`: alias para `--verbose`

O snapshot de integridade inclui: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo da sondagem), status por canal, disponibilidade do agente e resumo do armazenamento de sessões.

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
