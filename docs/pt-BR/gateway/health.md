---
read_when:
    - Diagnosticando conectividade de canal ou integridade do gateway
    - Entendendo comandos e opções de CLI para verificação de integridade
summary: Comandos de verificação de integridade e monitoramento da integridade do gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-04-24T05:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Verificações de integridade (CLI)

Guia curto para verificar a conectividade de canais sem adivinhar.

## Verificações rápidas

- `openclaw status` — resumo local: acessibilidade/modo do gateway, dica de atualização, idade da autenticação de canal vinculada, sessões + atividade recente.
- `openclaw status --all` — diagnóstico local completo (somente leitura, colorido, seguro para colar em depuração).
- `openclaw status --deep` — solicita ao gateway em execução uma probe de integridade ativa (`health` com `probe:true`), incluindo probes de canal por conta quando compatível.
- `openclaw health` — solicita ao gateway em execução seu snapshot de integridade (somente WS; sem sockets diretos de canal a partir da CLI).
- `openclaw health --verbose` — força uma probe de integridade ativa e imprime detalhes da conexão do gateway.
- `openclaw health --json` — saída do snapshot de integridade legível por máquina.
- Envie `/status` como mensagem isolada no WhatsApp/WebChat para obter uma resposta de status sem invocar o agente.
- Logs: acompanhe `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos profundos

- Credenciais em disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (o mtime deve ser recente).
- Armazenamento de sessão: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (o caminho pode ser substituído na configuração). Contagem e destinatários recentes são exibidos por `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecem nos logs. (Observação: o fluxo de login por QR reinicia automaticamente uma vez para o status 515 após o pairing.)
- Os diagnósticos vêm ativados por padrão. O gateway registra fatos operacionais, a menos que `diagnostics.enabled: false` esteja definido. Eventos de memory registram contagens de bytes de RSS/heap, pressão por limite e pressão por crescimento. Eventos de carga excessiva registram o que foi rejeitado, truncado ou dividido em chunks, além de tamanhos e limites quando disponíveis. Eles não registram o texto da mensagem, o conteúdo de anexos, o corpo do Webhook, o corpo bruto da solicitação ou resposta, tokens, cookies ou valores secretos. O mesmo Heartbeat inicia o registrador de estabilidade limitado, disponível por meio de `openclaw gateway stability` ou do RPC `diagnostics.stability` do Gateway. Saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização após reinício persistem o snapshot mais recente do registrador em `~/.openclaw/logs/stability/` quando existem eventos; inspecione o bundle salvo mais recente com `openclaw gateway stability --bundle latest`.
- Para relatórios de bug, execute `openclaw gateway diagnostics export` e anexe o zip gerado. A exportação combina um resumo em Markdown, o bundle de estabilidade mais recente, metadados sanitizados de logs, snapshots sanitizados de status/saúde do Gateway e a forma da configuração. Ela foi feita para ser compartilhada: texto de chat, corpos de Webhook, saídas de ferramenta, credenciais, cookies, identificadores de conta/mensagem e valores secretos são omitidos ou redigidos. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: frequência com que o gateway verifica a integridade do canal. Padrão: `5`. Defina `0` para desativar globalmente reinicializações do monitor de integridade.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode ficar ocioso antes de o monitor de integridade tratá-lo como obsoleto e reiniciá-lo. Padrão: `30`. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite contínuo de uma hora para reinicializações do monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativa reinicializações do monitor de integridade para um canal específico, mantendo o monitoramento global ativado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição para várias contas que prevalece sobre a configuração no nível do canal.
- Essas substituições por canal se aplicam aos monitores de canal integrados que as expõem atualmente: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando algo falha

- `logged out` ou status 409–515 → revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível → inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Sem mensagens de entrada → confirme se o telefone vinculado está online e se o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, garanta que allowlist + regras de menção correspondam (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` solicita ao gateway em execução seu snapshot de integridade (sem sockets diretos de canal a partir da CLI). Por padrão, ele pode retornar um snapshot recente em cache do gateway; o gateway então atualiza esse cache em segundo plano. `openclaw health --verbose` força uma probe ativa. O comando informa a idade das credenciais/autenticação vinculadas quando disponível, resumos de probe por canal, resumo do armazenamento de sessão e a duração da probe. Ele sai com código diferente de zero se o gateway estiver inacessível ou se a probe falhar/expirar.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: substitui o timeout padrão de 10s da probe
- `--verbose`: força uma probe ativa e imprime detalhes da conexão do gateway
- `--debug`: alias para `--verbose`

O snapshot de integridade inclui: `ok` (boolean), `ts` (timestamp), `durationMs` (tempo da probe), status por canal, disponibilidade do agente e resumo do armazenamento de sessão.

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
