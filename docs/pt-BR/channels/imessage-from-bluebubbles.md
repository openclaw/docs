---
read_when:
    - Planejando uma migração do BlueBubbles para o Plugin iMessage incluído
    - Traduzindo chaves de configuração do BlueBubbles para equivalentes do iMessage
    - Verificando o imsg antes de ativar o Plugin iMessage
summary: Migre as configurações antigas do BlueBubbles para o Plugin do iMessage incluído sem perder o pareamento, as listas de permissões ou os vínculos de grupo.
title: Vindo do BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

O Plugin `imessage` incluído agora alcança a mesma superfície de API privada do BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gerenciamento de grupos, anexos) acionando [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC. Se você já executa um Mac com `imsg` instalado, pode descartar o servidor BlueBubbles e permitir que o Plugin converse diretamente com o Messages.app.

O suporte ao BlueBubbles foi removido. O OpenClaw oferece suporte ao iMessage somente por meio do `imsg`. Este guia é para migrar configurações antigas de `channels.bluebubbles` para `channels.imessage`; não há outro caminho de migração compatível.

<Note>
Para o anúncio curto e o resumo para operadores, consulte [Remoção do BlueBubbles e o caminho de iMessage com imsg](/pt-BR/announcements/bluebubbles-imessage).
</Note>

## Lista de verificação de migração

Use esta lista de verificação quando você já conhece sua configuração antiga do BlueBubbles e quer o caminho seguro mais curto:

1. Verifique o `imsg` diretamente no Mac que executa o Messages.app (`imsg chats`, `imsg history`, `imsg send` e `imsg rpc --help`).
2. Copie as chaves de comportamento de `channels.bluebubbles` para `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` e `actions`.
3. Remova chaves de transporte que não existem mais: `serverUrl`, `password`, URLs de Webhook e configuração do servidor BlueBubbles.
4. Se o Gateway não estiver em execução no Mac do Messages, defina `channels.imessage.cliPath` como um wrapper SSH e defina `remoteHost` para buscas remotas de anexos.
5. Com o Gateway parado, habilite `channels.imessage` e execute `openclaw channels status --probe --channel imessage`.
6. Teste uma DM, um grupo permitido, anexos se habilitados e cada ação de API privada que você espera que o agente use.
7. Exclua o servidor BlueBubbles e a configuração antiga de `channels.bluebubbles` depois que o caminho de iMessage for verificado.

## Quando esta migração faz sentido

- Você já executa `imsg` no mesmo Mac (ou em um acessível por SSH) em que o Messages.app está conectado.
- Você quer um componente a menos em movimento — sem servidor BlueBubbles separado, sem endpoint REST para autenticar, sem encanamento de Webhook. Um único binário de CLI em vez de um servidor + aplicativo cliente + auxiliar.
- Você está em uma [versão compatível de macOS / `imsg`](/pt-BR/channels/imessage#requirements-and-permissions-macos) em que a sondagem da API privada informa `available: true`.

## O que o imsg faz

`imsg` é uma CLI local para macOS para o Messages. O OpenClaw inicia `imsg rpc` como um processo filho e conversa por JSON-RPC via stdin/stdout. Não há servidor HTTP, URL de Webhook, daemon em segundo plano, agente de inicialização nem porta a expor.

- As leituras vêm de `~/Library/Messages/chat.db` usando um identificador SQLite somente leitura.
- Mensagens de entrada ao vivo vêm de `imsg watch` / `watch.subscribe`, que acompanha eventos do sistema de arquivos de `chat.db` com um fallback de sondagem.
- Envios usam automação do Messages.app para envios normais de texto e arquivos.
- Ações avançadas usam `imsg launch` para injetar o auxiliar `imsg` no Messages.app. É isso que desbloqueia confirmações de leitura, indicadores de digitação, envios ricos, edição, cancelamento de envio, resposta em tópico, tapbacks e gerenciamento de grupos.
- Compilações Linux podem inspecionar um `chat.db` copiado, mas não podem enviar, observar o banco de dados ao vivo do Mac nem acionar o Messages.app. Para iMessage no OpenClaw, execute `imsg` no Mac conectado ou por meio de um wrapper SSH para esse Mac.

## Antes de começar

1. Instale o `imsg` no Mac que executa o Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Se `imsg chats` falhar com `unable to open database file`, saída vazia ou `authorization denied`, conceda Acesso Total ao Disco ao terminal, editor, processo Node, serviço Gateway ou processo pai SSH que inicia `imsg` e reabra esse processo pai.

2. Verifique as superfícies de leitura, observação, envio e RPC antes de alterar a configuração do OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Substitua `42` por um ID de conversa real de `imsg chats`. O envio exige permissão de Automação para o Messages.app. Se o OpenClaw for executado por SSH, execute esses comandos pelo mesmo wrapper SSH ou contexto de usuário que o OpenClaw usará.

3. Habilite a ponte de API privada quando precisar de ações avançadas:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` exige que o SIP esteja desabilitado. Envio básico, histórico e observação funcionam sem `imsg launch`; ações avançadas não.

4. Depois de adicionar uma configuração habilitada de `channels.imessage`, verifique a ponte pelo OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Você quer `imessage.privateApi.available: true`. Se ela informar `false`, corrija isso primeiro — consulte [Detecção de capacidade](/pt-BR/channels/imessage#private-api-actions). `channels status --probe` sonda apenas contas configuradas e habilitadas.

5. Faça um snapshot da sua configuração:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Tradução de configuração

iMessage e BlueBubbles compartilham muitas configurações em nível de canal. As chaves que mudam são principalmente de transporte (servidor REST vs CLI local). Chaves de comportamento (`dmPolicy`, `groupPolicy`, `allowFrom` etc.) mantêm o mesmo significado.

| BlueBubbles                                                | iMessage integrado                        | Notas                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Mesma semântica.                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.serverUrl`                           | _(removido)_                              | Nenhum servidor REST — o Plugin inicia `imsg rpc` por stdio.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(removido)_                              | Nenhuma autenticação de Webhook necessária.                                                                                                                                                                                                                                                                                                  |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Caminho para `imsg` (padrão `imsg`); use um script wrapper para SSH.                                                                                                                                                                                                                                                                         |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Substituição opcional do `chat.db` do Messages.app; detectado automaticamente quando omitido.                                                                                                                                                                                                                                                |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` — necessário somente quando `cliPath` é um wrapper de SSH e você quer buscas de anexos por SCP.                                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mesmos valores (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Aprovações de pareamento são transferidas por identificador, não por token.                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mesmos valores (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual.                                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copie isto literalmente, incluindo qualquer entrada curinga `groups: { "*": { ... } }`.** `requireMention`, `tools`, `toolsBySender` por grupo são transferidos. Com `groupPolicy: "allowlist"`, um bloco `groups` vazio ou ausente descarta silenciosamente toda mensagem de grupo — veja "Armadilha do registro de grupos" abaixo.       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Padrão `true`. Com o Plugin integrado, isso só dispara quando a sondagem da API privada está ativa.                                                                                                                                                                                                                                          |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Mesmo formato, **também desativado por padrão**. Se você tinha anexos fluindo no BlueBubbles, precisa redefinir isto explicitamente no bloco do iMessage — ele não é transferido implicitamente, e fotos/mídia recebidas serão descartadas silenciosamente sem linha de log `Inbound message` até você fazer isso.                            |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raízes locais; mesmas regras de curinga.                                                                                                                                                                                                                                                                                                     |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Usado somente quando `remoteHost` está definido para buscas por SCP.                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Padrão de 16 MB no iMessage (o padrão do BlueBubbles era 8 MB). Defina explicitamente se quiser manter o limite menor.                                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Padrão 4000 em ambos.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Mesma opção de adesão. Somente DMs — chats em grupo mantêm despacho instantâneo por mensagem em ambos os canais. Amplia o debounce de entrada padrão para 2500 ms quando ativado sem um `messages.inbound.byChannel.imessage` explícito. Veja [documentação do iMessage § Coalescência de DMs de envio dividido](/pt-BR/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | O iMessage já lê nomes de exibição dos remetentes a partir de `chat.db`.                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Alternâncias por ação: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                       |

Configurações de várias contas (`channels.bluebubbles.accounts.*`) são traduzidas uma a uma para `channels.imessage.accounts.*`.

## Armadilha do registro de grupos

O Plugin iMessage integrado executa **duas** portas separadas de lista de permissões de grupo em sequência. Ambas precisam passar para uma mensagem de grupo chegar ao agente:

1. **Lista de permissões de remetente / destino do chat** (`channels.imessage.groupAllowFrom`) — verificada por `isAllowedIMessageSender`. Corresponde mensagens recebidas por identificador do remetente, `chat_guid`, `chat_identifier` ou `chat_id`. Mesmo formato que o BlueBubbles.
2. **Registro de grupos** (`channels.imessage.groups`) — verificado por `resolveChannelGroupPolicy` de `inbound-processing.ts:199`. Com `groupPolicy: "allowlist"`, esta porta exige:
   - uma entrada curinga `groups: { "*": { ... } }` (define `allowAll = true`), ou
   - uma entrada explícita por `chat_id` em `groups`.

Se a porta 1 passar, mas a porta 2 falhar, a mensagem será descartada. O Plugin emite dois sinais de nível `warn`, então isso não é mais silencioso no nível de log padrão:

- Um `warn` de inicialização único por conta quando `groupPolicy: "allowlist"` está definido, mas `channels.imessage.groups` está vazio (sem curinga `"*"`, sem entradas por `chat_id`) — disparado antes de qualquer mensagem chegar.
- Um `warn` único por `chat_id` na primeira vez que um grupo específico é descartado em tempo de execução, nomeando o chat_id e a chave exata a adicionar a `groups` para permiti-lo.

DMs continuam funcionando porque seguem um caminho de código diferente.

Este é o modo de falha mais comum na migração do BlueBubbles para o iMessage integrado: operadores copiam `groupAllowFrom` e `groupPolicy`, mas pulam o bloco `groups`, porque `groups: { "*": { "requireMention": true } }` do BlueBubbles parece uma configuração de menção não relacionada. Na verdade, ele é essencial para a porta do registro.

A configuração mínima para manter mensagens de grupo fluindo após `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` em `*` é inofensivo quando nenhum padrão de menção está configurado: o runtime define `canDetectMention = false` e interrompe antecipadamente a queda por menção em `inbound-processing.ts:512`. Com padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`), funciona conforme esperado.

Se os logs do Gateway mostrarem `imessage: dropping group message from chat_id=<id>` ou a linha de inicialização `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, o portão 2 está descartando — adicione o bloco `groups`.

## Passo a passo

1. Adicione um bloco iMessage junto ao bloco BlueBubbles existente. Mantenha-o desabilitado enquanto o Gateway ainda estiver roteando tráfego do BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Teste antes que o tráfego importe** — pare o Gateway, habilite temporariamente o bloco iMessage e confirme que o iMessage aparece como saudável pela CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` testa apenas contas configuradas e habilitadas. Não reinicie o Gateway com BlueBubbles e iMessage habilitados ao mesmo tempo, a menos que você queira intencionalmente que ambos os monitores de canal estejam em execução. Se você não for fazer a transição imediatamente, defina `channels.imessage.enabled` de volta como `false` antes de reiniciar o Gateway. Use os comandos diretos `imsg` em [Antes de começar](#before-you-start) para validar o Mac antes de habilitar tráfego do OpenClaw.

3. **Faça a transição.** Depois que a conta iMessage habilitada reportar estado saudável, remova a configuração do BlueBubbles e mantenha o iMessage habilitado:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Reinicie o gateway. O tráfego de entrada do iMessage agora flui pelo Plugin incluído.

4. **Verifique DMs.** Envie uma mensagem direta ao agente; confirme que a resposta chega.

5. **Verifique grupos separadamente.** DMs e grupos usam caminhos de código diferentes — sucesso em DM não prova que grupos estão sendo roteados. Envie uma mensagem ao agente em um chat em grupo pareado e confirme que a resposta chega. Se o grupo ficar silencioso (sem resposta do agente, sem erro), verifique o log do gateway por `imessage: dropping group message from chat_id=<id>` ou pela linha de inicialização `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — ambas aparecem no nível de log padrão. Se qualquer uma aparecer, seu bloco `groups` está ausente ou vazio — veja "Armadilha do registro de grupos" acima.

6. **Verifique a superfície de ações** — a partir de uma DM pareada, peça ao agente para reagir, editar, desfazer envio, responder, enviar uma foto e (em um grupo) renomear o grupo / adicionar ou remover um participante. Cada ação deve aparecer de forma nativa no Messages.app. Se alguma lançar "iMessage `<action>` requires the imsg private API bridge", execute `imsg launch` novamente e atualize `channels status --probe`.

7. **Remova o servidor e a configuração do BlueBubbles** depois que DMs, grupos e ações do iMessage forem verificados. O OpenClaw não usará `channels.bluebubbles`.

## Paridade de ações em resumo

| Ação                                                       | BlueBubbles legado                  | iMessage incluído                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Enviar texto / fallback para SMS                           | ✅                                  | ✅                                                                                                                      |
| Enviar mídia (foto, vídeo, arquivo, voz)                   | ✅                                  | ✅                                                                                                                      |
| Resposta em thread (`reply_to_guid`)                       | ✅                                  | ✅ (fecha [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                  |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Editar / desfazer envio (destinatários no macOS 13+)       | ✅                                  | ✅                                                                                                                      |
| Enviar com efeito de tela                                  | ✅                                  | ✅ (fecha parte de [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| Rich text em negrito / itálico / sublinhado / tachado      | ✅                                  | ✅ (formatação de sequências tipadas via attributedBody)                                                                |
| Renomear grupo / definir ícone do grupo                    | ✅                                  | ✅                                                                                                                      |
| Adicionar / remover participante, sair do grupo            | ✅                                  | ✅                                                                                                                      |
| Recibos de leitura e indicador de digitação                | ✅                                  | ✅ (controlado pelo teste da API privada)                                                                               |
| Coalescimento de DMs do mesmo remetente                    | ✅                                  | ✅ (apenas DM; opt-in via `channels.imessage.coalesceSameSenderDms`)                                                    |
| Catchup de mensagens de entrada recebidas enquanto o gateway está fora | ✅ (replay de Webhook + busca de histórico) | ✅ (opt-in via `channels.imessage.catchup.enabled`; fecha [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

O catchup do iMessage agora está disponível como recurso opt-in no Plugin incluído. Na inicialização do gateway, se `channels.imessage.catchup.enabled` for `true`, o gateway executa uma passagem de `chats.list` + `messages.history` por chat contra o mesmo cliente JSON-RPC usado por `imsg watch`, reproduz cada linha de entrada perdida pelo caminho de despacho ao vivo (allowlists, política de grupo, debouncer, cache de eco) e persiste um cursor por conta para que inicializações subsequentes continuem de onde pararam. Veja [Recuperação após indisponibilidade do gateway](/pt-BR/channels/imessage#catching-up-after-gateway-downtime) para ajustes.

## Pareamento, sessões e associações ACP

- **Aprovações de pareamento** são mantidas por identificador. Você não precisa aprovar novamente remetentes conhecidos — `channels.imessage.allowFrom` reconhece as mesmas strings `+15555550123` / `user@example.com` que o BlueBubbles usava.
- **Sessões** permanecem escopadas por agente + chat. DMs são consolidadas na sessão principal do agente com o padrão `session.dmScope=main`; sessões de grupo permanecem isoladas por `chat_id`. As chaves de sessão diferem (`agent:<id>:imessage:group:<chat_id>` versus o equivalente do BlueBubbles) — o histórico de conversas antigo sob chaves de sessão do BlueBubbles não é transferido para sessões do iMessage.
- **Associações ACP** que referenciam `match.channel: "bluebubbles"` precisam ser atualizadas para `"imessage"`. Os formatos de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador simples) são idênticos.

## Sem canal de rollback

Não há runtime BlueBubbles com suporte para voltar. Se a verificação do iMessage falhar, defina `channels.imessage.enabled: false`, reinicie o Gateway, corrija o bloqueador do `imsg` e tente a transição novamente.

O cache de respostas fica em `~/.openclaw/state/imessage/reply-cache.jsonl` (modo `0600`, diretório pai `0700`). É seguro excluí-lo se você quiser recomeçar do zero.

## Relacionados

- [Remoção do BlueBubbles e o caminho iMessage via imsg](/pt-BR/announcements/bluebubbles-imessage) — anúncio curto e resumo para operadores.
- [iMessage](/pt-BR/channels/imessage) — referência completa do canal iMessage, incluindo configuração de `imsg launch` e detecção de capacidades.
- `/channels/bluebubbles` — URL legada que redireciona para este guia de migração.
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento.
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como o gateway escolhe um canal para respostas de saída.
