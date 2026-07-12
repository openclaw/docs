---
read_when:
    - Diagnosticando a conectividade do canal ou a integridade do Gateway
    - Entendendo os comandos e as opções da CLI de verificação de integridade
summary: Comandos de verificação de integridade e monitoramento da integridade do Gateway
title: Verificações de integridade
x-i18n:
    generated_at: "2026-07-12T15:13:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Guia curto para verificar a conectividade dos canais sem fazer suposições.

## Verificações rápidas

- `openclaw status` - resumo local: acessibilidade/modo do Gateway, aviso de atualização, tempo desde a autenticação do canal vinculado, sessões + atividade recente.
- `openclaw status --all` - diagnóstico local completo (somente leitura, com cores, seguro para colar ao depurar).
- `openclaw status --deep` - solicita ao Gateway em execução uma sondagem em tempo real (`health` com `probe:true`), incluindo sondagens de canal por conta quando compatíveis.
- `openclaw status --usage` - exibe instantâneos de uso/cota do provedor de modelos.
- `openclaw health` - solicita ao Gateway em execução seu instantâneo de integridade (somente WS; sem sockets diretos dos canais pela CLI).
- `openclaw health --verbose` (alias `--debug`) - força uma sondagem de integridade em tempo real e imprime detalhes da conexão com o Gateway.
- `openclaw health --json` - saída do instantâneo de integridade em formato legível por máquina.
- Envie `/status` como um comando de chat independente em qualquer canal para receber uma resposta de status sem invocar o agente.
- Logs: acompanhe `/tmp/openclaw/openclaw-*.log` e filtre por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Para o Discord e outros provedores de chat, as linhas de sessão não indicam se o socket está ativo.
`openclaw sessions`, `sessions.list` do Gateway e a ferramenta `sessions_list` do agente
leem o estado armazenado das conversas. Um provedor pode se reconectar e exibir um status
de canal íntegro antes que qualquer nova linha de sessão seja materializada. Use os comandos
de status do canal e de integridade acima para verificar a conectividade em tempo real.

## Diagnóstico aprofundado

- Credenciais no disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (a data de modificação deve ser recente).
- Armazenamento de sessões: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. A contagem e os destinatários recentes são exibidos por `status`.
- Fluxo de revinculação: `openclaw channels logout && openclaw channels login --verbose` quando os códigos de status 409-515 ou `loggedOut` aparecem nos logs. O fluxo de login por QR é reiniciado automaticamente uma vez para o status 515 após o pareamento.
- O diagnóstico é ativado por padrão (`diagnostics.enabled: false` o desativa). Os eventos de memória registram contagens de bytes de RSS/heap e pressão por limite/crescimento; a pressão crítica de memória é registrada pelo logger do Gateway e, quando `diagnostics.memoryPressureSnapshot: true` está definido, também grava um pacote de estabilidade anterior ao OOM (estatísticas do heap V8, contadores de cgroup do Linux quando disponíveis, contagens de recursos ativos e os maiores arquivos de sessão/transcrição por caminho relativo anonimizado). Os avisos de atividade registram atraso/utilização do loop de eventos, proporção de núcleos de CPU e contagens de sessões ativas/em espera/na fila quando o processo está em execução, mas saturado. Os eventos de payload excessivo registram o que foi rejeitado/truncado/dividido, além dos tamanhos e limites, mas nunca o texto das mensagens, conteúdo dos anexos, corpos de Webhooks, corpos brutos de solicitações/respostas, tokens, cookies ou valores secretos.
- O mesmo Heartbeat aciona o registrador de estabilidade limitado: `openclaw gateway stability` (ou a RPC `diagnostics.stability` do Gateway). Encerramentos fatais do Gateway, tempos limite de desligamento, falhas de inicialização após reinício e (quando `diagnostics.memoryPressureSnapshot: true`) pressão crítica de memória mantêm o instantâneo mais recente em `~/.openclaw/logs/stability/`. Inspecione o pacote mais recente com `openclaw gateway stability --bundle latest`.
- Para relatar bugs, execute `openclaw gateway diagnostics export` e anexe o arquivo zip gerado: um resumo em Markdown, o pacote de estabilidade mais recente, metadados de log sanitizados, instantâneos sanitizados de status/integridade do Gateway e o formato da configuração. Textos de chat, corpos de Webhooks, saídas de ferramentas, credenciais, cookies, identificadores de contas/mensagens e valores secretos são omitidos ou anonimizados. Consulte [Exportação de diagnóstico](/pt-BR/gateway/diagnostics).

## Configuração do monitor de integridade

- `gateway.channelHealthCheckMinutes`: frequência com que o Gateway verifica a integridade dos canais. Padrão: `5`. Defina como `0` para desativar globalmente as reinicializações do monitor de integridade.
- `gateway.channelStaleEventThresholdMinutes`: por quanto tempo um canal conectado pode permanecer ocioso antes que o monitor de integridade o considere obsoleto e o reinicie. Padrão: `30`. Mantenha esse valor maior ou igual a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite móvel de uma hora para reinicializações do monitor de integridade por canal/conta. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativa as reinicializações do monitor de integridade para um canal específico, mantendo o monitoramento global ativado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição para múltiplas contas que prevalece sobre a configuração no nível do canal.
- Atualmente, essas substituições por canal se aplicam aos canais integrados que as disponibilizam: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Monitoramento de disponibilidade

Serviços externos de monitoramento de disponibilidade devem usar o endpoint dedicado `/health`, não `/v1/chat/completions`.

- **USE:** `GET /health` - resposta instantânea, nenhuma sessão criada, nenhuma chamada ao LLM, retorna `{"ok":true,"status":"live"}`
- **NÃO USE:** `/v1/chat/completions` para verificações de integridade - cada solicitação cria uma sessão completa do agente com instantâneo de Skills, montagem de contexto e chamadas ao LLM

Quando nenhum cabeçalho `x-openclaw-session-key` nem campo `user` é fornecido, `/v1/chat/completions` gera uma nova sessão aleatória para cada solicitação. Serviços de monitoramento que consultam a cada 15 minutos criam aproximadamente 96 sessões/dia, cada uma consumindo 4-22KB. Com o tempo, isso causa inchaço no armazenamento de sessões e pode levar ao estouro da janela de contexto.

### Exemplos de configuração de serviços de monitoramento

- **BetterStack:** Defina a URL da verificação de integridade como `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Adicione um novo monitor HTTP com a URL `https://<your-gateway-host>:<port>/health`
- **Genérico:** Qualquer solicitação HTTP GET para `/health` retorna 200 com `{"ok":true}` quando o Gateway está íntegro

## Quando algo falha

- `logged out` ou status 409-515 -> revincule com `openclaw channels logout` e depois `openclaw channels login`.
- Gateway inacessível -> inicie-o: `openclaw gateway --port 18789` (use `--force` se a porta estiver ocupada).
- Nenhuma mensagem recebida -> confirme se o telefone vinculado está on-line e se o remetente é permitido (`channels.whatsapp.allowFrom`); para chats em grupo, verifique se a lista de permissões + as regras de menção correspondem (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado de "integridade"

`openclaw health` solicita ao Gateway em execução seu instantâneo de integridade (sem sockets
diretos dos canais pela CLI). Por padrão, retorna um instantâneo recente do Gateway armazenado
em cache, que é atualizado pelo Gateway em segundo plano; `--verbose` força uma sondagem em
tempo real. O comando informa o tempo desde a vinculação das credenciais/autenticação quando
disponível, resumos de sondagem por canal, resumo do armazenamento de sessões e duração da
sondagem. Ele encerra com código diferente de zero se o Gateway estiver inacessível ou se a
sondagem falhar/esgotar o tempo limite.

Opções:

- `--json`: saída JSON legível por máquina
- `--timeout <ms>`: substitui o tempo limite padrão de 10s da sondagem
- `--verbose`: força uma sondagem em tempo real e imprime detalhes da conexão com o Gateway
- `--debug`: alias de `--verbose`

O instantâneo de integridade inclui: `ok` (booleano), `ts` (carimbo de data/hora), `durationMs` (tempo da sondagem), status por canal, disponibilidade do agente e resumo do armazenamento de sessões.

## Relacionados

- [Guia operacional do Gateway](/pt-BR/gateway)
- [Exportação de diagnóstico](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
