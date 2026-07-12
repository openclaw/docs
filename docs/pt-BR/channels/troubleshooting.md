---
read_when:
    - O transporte do canal indica que está conectado, mas as respostas falham
    - Você precisa de verificações específicas do canal antes de consultar a documentação detalhada do provedor
summary: Solução rápida de problemas no nível do canal, com assinaturas de falha e correções específicas para cada canal
title: Solução de problemas de canais
x-i18n:
    generated_at: "2026-07-12T14:55:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Use esta página quando um canal se conectar, mas o comportamento estiver incorreto.

## Sequência de comandos

Primeiro, execute estes comandos na ordem:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Referência de funcionamento normal:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- A sondagem do canal mostra que o transporte está conectado e, quando houver suporte, `works` ou `audit ok`

## Após uma atualização

Use este procedimento quando Telegram, iMessage, configurações da época do BlueBubbles ou outro canal de plugin desaparecer
após uma atualização.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Procure por `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` em `openclaw
status --all`. Isso significa que o canal está configurado, mas a configuração ou o carregamento do plugin encontrou uma árvore de
dependências corrompida em vez de registrar o canal. `openclaw doctor --fix` remove links simbólicos obsoletos de
dependências do runtime do plugin e sombras de autenticação obsoletas; depois, `openclaw gateway restart` recarrega
um estado limpo.

## WhatsApp

### Indícios de falha do WhatsApp

| Sintoma                             | Verificação mais rápida                               | Correção                                                                                                                                                                                          |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conectado, mas sem respostas em MD  | `openclaw pairing list whatsapp`                      | Aprove o remetente ou altere a política/lista de permissões de MD.                                                                                                                                |
| Mensagens de grupo ignoradas        | Verifique `requireMention` + padrões de menção na configuração | Mencione o bot ou flexibilize a política de menção para esse grupo.                                                                                                                               |
| Login por QR expira com 408         | Verifique as variáveis de ambiente `HTTPS_PROXY` / `HTTP_PROXY` do Gateway | Defina um proxy acessível; use `NO_PROXY` apenas para exceções.                                                                                                                                    |
| Ciclos aleatórios de desconexão/novo login | `openclaw channels status --probe` + logs             | Reconexões recentes são sinalizadas mesmo quando o canal está conectado no momento; acompanhe os logs, reinicie o Gateway e refaça o vínculo se a instabilidade continuar.                         |
| Ciclo de `status=408 Request Time-out` | Sondagem, logs, doctor e depois status do Gateway     | Primeiro corrija a conectividade/temporização do host; faça backup da autenticação e vincule novamente a conta se o ciclo persistir.                                                               |
| Respostas chegam segundos/minutos atrasadas | `openclaw doctor --fix`                               | O doctor encerra clientes TUI locais obsoletos confirmados quando eles estão prejudicando o loop de eventos do Gateway.                                                                            |

Solução de problemas completa: [Solução de problemas do WhatsApp](/pt-BR/channels/whatsapp#troubleshooting)

## Telegram

### Indícios de falha do Telegram

| Sintoma                              | Verificação mais rápida                            | Correção                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mas sem um fluxo de resposta utilizável | `openclaw pairing list telegram`                   | Aprove o pareamento ou altere a política de MD.                                                                                                                                             |
| Bot online, mas o grupo permanece em silêncio | Verifique o requisito de menção e o modo de privacidade do bot | Desative o modo de privacidade para dar visibilidade ao grupo ou mencione o bot.                                                                                                            |
| Falhas de envio com erros de rede    | Examine os logs em busca de falhas nas chamadas à API do Telegram | Corrija o roteamento de DNS/IPv6/proxy para `api.telegram.org`.                                                                                                                              |
| A inicialização informa `getMe returned 401` | Verifique a origem do token configurado            | Copie novamente ou gere novamente o token do BotFather e atualize `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` da conta padrão.                                                          |
| O polling trava ou se reconecta lentamente | Use `openclaw logs --follow` para obter diagnósticos do polling | Atualize; se as reinicializações forem falsos positivos, ajuste `pollingStallThresholdMs`. Travamentos persistentes ainda indicam problemas de proxy/DNS/IPv6.                              |
| `setMyCommands` rejeitado na inicialização | Examine os logs em busca de `BOT_COMMANDS_TOO_MUCH` | Reduza os comandos de plugins/Skills/personalizados do Telegram ou desative os menus nativos.                                                                                               |
| Após a atualização, a lista de permissões bloqueia você | `openclaw security audit` e listas de permissões da configuração | Execute `openclaw doctor --fix` ou substitua `@username` por IDs numéricos de remetente.                                                                                                    |

Solução de problemas completa: [Solução de problemas do Telegram](/pt-BR/channels/telegram#troubleshooting)

## Discord

### Indícios de falha do Discord

| Sintoma                                   | Verificação mais rápida                                                                                                                | Correção                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, mas sem respostas no servidor | `openclaw channels status --probe`                                                                                                     | Permita o servidor/canal e verifique a intenção de conteúdo das mensagens.                                                                                                                                                                                                                                   |
| Mensagens de grupo ignoradas              | Verifique nos logs se houve descartes pelo controle de menções                                                                         | Mencione o bot ou defina `requireMention: false` no servidor/canal.                                                                                                                                                                                                                                           |
| Uso de digitação/tokens, mas sem mensagem no Discord | Verifique se este é um evento de sala ambiente ou uma sala `message_tool` habilitada na qual o modelo não executou `message(action=send)` | Examine o log detalhado do Gateway em busca de metadados de payload final suprimido, verifique `messages.groupChat.unmentionedInbound`, leia [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events) ou mantenha `messages.groupChat.visibleReplies: "automatic"` para solicitações normais de grupo. |
| Respostas em MD ausentes                  | `openclaw pairing list discord`                                                                                                        | Aprove o pareamento de MD ou ajuste a política de MD.                                                                                                                                                                                                                                                        |

Solução de problemas completa: [Solução de problemas do Discord](/pt-BR/channels/discord#troubleshooting)

## Slack

### Indícios de falha do Slack

| Sintoma                                | Verificação mais rápida                     | Correção                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modo Socket conectado, mas sem respostas | `openclaw channels status --probe`          | Verifique o token do aplicativo + token do bot e os escopos necessários; observe `botTokenStatus` / `appTokenStatus = configured_unavailable` em configurações baseadas em SecretRef. |
| MDs bloqueadas                         | `openclaw pairing list slack`               | Aprove o pareamento ou flexibilize a política de MD.                                                                                                                            |
| Mensagem do canal ignorada             | Verifique `groupPolicy` e a lista de permissões do canal | Permita o canal ou altere a política para `open`.                                                                                                                               |

Solução de problemas completa: [Solução de problemas do Slack](/pt-BR/channels/slack#troubleshooting)

## iMessage

### Indícios de falha do iMessage

| Sintoma                              | Verificação mais rápida                                   | Correção                                                                                  |
| ------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `imsg` ausente ou falha fora do macOS | `openclaw channels status --probe --channel imessage`     | Execute o OpenClaw no Mac com o Mensagens ou use um wrapper SSH para `cliPath`.            |
| Consegue enviar, mas não receber no macOS | Verifique as permissões de privacidade do macOS para automação do Mensagens | Conceda novamente as permissões de TCC e reinicie o processo do canal.                     |
| Remetente de MD bloqueado            | `openclaw pairing list imessage`                          | Aprove o pareamento ou atualize a lista de permissões.                                     |

Solução de problemas completa: [Solução de problemas do iMessage](/pt-BR/channels/imessage#troubleshooting)

## Signal

### Indícios de falha do Signal

| Sintoma                         | Verificação mais rápida                              | Correção                                                                  |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Daemon acessível, mas bot silencioso | `openclaw channels status --probe`                   | Verifique a URL/conta do daemon `signal-cli` e o modo de recebimento.      |
| MD bloqueada                    | `openclaw pairing list signal`                       | Aprove o remetente ou ajuste a política de MD.                             |
| Respostas de grupo não são acionadas | Verifique a lista de permissões do grupo e os padrões de menção | Adicione o remetente/grupo ou flexibilize o controle.                      |

Solução de problemas completa: [Solução de problemas do Signal](/pt-BR/channels/signal#troubleshooting)

## QQ Bot

### Indícios de falha do QQ Bot

| Sintoma                         | Verificação mais rápida                               | Correção                                                                    |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| Bot responde "foi para Marte"   | Verifique `appId` e `clientSecret` na configuração    | Defina as credenciais ou reinicie o Gateway.                                |
| Sem mensagens recebidas        | `openclaw channels status --probe`                    | Verifique as credenciais na QQ Open Platform.                               |
| Voz não transcrita             | Verifique a configuração do provedor de STT           | Configure `channels.qqbot.stt` ou `tools.media.audio`.                       |
| Mensagens proativas não chegam | Verifique os requisitos de interação da plataforma QQ | O QQ pode bloquear mensagens iniciadas pelo bot sem uma interação recente. |

Solução de problemas completa: [Solução de problemas do QQ Bot](/pt-BR/channels/qqbot#troubleshooting)

## Matrix

### Assinaturas de falha do Matrix

| Sintoma                                      | Verificação mais rápida                  | Correção                                                                                          |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Conectado, mas ignora mensagens da sala      | `openclaw channels status --probe`       | Verifique `groupPolicy`, a lista de permissões da sala e o bloqueio por menção.                   |
| As DMs não são processadas                   | `openclaw pairing list matrix`           | Aprove o remetente ou ajuste a política de DMs.                                                   |
| Salas criptografadas falham                  | `openclaw matrix verify status`          | Verifique novamente o dispositivo e depois confira `openclaw matrix verify backup status`.        |
| A restauração do backup está pendente/falhou | `openclaw matrix verify backup status`   | Execute `openclaw matrix verify backup restore` ou tente novamente com uma chave de recuperação.  |
| A assinatura cruzada/inicialização parece incorreta | `openclaw matrix verify bootstrap` | Corrija o armazenamento de segredos, a assinatura cruzada e o estado do backup de uma só vez.     |

Configuração completa: [Matrix](/pt-BR/channels/matrix)

## Relacionados

- [Emparelhamento](/pt-BR/channels/pairing)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
