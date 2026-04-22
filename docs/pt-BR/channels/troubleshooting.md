---
read_when:
    - O transporte do canal diz que está conectado, mas as respostas falham
    - Você precisa de verificações específicas do canal antes de consultar a documentação detalhada do provedor
summary: Solução rápida de problemas em nível de canal com assinaturas de falha e correções por canal
title: Solução de problemas de canal
x-i18n:
    generated_at: "2026-04-22T04:20:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Solução de problemas de canal

Use esta página quando um canal se conecta, mas o comportamento está incorreto.

## Escada de comandos

Execute estes comandos primeiro, nesta ordem:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Referência de estado saudável:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- A sonda do canal mostra o transporte conectado e, quando houver suporte, `works` ou `audit ok`

## WhatsApp

### Assinaturas de falha do WhatsApp

| Sintoma                        | Verificação mais rápida                            | Correção                                                    |
| ------------------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| Conectado, mas sem respostas em DM | `openclaw pairing list whatsapp`                | Aprove o remetente ou altere a política/lista de permissões de DM. |
| Mensagens de grupo ignoradas   | Verifique `requireMention` + padrões de menção na configuração | Mencione o bot ou relaxe a política de menção para esse grupo. |
| Loops aleatórios de desconexão/relogin | `openclaw channels status --probe` + logs   | Faça login novamente e verifique se o diretório de credenciais está íntegro. |

Solução completa de problemas: [Solução de problemas do WhatsApp](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Assinaturas de falha do Telegram

| Sintoma                            | Verificação mais rápida                           | Correção                                                                                                                     |
| ---------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mas sem fluxo de resposta utilizável | `openclaw pairing list telegram`      | Aprove o pairing ou altere a política de DM.                                                                                 |
| Bot online, mas o grupo permanece silencioso | Verifique a exigência de menção e o modo de privacidade do bot | Desative o modo de privacidade para visibilidade no grupo ou mencione o bot.                                                |
| Falhas de envio com erros de rede  | Inspecione os logs para falhas de chamada da API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                             |
| O polling trava ou reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Atualize; se os reinícios forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda apontam para proxy/DNS/IPv6. |
| `setMyCommands` rejeitado na inicialização | Inspecione os logs para `BOT_COMMANDS_TOO_MUCH` | Reduza os comandos de plugin/Skills/personalizados do Telegram ou desative menus nativos.                                   |
| Você atualizou e a lista de permissões está bloqueando você | `openclaw security audit` e listas de permissões na configuração | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos do remetente.                                    |

Solução completa de problemas: [Solução de problemas do Telegram](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Assinaturas de falha do Discord

| Sintoma                        | Verificação mais rápida              | Correção                                                      |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Bot online, mas sem respostas na guilda | `openclaw channels status --probe` | Permita a guilda/canal e verifique a intent de conteúdo de mensagem. |
| Mensagens de grupo ignoradas  | Verifique os logs para descartes por controle de menção | Mencione o bot ou defina `requireMention: false` para a guilda/canal. |
| Respostas em DM ausentes      | `openclaw pairing list discord`      | Aprove o pairing de DM ou ajuste a política de DM.            |

Solução completa de problemas: [Solução de problemas do Discord](/pt-BR/channels/discord#troubleshooting)

## Slack

### Assinaturas de falha do Slack

| Sintoma                               | Verificação mais rápida                   | Correção                                                                                                                                              |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode conectado, mas sem respostas | `openclaw channels status --probe`      | Verifique o token do app + token do bot e os escopos necessários; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações com SecretRef. |
| DMs bloqueadas                        | `openclaw pairing list slack`             | Aprove o pairing ou relaxe a política de DM.                                                                                                         |
| Mensagem de canal ignorada            | Verifique `groupPolicy` e a lista de permissões do canal | Permita o canal ou altere a política para `open`.                                                                                                   |

Solução completa de problemas: [Solução de problemas do Slack](/pt-BR/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Assinaturas de falha do iMessage e do BlueBubbles

| Sintoma                         | Verificação mais rápida                                                | Correção                                              |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Nenhum evento de entrada        | Verifique a acessibilidade do Webhook/servidor e as permissões do app  | Corrija a URL do Webhook ou o estado do servidor BlueBubbles. |
| Consegue enviar, mas não receber no macOS | Verifique as permissões de privacidade do macOS para automação do Messages | Conceda novamente as permissões do TCC e reinicie o processo do canal. |
| Remetente de DM bloqueado       | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Aprove o pairing ou atualize a lista de permissões.   |

Solução completa de problemas:

- [Solução de problemas do iMessage](/pt-BR/channels/imessage#troubleshooting)
- [Solução de problemas do BlueBubbles](/pt-BR/channels/bluebubbles#troubleshooting)

## Signal

### Assinaturas de falha do Signal

| Sintoma                        | Verificação mais rápida                 | Correção                                                 |
| ----------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe` | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento. |
| DM bloqueada                  | `openclaw pairing list signal`          | Aprove o remetente ou ajuste a política de DM.           |
| Respostas em grupo não disparam | Verifique a lista de permissões do grupo e os padrões de menção | Adicione o remetente/grupo ou afrouxe o controle.        |

Solução completa de problemas: [Solução de problemas do Signal](/pt-BR/channels/signal#troubleshooting)

## Bot QQ

### Assinaturas de falha do bot QQ

| Sintoma                        | Verificação mais rápida                          | Correção                                                            |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| O bot responde "gone to Mars" | Verifique `appId` e `clientSecret` na configuração | Defina as credenciais ou reinicie o Gateway.                        |
| Nenhuma mensagem de entrada   | `openclaw channels status --probe`               | Verifique as credenciais na QQ Open Platform.                       |
| Voz não transcrita            | Verifique a configuração do provedor de STT      | Configure `channels.qqbot.stt` ou `tools.media.audio`.              |
| Mensagens proativas não chegam | Verifique os requisitos de interação da plataforma QQ | O QQ pode bloquear mensagens iniciadas pelo bot sem interação recente. |

Solução completa de problemas: [Solução de problemas do bot QQ](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                              | Verificação mais rápida                 | Correção                                                                  |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| Login realizado, mas ignora mensagens da sala | `openclaw channels status --probe` | Verifique `groupPolicy`, a lista de permissões da sala e o controle de menção. |
| DMs não são processadas              | `openclaw pairing list matrix`          | Aprove o remetente ou ajuste a política de DM.                            |
| Salas criptografadas falham          | `openclaw matrix verify status`         | Verifique novamente o dispositivo e, em seguida, confira `openclaw matrix verify backup status`. |
| A restauração do backup está pendente/com problemas | `openclaw matrix verify backup status` | Execute `openclaw matrix verify backup restore` ou rode novamente com uma chave de recuperação. |
| A assinatura cruzada/bootstrap parece incorreta | `openclaw matrix verify bootstrap` | Repare o armazenamento secreto, a assinatura cruzada e o estado do backup em uma única etapa. |

Configuração e setup completos: [Matrix](/pt-BR/channels/matrix)
