---
read_when:
    - O transporte do canal indica conectado, mas as respostas falham
    - Você precisa de verificações específicas do canal antes da documentação detalhada do provedor
summary: Solução rápida de problemas em nível de canal com assinaturas de falha e correções por canal
title: Solução de problemas de canais
x-i18n:
    generated_at: "2026-06-27T17:13:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Use esta página quando um canal se conecta, mas o comportamento está incorreto.

## Escada de comandos

Execute estes primeiro, em ordem:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Linha de base saudável:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- A sondagem do canal mostra o transporte conectado e, quando compatível, `works` ou `audit ok`

## Após uma atualização

Use isto quando Telegram, iMessage, configurações da era BlueBubbles ou outro canal de Plugin
desaparecer após uma atualização.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Procure por `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` em `openclaw status --all`. Isso significa que o canal está configurado, mas
o caminho de configuração/carregamento do Plugin encontrou uma árvore de dependências corrompida em vez de registrar
o canal. `openclaw doctor --fix` remove diretórios obsoletos de preparação de dependências de Plugin
e sombras obsoletas de autenticação; em seguida, `openclaw gateway restart` recarrega o
estado limpo.

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                             | Verificação mais rápida                              | Correção                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, mas sem respostas em DM  | `openclaw pairing list whatsapp`                    | Aprove o remetente ou altere a política/lista de permissões de DM.                                                                    |
| Mensagens de grupo ignoradas        | Verifique `requireMention` + padrões de menção na configuração | Mencione o bot ou flexibilize a política de menção para esse grupo.                                                                   |
| Login por QR expira com 408         | Verifique as env `HTTPS_PROXY` / `HTTP_PROXY` do Gateway | Defina um proxy acessível; use `NO_PROXY` apenas para desvios.                                                                        |
| Loops aleatórios de desconexão/novo login | `openclaw channels status --probe` + logs           | Reconexões recentes são sinalizadas mesmo quando atualmente conectado; acompanhe os logs, reinicie o Gateway e então religue se a oscilação continuar. |
| Loop de `status=408 Request Time-out` | Sondagem, logs, doctor e então status do Gateway    | Corrija primeiro a conectividade/temporização do host; faça backup da autenticação e religue a conta se o loop persistir.             |
| Respostas chegam segundos/minutos atrasadas | `openclaw doctor --fix`                             | O doctor interrompe clientes TUI locais obsoletos verificados quando eles estão degradando o loop de eventos do Gateway.              |

Solução de problemas completa: [Solução de problemas do WhatsApp](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                              | Verificação mais rápida                           | Correção                                                                                                                     |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mas sem fluxo de resposta utilizável | `openclaw pairing list telegram`                 | Aprove o emparelhamento ou altere a política de DM.                                                                         |
| Bot online, mas grupo permanece silencioso | Verifique o requisito de menção e o modo de privacidade do bot | Desative o modo de privacidade para visibilidade no grupo ou mencione o bot.                                                 |
| Falhas de envio com erros de rede    | Inspecione os logs em busca de falhas de chamada da API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                             |
| Inicialização relata `getMe returned 401` | Verifique a origem do token configurado          | Copie novamente ou regenere o token do BotFather e atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` da conta padrão. |
| Polling trava ou reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Atualize; se reinicializações forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda apontam para proxy/DNS/IPv6. |
| `setMyCommands` rejeitado na inicialização | Inspecione os logs em busca de `BOT_COMMANDS_TOO_MUCH` | Reduza comandos de Plugin/skill/personalizados do Telegram ou desative menus nativos.                                       |
| Atualizou e a lista de permissões bloqueia você | `openclaw security audit` e listas de permissões da configuração | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos de remetente.                                    |

Solução de problemas completa: [Solução de problemas do Telegram](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                                   | Verificação mais rápida                                                                                                   | Correção                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, mas sem respostas no servidor | `openclaw channels status --probe`                                                                                        | Permita o servidor/canal e verifique a intenção de conteúdo de mensagens.                                                                                                                                                                                            |
| Mensagens de grupo ignoradas              | Verifique nos logs descartes por bloqueio de menção                                                                        | Mencione o bot ou defina `requireMention: false` para o servidor/canal.                                                                                                                                                                                              |
| Uso de digitação/token, mas sem mensagem no Discord | Verifique se isto é um evento de sala ambiente ou uma sala `message_tool` com adesão em que o modelo deixou passar `message(action=send)` | Inspecione o log detalhado do Gateway em busca de metadados de payload final suprimido, verifique `messages.groupChat.unmentionedInbound`, leia [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events) ou mantenha `messages.groupChat.visibleReplies: "automatic"` para solicitações normais de grupo. |
| Respostas em DM ausentes                  | `openclaw pairing list discord`                                                                                           | Aprove o emparelhamento de DM ou ajuste a política de DM.                                                                                                                                                                                                            |

Solução de problemas completa: [Solução de problemas do Discord](/pt-BR/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                | Verificação mais rápida                     | Correção                                                                                                                                               |
| -------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado, mas sem respostas | `openclaw channels status --probe`          | Verifique o token do app + token do bot e os escopos exigidos; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações baseadas em SecretRef. |
| DMs bloqueadas                         | `openclaw pairing list slack`               | Aprove o emparelhamento ou flexibilize a política de DM.                                                                                              |
| Mensagem de canal ignorada             | Verifique `groupPolicy` e a lista de permissões do canal | Permita o canal ou altere a política para `open`.                                                                                                     |

Solução de problemas completa: [Solução de problemas do Slack](/pt-BR/channels/slack#troubleshooting)

## iMessage

### Assinaturas de falha do iMessage

| Sintoma                              | Verificação mais rápida                                      | Correção                                                               |
| ------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `imsg` ausente ou falha fora do macOS | `openclaw channels status --probe --channel imessage`        | Execute o OpenClaw no Mac com Mensagens ou use um wrapper SSH para `cliPath`. |
| Consegue enviar, mas não receber no macOS | Verifique permissões de privacidade do macOS para automação do Mensagens | Conceda novamente as permissões TCC e reinicie o processo do canal.    |
| Remetente de DM bloqueado            | `openclaw pairing list imessage`                             | Aprove o emparelhamento ou atualize a lista de permissões.             |

Solução de problemas completa:

- [Solução de problemas do iMessage](/pt-BR/channels/imessage#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                         | Verificação mais rápida                      | Correção                                                 |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe`           | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento. |
| DM bloqueada                    | `openclaw pairing list signal`               | Aprove o remetente ou ajuste a política de DM.          |
| Respostas de grupo não disparam | Verifique a lista de permissões do grupo e padrões de menção | Adicione o remetente/grupo ou flexibilize o bloqueio.   |

Solução de problemas completa: [Solução de problemas do Signal](/pt-BR/channels/signal#troubleshooting)

## QQ Bot

### Assinaturas de falha do QQ Bot

| Sintoma                         | Verificação mais rápida                         | Correção                                                         |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| Bot responde "gone to Mars"     | Verifique `appId` e `clientSecret` na configuração | Defina as credenciais ou reinicie o Gateway.                     |
| Sem mensagens de entrada        | `openclaw channels status --probe`              | Verifique as credenciais na QQ Open Platform.                    |
| Voz não transcrita              | Verifique a configuração do provedor STT        | Configure `channels.qqbot.stt` ou `tools.media.audio`.           |
| Mensagens proativas não chegam  | Verifique os requisitos de interação da plataforma QQ | A QQ pode bloquear mensagens iniciadas pelo bot sem interação recente. |

Solução de problemas completa: [solução de problemas do QQ Bot](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                             | Verificação mais rápida                | Correção                                                                  |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Conectado, mas ignora mensagens de sala | `openclaw channels status --probe`     | Verifique `groupPolicy`, a lista de salas permitidas e o controle por menção. |
| DMs não são processadas             | `openclaw pairing list matrix`         | Aprove o remetente ou ajuste a política de DM.                            |
| Salas criptografadas falham         | `openclaw matrix verify status`        | Verifique novamente o dispositivo e depois confira `openclaw matrix verify backup status`. |
| Restauração de backup pendente/quebrada | `openclaw matrix verify backup status` | Execute `openclaw matrix verify backup restore` ou rode novamente com uma chave de recuperação. |
| Assinatura cruzada/bootstrap parece incorreto | `openclaw matrix verify bootstrap`     | Repare o armazenamento de segredos, a assinatura cruzada e o estado do backup em uma só passagem. |

Configuração completa: [Matrix](/pt-BR/channels/matrix)

## Relacionados

- [Emparelhamento](/pt-BR/channels/pairing)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
