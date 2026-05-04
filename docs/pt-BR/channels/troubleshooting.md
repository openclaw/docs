---
read_when:
    - O transporte do canal diz que está conectado, mas as respostas falham
    - Você precisa de verificações específicas de canal antes da documentação aprofundada de provedores
summary: Solução rápida de problemas no nível do canal com assinaturas de falha e correções por canal
title: Solução de problemas de canais
x-i18n:
    generated_at: "2026-05-04T02:22:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Use esta página quando um canal se conecta, mas o comportamento está incorreto.

## Escada de comandos

Execute estes comandos em ordem primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Linha de base íntegra:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- A sondagem do canal mostra o transporte conectado e, quando houver suporte, `works` ou `audit ok`

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                         | Verificação mais rápida                             | Correção                                                                                                                           |
| ------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, mas sem respostas por DM | `openclaw pairing list whatsapp`                    | Aprove o remetente ou altere a política/lista de permissões de DM.                                                                 |
| Mensagens de grupo ignoradas     | Verifique `requireMention` + padrões de menção na configuração | Mencione o bot ou afrouxe a política de menção desse grupo.                                                                        |
| Login por QR expira com 408      | Verifique as env `HTTPS_PROXY` / `HTTP_PROXY` do Gateway | Configure um proxy acessível; use `NO_PROXY` apenas para desvios.                                                                  |
| Ciclos aleatórios de desconexão/novo login | `openclaw channels status --probe` + logs           | Reconexões recentes são sinalizadas mesmo quando conectado no momento; observe os logs, reinicie o Gateway e, depois, revincule se a instabilidade continuar. |

Solução de problemas completa: [Solução de problemas do WhatsApp](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                              | Verificação mais rápida                         | Correção                                                                                                                        |
| ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/start`, mas sem fluxo de resposta utilizável | `openclaw pairing list telegram`                | Aprove o pareamento ou altere a política de DM.                                                                                 |
| Bot online, mas o grupo permanece silencioso | Verifique o requisito de menção e o modo de privacidade do bot | Desative o modo de privacidade para visibilidade no grupo ou mencione o bot.                                                    |
| Falhas de envio com erros de rede    | Inspecione os logs em busca de falhas de chamada à API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                                 |
| Inicialização relata `getMe returned 401` | Verifique a origem do token configurado          | Copie novamente ou regenere o token do BotFather e atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` da conta padrão.    |
| Polling trava ou reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Atualize; se reinicializações forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda apontam para proxy/DNS/IPv6. |
| `setMyCommands` rejeitado na inicialização | Inspecione os logs em busca de `BOT_COMMANDS_TOO_MUCH` | Reduza comandos de Plugin/Skills/personalizados do Telegram ou desative menus nativos.                                         |
| Atualizou e a lista de permissões bloqueia você | `openclaw security audit` e listas de permissões na configuração | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos de remetente.                                      |

Solução de problemas completa: [Solução de problemas do Telegram](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                                   | Verificação mais rápida                                                          | Correção                                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, mas sem respostas em guild    | `openclaw channels status --probe`                                              | Permita a guild/canal e verifique a intent de conteúdo da mensagem.                                                                                                         |
| Mensagens de grupo ignoradas              | Verifique nos logs quedas por controle de menção                                | Mencione o bot ou defina `requireMention: false` para a guild/canal.                                                                                                        |
| Uso de digitação/token, mas sem mensagem no Discord | O log da sessão mostra texto do assistente com `didSendViaMessagingTool: false` | O modelo respondeu em privado em vez de chamar a ferramenta de mensagens. Use um modelo confiável para chamadas de ferramenta ou defina `messages.groupChat.visibleReplies: "automatic"` para publicar automaticamente. |
| Respostas por DM ausentes                 | `openclaw pairing list discord`                                                 | Aprove o pareamento por DM ou ajuste a política de DM.                                                                                                                      |

Solução de problemas completa: [Solução de problemas do Discord](/pt-BR/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                | Verificação mais rápida                   | Correção                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado, mas sem respostas | `openclaw channels status --probe`        | Verifique o token do app + token do bot e os escopos necessários; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações baseadas em SecretRef. |
| DMs bloqueadas                         | `openclaw pairing list slack`             | Aprove o pareamento ou afrouxe a política de DM.                                                                                                         |
| Mensagem de canal ignorada             | Verifique `groupPolicy` e a lista de permissões do canal | Permita o canal ou altere a política para `open`.                                                                                                        |

Solução de problemas completa: [Solução de problemas do Slack](/pt-BR/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Assinaturas de falha do iMessage e BlueBubbles

| Sintoma                          | Verificação mais rápida                                                   | Correção                                                |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| Nenhum evento de entrada         | Verifique a acessibilidade do webhook/servidor e as permissões do app     | Corrija a URL do webhook ou o estado do servidor BlueBubbles. |
| Consegue enviar, mas não recebe no macOS | Verifique as permissões de privacidade do macOS para automação do Mensagens | Conceda novamente as permissões TCC e reinicie o processo do canal. |
| Remetente de DM bloqueado        | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles`   | Aprove o pareamento ou atualize a lista de permissões.  |

Solução de problemas completa:

- [Solução de problemas do iMessage](/pt-BR/channels/imessage#troubleshooting)
- [Solução de problemas do BlueBubbles](/pt-BR/channels/bluebubbles#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                         | Verificação mais rápida                      | Correção                                                   |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe`           | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento. |
| DM bloqueada                    | `openclaw pairing list signal`               | Aprove o remetente ou ajuste a política de DM.             |
| Respostas de grupo não disparam | Verifique a lista de permissões do grupo e os padrões de menção | Adicione remetente/grupo ou afrouxe o controle.            |

Solução de problemas completa: [Solução de problemas do Signal](/pt-BR/channels/signal#troubleshooting)

## QQ Bot

### Assinaturas de falha do QQ Bot

| Sintoma                         | Verificação mais rápida                       | Correção                                                         |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Bot responde "foi para Marte"   | Verifique `appId` e `clientSecret` na configuração | Defina as credenciais ou reinicie o Gateway.                    |
| Nenhuma mensagem de entrada     | `openclaw channels status --probe`            | Verifique as credenciais na QQ Open Platform.                   |
| Voz não transcrita              | Verifique a configuração do provedor de STT   | Configure `channels.qqbot.stt` ou `tools.media.audio`.          |
| Mensagens proativas não chegam  | Verifique os requisitos de interação da plataforma QQ | O QQ pode bloquear mensagens iniciadas pelo bot sem interação recente. |

Solução de problemas completa: [Solução de problemas do QQ Bot](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                             | Verificação mais rápida                    | Correção                                                                    |
| ----------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| Conectado, mas ignora mensagens da sala | `openclaw channels status --probe`         | Verifique `groupPolicy`, a lista de permissões da sala e o controle de menção. |
| DMs não são processadas             | `openclaw pairing list matrix`             | Aprove o remetente ou ajuste a política de DM.                              |
| Salas criptografadas falham         | `openclaw matrix verify status`            | Verifique novamente o dispositivo e, depois, confira `openclaw matrix verify backup status`. |
| Restauração de backup está pendente/quebrada | `openclaw matrix verify backup status`     | Execute `openclaw matrix verify backup restore` ou rode novamente com uma chave de recuperação. |
| Assinatura cruzada/bootstrap parece incorreta | `openclaw matrix verify bootstrap`         | Repare o armazenamento secreto, a assinatura cruzada e o estado do backup em uma única passagem. |

Configuração completa: [Matrix](/pt-BR/channels/matrix)

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
