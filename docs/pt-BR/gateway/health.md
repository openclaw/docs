---
read_when:
    - Diagnóstico da conectividade do canal ou da integridade do Gateway
    - Entendendo os comandos e opções de verificação de integridade da CLI
summary: Comandos de verificação de integridade e monitoramento de integridade do Gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-04-30T09:49:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Guia curto para verificar a conectividade dos canais sem adivinhar.

## Verificações rápidas

- `openclaw status` — resumo local: alcance/modo do gateway, dica de atualização, idade da autenticação do canal vinculado, sessões + atividade recente.
- `openclaw status --all` — diagnóstico local completo (somente leitura, colorido, seguro para colar em depuração).
- `openclaw status --deep` — solicita ao gateway em execução uma sondagem de integridade ao vivo (`health` com `probe:true`), incluindo sondagens de canal por conta quando houver suporte.
- `openclaw health` — solicita ao gateway em execução seu instantâneo de integridade (somente WS; sem sockets diretos de canal pela CLI).
- `openclaw health --verbose` — força uma sondagem de integridade ao vivo e imprime detalhes da conexão do gateway.
- `openclaw health --json` — saída do instantâneo de integridade legível por máquina.
- Envie `/status` como uma mensagem avulsa no WhatsApp/WebChat para receber uma resposta de status sem invocar o agente.
- Logs: acompanhe `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos profundos

- Credenciais em disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime deve ser recente).
- Armazenamento de sessões: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (o caminho pode ser substituído na configuração). A contagem e os destinatários recentes são exibidos via `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando códigos de status 409–515 ou `loggedOut` aparecerem nos logs. (Observação: o fluxo de login por QR reinicia automaticamente uma vez para o status 515 após o pareamento.)
- Os diagnósticos ficam habilitados por padrão. O gateway registra fatos operacionais, a menos que `diagnostics.enabled: false` esteja definido. Eventos de memória registram contagens de bytes de RSS/heap, pressão de limite e pressão de crescimento. Avisos de atividade registram atraso do loop de eventos, utilização do loop de eventos, proporção de núcleos da CPU e contagens de sessões ativas/em espera/enfileiradas quando o processo está em execução, mas saturado. Eventos de payload excessivo registram o que foi rejeitado, truncado ou dividido em partes, além de tamanhos e limites quando disponíveis. Eles não registram o texto da mensagem, conteúdo de anexos, corpo de Webhook, corpo bruto da solicitação ou resposta, tokens, cookies ou valores secretos. O mesmo Heartbeat inicia o gravador de estabilidade delimitado, disponível por `openclaw gateway stability` ou pelo RPC `diagnostics.stability` do Gateway. Saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização de reinício persistem o instantâneo mais recente do gravador em `~/.openclaw/logs/stability/` quando houver eventos; inspecione o pacote salvo mais recente com `openclaw gateway stability --bundle latest`.
- Para relatórios de bug, execute `openclaw gateway diagnostics export` e anexe o zip gerado. A exportação combina um resumo em Markdown, o pacote de estabilidade mais recente, metadados de log sanitizados, instantâneos sanitizados de status/integridade do Gateway e o formato da configuração. Ela foi feita para ser compartilhada: texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem e valores secretos são omitidos ou redigidos. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: com que frequência o gateway verifica a integridade do canal. Padrão: `5`. Defina `0` para desabilitar globalmente reinícios pelo monitor de integridade.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode permanecer ocioso antes de o monitor de integridade tratá-lo como obsoleto e reiniciá-lo. Padrão: `30`. Mantenha este valor maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite móvel de uma hora para reinícios pelo monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desabilita reinícios pelo monitor de integridade para um canal específico, mantendo o monitoramento global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição multi-conta que prevalece sobre a configuração no nível do canal.
- Essas substituições por canal se aplicam aos monitores de canal integrados que as expõem hoje: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando algo falha

- `logged out` ou status 409–515 → revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível → inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Sem mensagens recebidas → confirme que o telefone vinculado está online e que o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, garanta que a lista de permissões + regras de menção correspondam (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado "health"

`openclaw health` solicita ao gateway em execução seu instantâneo de integridade (sem sockets diretos de canal pela CLI). Por padrão, ele pode retornar um instantâneo recente do gateway em cache; o gateway então atualiza esse cache em segundo plano. `openclaw health --verbose` força uma sondagem ao vivo em vez disso. O comando relata credenciais vinculadas/idade da autenticação quando disponíveis, resumos de sondagem por canal, resumo do armazenamento de sessões e a duração da sondagem. Ele encerra com código diferente de zero se o gateway estiver inacessível ou se a sondagem falhar/atingir timeout.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: substitui o timeout padrão de sondagem de 10s
- `--verbose`: força uma sondagem ao vivo e imprime detalhes da conexão do gateway
- `--debug`: alias para `--verbose`

O instantâneo de integridade inclui: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo da sondagem), status por canal, disponibilidade do agente e resumo do armazenamento de sessões.

## Relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
