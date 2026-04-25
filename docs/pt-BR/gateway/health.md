---
read_when:
    - Diagnosticando conectividade de canal ou integridade do gateway
    - Entendendo comandos e opções de CLI de verificação de integridade
summary: Comandos de verificação de integridade e monitoramento de integridade do gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-04-25T13:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Guia curto para verificar a conectividade do canal sem precisar adivinhar.

## Verificações rápidas

- `openclaw status` — resumo local: acessibilidade/modo do gateway, dica de atualização, idade da autenticação do canal vinculado, sessões + atividade recente.
- `openclaw status --all` — diagnóstico local completo (somente leitura, colorido, seguro para copiar e colar para depuração).
- `openclaw status --deep` — solicita ao gateway em execução uma sondagem ativa de integridade (`health` com `probe:true`), incluindo sondagens por conta de canal quando compatível.
- `openclaw health` — solicita ao gateway em execução seu snapshot de integridade (somente WS; sem sockets diretos de canal a partir da CLI).
- `openclaw health --verbose` — força uma sondagem ativa de integridade e exibe detalhes de conexão do gateway.
- `openclaw health --json` — saída de snapshot de integridade legível por máquina.
- Envie `/status` como uma mensagem independente no WhatsApp/WebChat para obter uma resposta de status sem invocar o agente.
- Logs: faça tail em `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos detalhados

- Credenciais no disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (o mtime deve ser recente).
- Armazenamento de sessão: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (o caminho pode ser substituído na configuração). A contagem e os destinatários recentes são exibidos via `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecerem nos logs. (Observação: o fluxo de login por QR reinicia automaticamente uma vez para o status 515 após o pareamento.)
- Diagnósticos são habilitados por padrão. O gateway registra fatos operacionais, a menos que `diagnostics.enabled: false` esteja definido. Eventos de memória registram contagens de bytes de RSS/heap, pressão de limite e pressão de crescimento. Eventos de payload superdimensionado registram o que foi rejeitado, truncado ou fragmentado, além de tamanhos e limites quando disponíveis. Eles não registram o texto da mensagem, conteúdo de anexos, corpo de Webhook, corpo bruto de solicitação ou resposta, tokens, cookies ou valores secretos. O mesmo Heartbeat inicia o gravador de estabilidade limitado, que está disponível por meio de `openclaw gateway stability` ou da RPC do Gateway `diagnostics.stability`. Saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização em reinicializações persistem o snapshot mais recente do gravador em `~/.openclaw/logs/stability/` quando há eventos; inspecione o bundle salvo mais recente com `openclaw gateway stability --bundle latest`.
- Para relatórios de bug, execute `openclaw gateway diagnostics export` e anexe o zip gerado. A exportação combina um resumo em Markdown, o bundle de estabilidade mais recente, metadados de logs sanitizados, snapshots sanitizados de status/integridade do Gateway e o formato da configuração. Ela foi feita para ser compartilhada: texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem e valores secretos são omitidos ou redigidos. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: com que frequência o gateway verifica a integridade do canal. Padrão: `5`. Defina `0` para desabilitar globalmente reinicializações do monitor de integridade.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode permanecer ocioso antes que o monitor de integridade o trate como obsoleto e o reinicie. Padrão: `30`. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite contínuo de uma hora para reinicializações do monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desabilita reinicializações do monitor de integridade para um canal específico, mantendo o monitoramento global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição para múltiplas contas que tem precedência sobre a configuração em nível de canal.
- Essas substituições por canal se aplicam aos monitores de canal incluídos que as expõem hoje: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando algo falha

- `logged out` ou status 409–515 → revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível → inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Nenhuma mensagem recebida → confirme que o telefone vinculado está online e que o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, verifique se a lista de permissões + regras de menção correspondem (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado `health`

`openclaw health` solicita ao gateway em execução seu snapshot de integridade (sem sockets diretos de canal
a partir da CLI). Por padrão, ele pode retornar um snapshot em cache recente do gateway; o
gateway então atualiza esse cache em segundo plano. `openclaw health --verbose` força
uma sondagem ativa. O comando informa a idade de credenciais/autenticação vinculadas quando disponível,
resumos de sondagem por canal, resumo do armazenamento de sessão e duração da sondagem. Ele encerra
com código diferente de zero se o gateway estiver inacessível ou se a sondagem falhar/expirar.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: substitui o timeout padrão de 10s da sondagem
- `--verbose`: força uma sondagem ativa e exibe detalhes de conexão do gateway
- `--debug`: alias para `--verbose`

O snapshot de integridade inclui: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo da sondagem), status por canal, disponibilidade do agente e resumo do armazenamento de sessão.

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
