---
read_when:
    - O transporte do canal informa que está conectado, mas as respostas falham
    - Você precisa de verificações específicas de canal antes da documentação aprofundada de provedores
summary: Solução rápida de problemas em nível de canal com assinaturas de falha e correções por canal
title: Solução de problemas de canais
x-i18n:
    generated_at: "2026-04-30T09:38:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Use esta página quando um canal conecta, mas o comportamento está incorreto.

## Escada de comandos

Execute estes comandos em ordem primeiro:

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
- `Capability: read-only`, `write-capable`, ou `admin-capable`
- A sondagem do canal mostra o transporte conectado e, quando compatível, `works` ou `audit ok`

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                         | Verificação mais rápida                              | Correção                                                                                                                        |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, mas sem respostas em DM | `openclaw pairing list whatsapp`                   | Aprove o remetente ou altere a política/lista de permissões de DM.                                                              |
| Mensagens de grupo ignoradas    | Verifique `requireMention` + padrões de menção na configuração | Mencione o bot ou flexibilize a política de menção para esse grupo.                                                             |
| Login por QR expira com 408     | Verifique as env `HTTPS_PROXY` / `HTTP_PROXY` do Gateway | Configure um proxy acessível; use `NO_PROXY` apenas para desvios.                                                               |
| Loops aleatórios de desconexão/relogin | `openclaw channels status --probe` + logs      | Reconexões recentes são sinalizadas mesmo quando atualmente conectado; acompanhe os logs, reinicie o Gateway e religue se a instabilidade continuar. |

Solução de problemas completa: [Solução de problemas do WhatsApp](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                              | Verificação mais rápida                              | Correção                                                                                                                        |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mas sem fluxo de resposta utilizável | `openclaw pairing list telegram`             | Aprove o pareamento ou altere a política de DM.                                                                                 |
| Bot online, mas o grupo permanece silencioso | Verifique o requisito de menção e o modo de privacidade do bot | Desative o modo de privacidade para visibilidade no grupo ou mencione o bot.                                                     |
| Falhas de envio com erros de rede    | Inspecione os logs em busca de falhas de chamada da API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                                 |
| Inicialização relata `getMe returned 401` | Verifique a origem do token configurado          | Copie novamente ou gere de novo o token do BotFather e atualize `botToken`, `tokenFile` ou o `TELEGRAM_BOT_TOKEN` da conta padrão. |
| Polling trava ou reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Atualize; se reinicializações forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda apontam para proxy/DNS/IPv6. |
| `setMyCommands` rejeitado na inicialização | Inspecione os logs por `BOT_COMMANDS_TOO_MUCH` | Reduza comandos do Telegram de Plugin/Skills/personalizados ou desative menus nativos.                                          |
| Atualizou e a lista de permissões bloqueia você | `openclaw security audit` e listas de permissões na configuração | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos de remetente.                                       |

Solução de problemas completa: [Solução de problemas do Telegram](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                         | Verificação mais rápida              | Correção                                                  |
| ------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Bot online, mas sem respostas em guild | `openclaw channels status --probe` | Permita a guild/canal e verifique a intenção de conteúdo da mensagem. |
| Mensagens de grupo ignoradas    | Verifique os logs em busca de descartes por bloqueio de menção | Mencione o bot ou defina `requireMention: false` na guild/canal. |
| Respostas de DM ausentes        | `openclaw pairing list discord`      | Aprove o pareamento de DM ou ajuste a política de DM.     |

Solução de problemas completa: [Solução de problemas do Discord](/pt-BR/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                | Verificação mais rápida                    | Correção                                                                                                                                             |
| -------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modo socket conectado, mas sem respostas | `openclaw channels status --probe`       | Verifique o token do app + token do bot e os escopos necessários; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações baseadas em SecretRef. |
| DMs bloqueadas                         | `openclaw pairing list slack`             | Aprove o pareamento ou flexibilize a política de DM.                                                                                                 |
| Mensagem de canal ignorada             | Verifique `groupPolicy` e a lista de permissões de canais | Permita o canal ou altere a política para `open`.                                                                                                    |

Solução de problemas completa: [Solução de problemas do Slack](/pt-BR/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Assinaturas de falha do iMessage e BlueBubbles

| Sintoma                          | Verificação mais rápida                                                   | Correção                                             |
| -------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| Sem eventos de entrada           | Verifique a acessibilidade do Webhook/servidor e permissões do app        | Corrija a URL do Webhook ou o estado do servidor BlueBubbles. |
| Consegue enviar, mas não receber no macOS | Verifique as permissões de privacidade do macOS para automação do Mensagens | Conceda novamente permissões de TCC e reinicie o processo do canal. |
| Remetente de DM bloqueado        | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles`   | Aprove o pareamento ou atualize a lista de permissões. |

Solução de problemas completa:

- [Solução de problemas do iMessage](/pt-BR/channels/imessage#troubleshooting)
- [Solução de problemas do BlueBubbles](/pt-BR/channels/bluebubbles#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                         | Verificação mais rápida                      | Correção                                                |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe`      | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento. |
| DM bloqueada                    | `openclaw pairing list signal`               | Aprove o remetente ou ajuste a política de DM.          |
| Respostas de grupo não disparam | Verifique a lista de permissões de grupo e padrões de menção | Adicione remetente/grupo ou afrouxe o bloqueio.         |

Solução de problemas completa: [Solução de problemas do Signal](/pt-BR/channels/signal#troubleshooting)

## QQ Bot

### Assinaturas de falha do QQ Bot

| Sintoma                         | Verificação mais rápida                         | Correção                                                       |
| ------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Bot responde "foi para Marte"   | Verifique `appId` e `clientSecret` na configuração | Defina credenciais ou reinicie o Gateway.                      |
| Sem mensagens de entrada        | `openclaw channels status --probe`              | Verifique as credenciais na QQ Open Platform.                  |
| Voz não transcrita              | Verifique a configuração do provedor STT        | Configure `channels.qqbot.stt` ou `tools.media.audio`.         |
| Mensagens proativas não chegam  | Verifique os requisitos de interação da plataforma QQ | QQ pode bloquear mensagens iniciadas pelo bot sem interação recente. |

Solução de problemas completa: [Solução de problemas do QQ Bot](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                             | Verificação mais rápida                    | Correção                                                                 |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Logado, mas ignora mensagens de sala | `openclaw channels status --probe`        | Verifique `groupPolicy`, a lista de permissões de salas e o bloqueio por menção. |
| DMs não são processadas             | `openclaw pairing list matrix`             | Aprove o remetente ou ajuste a política de DM.                           |
| Salas criptografadas falham         | `openclaw matrix verify status`            | Verifique novamente o dispositivo e depois verifique `openclaw matrix verify backup status`. |
| Restauração de backup pendente/quebrada | `openclaw matrix verify backup status` | Execute `openclaw matrix verify backup restore` ou execute novamente com uma chave de recuperação. |
| Cross-signing/bootstrap parece incorreto | `openclaw matrix verify bootstrap`     | Repare armazenamento secreto, cross-signing e estado do backup em uma única passagem. |

Configuração completa: [Matrix](/pt-BR/channels/matrix)

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
