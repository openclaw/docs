---
read_when:
    - O transporte do canal diz que está conectado, mas as respostas falham
    - Você precisa de verificações específicas do canal antes de consultar a documentação detalhada do provedor
summary: Solução rápida de problemas no nível do canal com assinaturas de falha e correções por canal
title: Solução de problemas de canal
x-i18n:
    generated_at: "2026-04-24T05:43:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Use esta página quando um canal se conecta, mas o comportamento está errado.

## Escada de comandos

Execute estes comandos nesta ordem primeiro:

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
- A verificação do canal mostra o transporte conectado e, quando compatível, `works` ou `audit ok`

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                         | Verificação mais rápida                            | Correção                                                |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Conectado, mas sem respostas em DM | `openclaw pairing list whatsapp`                 | Aprove o remetente ou altere a política de DM/allowlist. |
| Mensagens de grupo ignoradas    | Verifique `requireMention` + padrões de menção na configuração | Mencione o bot ou flexibilize a política de menção para esse grupo. |
| Loops aleatórios de desconexão/relogin | `openclaw channels status --probe` + logs      | Faça login novamente e verifique se o diretório de credenciais está íntegro. |

Solução de problemas completa: [Solução de problemas do WhatsApp](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                             | Verificação mais rápida                           | Correção                                                                                                                  |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mas sem fluxo de resposta utilizável | `openclaw pairing list telegram`        | Aprove o pairing ou altere a política de DM.                                                                              |
| Bot online, mas o grupo fica em silêncio | Verifique a exigência de menção e o modo de privacidade do bot | Desative o modo de privacidade para visibilidade em grupo ou mencione o bot.                                              |
| Falhas de envio com erros de rede   | Inspecione os logs para falhas de chamada da API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                           |
| O polling trava ou reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Atualize; se as reinicializações forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda apontam para proxy/DNS/IPv6. |
| `setMyCommands` rejeitado na inicialização | Inspecione os logs para `BOT_COMMANDS_TOO_MUCH` | Reduza comandos personalizados/do Plugin/do Skills do Telegram ou desative menus nativos.                                |
| Você atualizou e a allowlist bloqueia você | `openclaw security audit` e allowlists da configuração | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos de remetente.                                 |

Solução de problemas completa: [Solução de problemas do Telegram](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                         | Verificação mais rápida              | Correção                                                   |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Bot online, mas sem respostas em servidor | `openclaw channels status --probe` | Permita o servidor/canal e verifique a intenção de conteúdo de mensagem. |
| Mensagens de grupo ignoradas    | Verifique os logs para descartes por restrição de menção | Mencione o bot ou defina `guild/channel requireMention: false`. |
| Respostas em DM ausentes        | `openclaw pairing list discord`      | Aprove o pairing de DM ou ajuste a política de DM.         |

Solução de problemas completa: [Solução de problemas do Discord](/pt-BR/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                                | Verificação mais rápida                      | Correção                                                                                                                                             |
| -------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado, mas sem respostas | `openclaw channels status --probe`         | Verifique o token do app + token do bot e os escopos necessários; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações com SecretRef. |
| DMs bloqueadas                         | `openclaw pairing list slack`                | Aprove o pairing ou flexibilize a política de DM.                                                                                                   |
| Mensagem de canal ignorada             | Verifique `groupPolicy` e a allowlist do canal | Permita o canal ou altere a política para `open`.                                                                                                 |

Solução de problemas completa: [Solução de problemas do Slack](/pt-BR/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Assinaturas de falha do iMessage e BlueBubbles

| Sintoma                          | Verificação mais rápida                                         | Correção                                              |
| -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Nenhum evento de entrada         | Verifique a acessibilidade do Webhook/servidor e as permissões do app | Corrija a URL do Webhook ou o estado do servidor BlueBubbles. |
| Consegue enviar, mas não receber no macOS | Verifique as permissões de privacidade do macOS para automação do Messages | Conceda novamente as permissões TCC e reinicie o processo do canal. |
| Remetente de DM bloqueado        | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Aprove o pairing ou atualize a allowlist.             |

Solução de problemas completa:

- [Solução de problemas do iMessage](/pt-BR/channels/imessage#troubleshooting)
- [Solução de problemas do BlueBubbles](/pt-BR/channels/bluebubbles#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                         | Verificação mais rápida               | Correção                                                     |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe`  | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento. |
| DM bloqueada                    | `openclaw pairing list signal`        | Aprove o remetente ou ajuste a política de DM.               |
| Respostas em grupo não disparam | Verifique a allowlist do grupo e os padrões de menção | Adicione o remetente/grupo ou flexibilize a restrição.       |

Solução de problemas completa: [Solução de problemas do Signal](/pt-BR/channels/signal#troubleshooting)

## QQ Bot

### Assinaturas de falha do QQ Bot

| Sintoma                         | Verificação mais rápida                        | Correção                                                        |
| ------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| O bot responde "gone to Mars"   | Verifique `appId` e `clientSecret` na configuração | Defina as credenciais ou reinicie o gateway.                  |
| Nenhuma mensagem de entrada     | `openclaw channels status --probe`             | Verifique as credenciais na QQ Open Platform.                  |
| Voz não transcrita              | Verifique a configuração do provedor de STT    | Configure `channels.qqbot.stt` ou `tools.media.audio`.         |
| Mensagens proativas não chegam  | Verifique os requisitos de interação da plataforma QQ | O QQ pode bloquear mensagens iniciadas pelo bot sem interação recente. |

Solução de problemas completa: [Solução de problemas do QQ Bot](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                             | Verificação mais rápida                 | Correção                                                                  |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Login feito, mas ignora mensagens da sala | `openclaw channels status --probe`  | Verifique `groupPolicy`, a allowlist da sala e a restrição por menção.    |
| DMs não são processadas             | `openclaw pairing list matrix`          | Aprove o remetente ou ajuste a política de DM.                            |
| Salas criptografadas falham         | `openclaw matrix verify status`         | Verifique novamente o dispositivo e depois confira `openclaw matrix verify backup status`. |
| Restauração de backup pendente/com problemas | `openclaw matrix verify backup status` | Execute `openclaw matrix verify backup restore` ou repita com uma chave de recuperação. |
| Cross-signing/bootstrap parece incorreto | `openclaw matrix verify bootstrap`   | Repare o armazenamento de segredos, o cross-signing e o estado do backup de uma só vez. |

Configuração e instalação completas: [Matrix](/pt-BR/channels/matrix)

## Relacionado

- [Pairing](/pt-BR/channels/pairing)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Solução de problemas do gateway](/pt-BR/gateway/troubleshooting)
