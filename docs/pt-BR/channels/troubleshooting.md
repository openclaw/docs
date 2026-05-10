---
read_when:
    - O transporte do canal informa que está conectado, mas as respostas falham
    - Você precisa de verificações específicas por canal antes da documentação detalhada do provedor
summary: Solução rápida de problemas em nível de canal, com assinaturas de falha e correções por canal
title: Solução de problemas de canais
x-i18n:
    generated_at: "2026-05-10T19:24:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

Use esta página quando um canal se conecta, mas o comportamento está incorreto.

## Sequência de comandos

Execute estes primeiro, na ordem:

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
- A sondagem do canal mostra o transporte conectado e, quando houver suporte, `works` ou `audit ok`

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                             | Verificação mais rápida                             | Correção                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, mas sem respostas em DM  | `openclaw pairing list whatsapp`                    | Aprove o remetente ou altere a política/lista de permissões de DM.                                                                    |
| Mensagens de grupo ignoradas        | Verifique `requireMention` + padrões de menção na configuração | Mencione o bot ou relaxe a política de menção para esse grupo.                                                                        |
| Login por QR expira com 408         | Verifique as envs `HTTPS_PROXY` / `HTTP_PROXY` do Gateway | Defina um proxy acessível; use `NO_PROXY` apenas para bypasses.                                                                       |
| Loops aleatórios de desconexão/relogin | `openclaw channels status --probe` + logs        | Reconexões recentes são sinalizadas mesmo quando o canal está conectado no momento; acompanhe os logs, reinicie o Gateway e refaça o vínculo se a instabilidade continuar. |
| Respostas chegam segundos/minutos atrasadas | `openclaw doctor --fix`                      | O doctor interrompe clientes TUI locais obsoletos verificados quando eles estão degradando o loop de eventos do Gateway.              |

Solução de problemas completa: [Solução de problemas do WhatsApp](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                              | Verificação mais rápida                          | Correção                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mas sem fluxo de resposta utilizável | `openclaw pairing list telegram`        | Aprove o pareamento ou altere a política de DM.                                                                                 |
| Bot online, mas o grupo permanece silencioso | Verifique o requisito de menção e o modo de privacidade do bot | Desative o modo de privacidade para visibilidade no grupo ou mencione o bot.                                                     |
| Falhas de envio com erros de rede    | Inspecione os logs em busca de falhas de chamadas à API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                                  |
| Inicialização relata `getMe returned 401` | Verifique a origem do token configurada     | Copie novamente ou gere outra vez o token do BotFather e atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` da conta padrão. |
| Polling trava ou reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Atualize; se reinicializações forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda apontam para proxy/DNS/IPv6. |
| `setMyCommands` rejeitado na inicialização | Inspecione os logs em busca de `BOT_COMMANDS_TOO_MUCH` | Reduza comandos de plugins/Skills/personalizados do Telegram ou desative menus nativos.                                          |
| Após atualização, a lista de permissões bloqueia você | `openclaw security audit` e listas de permissões da configuração | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos de remetente.                                         |

Solução de problemas completa: [Solução de problemas do Telegram](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                                   | Verificação mais rápida                                                          | Correção                                                                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, mas sem respostas no servidor | `openclaw channels status --probe`                                               | Permita o servidor/canal e verifique a intent de conteúdo de mensagem.                                                                                                       |
| Mensagens de grupo ignoradas              | Verifique os logs em busca de quedas por bloqueio de menção                      | Mencione o bot ou defina `requireMention: false` para servidor/canal.                                                                                                        |
| Uso de digitação/token, mas sem mensagem no Discord | O log da sessão mostra texto do assistente com `didSendViaMessagingTool: false` | O modelo respondeu em privado em vez de chamar a ferramenta de mensagem. Use um modelo confiável para chamadas de ferramenta ou defina `messages.groupChat.visibleReplies: "automatic"` para publicar automaticamente. |
| Respostas de DM ausentes                  | `openclaw pairing list discord`                                                  | Aprove o pareamento de DM ou ajuste a política de DM.                                                                                                                        |

Solução de problemas completa: [Solução de problemas do Discord](/pt-BR/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                | Verificação mais rápida                   | Correção                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado, mas sem respostas | `openclaw channels status --probe`      | Verifique o token do app + token do bot e os escopos necessários; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações baseadas em SecretRef. |
| DMs bloqueadas                         | `openclaw pairing list slack`             | Aprove o pareamento ou relaxe a política de DM.                                                                                                           |
| Mensagem de canal ignorada             | Verifique `groupPolicy` e a lista de permissões de canais | Permita o canal ou altere a política para `open`.                                                                                                         |

Solução de problemas completa: [Solução de problemas do Slack](/pt-BR/channels/slack#troubleshooting)

## iMessage

### Assinaturas de falha do iMessage

| Sintoma                              | Verificação mais rápida                                 | Correção                                                                   |
| ------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `imsg` ausente ou falha fora do macOS | `openclaw channels status --probe --channel imessage`  | Execute o OpenClaw no Mac do Messages ou use um wrapper SSH para `cliPath`. |
| Consegue enviar, mas não receber no macOS | Verifique as permissões de privacidade do macOS para automação do Messages | Conceda novamente permissões TCC e reinicie o processo do canal.            |
| Remetente de DM bloqueado            | `openclaw pairing list imessage`                        | Aprove o pareamento ou atualize a lista de permissões.                      |

Solução de problemas completa:

- [Solução de problemas do iMessage](/pt-BR/channels/imessage#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                         | Verificação mais rápida                    | Correção                                                      |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe`    | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento. |
| DM bloqueada                    | `openclaw pairing list signal`             | Aprove o remetente ou ajuste a política de DM.                |
| Respostas de grupo não disparam | Verifique a lista de permissões do grupo e padrões de menção | Adicione remetente/grupo ou afrouxe o bloqueio.               |

Solução de problemas completa: [Solução de problemas do Signal](/pt-BR/channels/signal#troubleshooting)

## QQ Bot

### Assinaturas de falha do QQ Bot

| Sintoma                         | Verificação mais rápida                       | Correção                                                             |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| Bot responde "foi para Marte"   | Verifique `appId` e `clientSecret` na configuração | Defina as credenciais ou reinicie o Gateway.                         |
| Nenhuma mensagem recebida       | `openclaw channels status --probe`            | Verifique as credenciais na QQ Open Platform.                        |
| Voz não transcrita              | Verifique a configuração do provedor STT      | Configure `channels.qqbot.stt` ou `tools.media.audio`.               |
| Mensagens proativas não chegam  | Verifique os requisitos de interação da plataforma QQ | A QQ pode bloquear mensagens iniciadas pelo bot sem interação recente. |

Solução de problemas completa: [Solução de problemas do QQ Bot](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                             | Verificação mais rápida                    | Correção                                                                       |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| Logado, mas ignora mensagens da sala | `openclaw channels status --probe`        | Verifique `groupPolicy`, a lista de permissões da sala e o bloqueio por menção. |
| DMs não são processadas             | `openclaw pairing list matrix`             | Aprove o remetente ou ajuste a política de DM.                                 |
| Salas criptografadas falham         | `openclaw matrix verify status`            | Verifique novamente o dispositivo e depois confira `openclaw matrix verify backup status`. |
| Restauração de backup pendente/quebrada | `openclaw matrix verify backup status` | Execute `openclaw matrix verify backup restore` ou rode novamente com uma chave de recuperação. |
| Cross-signing/bootstrap parece incorreto | `openclaw matrix verify bootstrap`   | Repare o armazenamento secreto, o cross-signing e o estado do backup em uma única passada. |

Configuração e setup completos: [Matrix](/pt-BR/channels/matrix)

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
