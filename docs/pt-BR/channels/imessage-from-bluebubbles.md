---
read_when:
    - Planejando a migração do BlueBubbles para o plugin iMessage incluído
    - Traduzindo chaves de configuração do BlueBubbles para equivalentes do iMessage
    - Verificando o imsg antes de habilitar o Plugin iMessage
summary: Migre configurações antigas do BlueBubbles para o Plugin iMessage integrado sem perder emparelhamento, listas de permissões ou vinculações de grupos.
title: Vindo do BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

O Plugin `imessage` incluído agora alcança a mesma superfície de API privada do BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gerenciamento de grupos, anexos) ao operar [`steipete/imsg`](https://github.com/steipete/imsg) sobre JSON-RPC. Se você já executa um Mac com `imsg` instalado, pode descartar o servidor BlueBubbles e deixar o Plugin falar diretamente com o Messages.app.

O suporte ao BlueBubbles foi removido. O OpenClaw oferece suporte ao iMessage somente por meio do `imsg`. Este guia é para migrar configurações antigas de `channels.bluebubbles` para `channels.imessage`; não há outro caminho de migração compatível.

<Note>
Para o anúncio curto e o resumo para operadores, consulte [Remoção do BlueBubbles e o caminho imsg para iMessage](/pt-BR/announcements/bluebubbles-imessage).
</Note>

## Lista de verificação de migração

Use esta lista de verificação quando você já conhece sua configuração antiga do BlueBubbles e quer o caminho seguro mais curto:

1. Verifique o `imsg` diretamente no Mac que executa o Messages.app (`imsg chats`, `imsg history`, `imsg send` e `imsg rpc --help`).
2. Copie as chaves de comportamento de `channels.bluebubbles` para `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` e `actions`.
3. Remova as chaves de transporte que não existem mais: `serverUrl`, `password`, URLs de Webhook e a configuração do servidor BlueBubbles.
4. Se o Gateway não estiver em execução no Mac do Messages, defina `channels.imessage.cliPath` para um wrapper SSH e defina `remoteHost` para buscas remotas de anexos.
5. Com o Gateway parado, habilite `channels.imessage` e execute `openclaw channels status --probe --channel imessage`.
6. Teste uma DM, um grupo permitido, anexos se estiverem habilitados e cada ação de API privada que você espera que o agente use.
7. Exclua o servidor BlueBubbles e a configuração antiga de `channels.bluebubbles` depois que o caminho do iMessage for verificado.

## Quando esta migração faz sentido

- Você já executa o `imsg` no mesmo Mac (ou em um acessível por SSH) onde o Messages.app está conectado.
- Você quer uma parte móvel a menos — sem servidor BlueBubbles separado, sem endpoint REST para autenticar, sem encanamento de Webhook. Um único binário de CLI em vez de servidor + aplicativo cliente + auxiliar.
- Você está em uma [compilação compatível de macOS / `imsg`](/pt-BR/channels/imessage#requirements-and-permissions-macos) em que a sondagem de API privada relata `available: true`.

## O que o imsg faz

`imsg` é uma CLI local do macOS para Messages. O OpenClaw inicia `imsg rpc` como um processo filho e fala JSON-RPC sobre stdin/stdout. Não há servidor HTTP, URL de Webhook, daemon em segundo plano, agente de inicialização ou porta para expor.

- Leituras vêm de `~/Library/Messages/chat.db` usando um identificador SQLite somente leitura.
- Mensagens recebidas ao vivo vêm de `imsg watch` / `watch.subscribe`, que acompanha eventos do sistema de arquivos de `chat.db` com fallback de polling.
- Envios usam a automação do Messages.app para texto normal e envios de arquivos.
- Ações avançadas usam `imsg launch` para injetar o auxiliar `imsg` no Messages.app. É isso que desbloqueia confirmações de leitura, indicadores de digitação, envios ricos, edição, cancelamento de envio, resposta encadeada, tapbacks e gerenciamento de grupos.
- Compilações Linux podem inspecionar um `chat.db` copiado, mas não podem enviar, observar o banco de dados ativo do Mac nem operar o Messages.app. Para o iMessage no OpenClaw, execute `imsg` no Mac conectado ou por meio de um wrapper SSH para esse Mac.

## Antes de começar

1. Instale o `imsg` no Mac que executa o Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Se `imsg chats` falhar com `unable to open database file`, saída vazia ou `authorization denied`, conceda Acesso Total ao Disco ao terminal, editor, processo Node, serviço Gateway ou processo pai SSH que inicia `imsg` e então reabra esse processo pai.

2. Verifique as superfícies de leitura, observação, envio e RPC antes de alterar a configuração do OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Substitua `42` por um ID de conversa real de `imsg chats`. Enviar exige permissão de Automação para o Messages.app. Se o OpenClaw for executado por SSH, execute estes comandos pelo mesmo wrapper SSH ou contexto de usuário que o OpenClaw usará. Se leituras/sondagens funcionarem, mas envios falharem com AppleEvents `-1743`, verifique se a Automação foi parar em `/usr/libexec/sshd-keygen-wrapper`; consulte [Envios por wrapper SSH falham com AppleEvents -1743](/pt-BR/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Habilite a ponte de API privada quando precisar de ações avançadas:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` exige que o SIP esteja desabilitado. Envio básico, histórico e observação funcionam sem `imsg launch`; ações avançadas não.

4. Depois de adicionar uma configuração `channels.imessage` habilitada, verifique a ponte pelo OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Você quer `imessage.privateApi.available: true`. Se relatar `false`, corrija isso primeiro — consulte [Detecção de capacidades](/pt-BR/channels/imessage#private-api-actions). `channels status --probe` sonda apenas contas configuradas e habilitadas.

5. Faça um snapshot da sua configuração:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Tradução de configuração

iMessage e BlueBubbles compartilham muita configuração em nível de canal. As chaves que mudam são principalmente de transporte (servidor REST vs CLI local). Chaves de comportamento (`dmPolicy`, `groupPolicy`, `allowFrom` etc.) mantêm o mesmo significado.

| BlueBubbles                                                | iMessage incluído                         | Observações                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Mesma semântica.                                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(removido)_                              | Sem servidor REST — o Plugin inicia `imsg rpc` sobre stdio.                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.password`                            | _(removido)_                              | Nenhuma autenticação de webhook necessária.                                                                                                                                                                                                                                                                                                                                         |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Caminho para `imsg` (padrão `imsg`); use um script wrapper para SSH.                                                                                                                                                                                                                                                                                                                |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Substituição opcional do `chat.db` do Messages.app; detectado automaticamente quando omitido.                                                                                                                                                                                                                                                                                       |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` — necessário apenas quando `cliPath` é um wrapper SSH e você quer buscas de anexos por SCP.                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mesmos valores (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Aprovações de pareamento são transferidas por identificador, não por token.                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mesmos valores (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual.                                                                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copie isto literalmente, incluindo qualquer entrada curinga `groups: { "*": { ... } }`.** `requireMention`, `tools`, `toolsBySender` por grupo são transferidos. Com `groupPolicy: "allowlist"`, um bloco `groups` vazio ou ausente descarta silenciosamente todas as mensagens de grupo — veja "Armadilha do registro de grupos" abaixo.                                      |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Padrão `true`. Com o Plugin incluído, isso só dispara quando a sondagem da API privada está ativa.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Mesmo formato, **também desativado por padrão**. Se você tinha anexos fluindo no BlueBubbles, precisa definir isto explicitamente de novo no bloco do iMessage — ele não é transferido implicitamente, e fotos/mídia de entrada serão descartadas silenciosamente sem linha de log `Inbound message` até que você faça isso.                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raízes locais; mesmas regras de curinga.                                                                                                                                                                                                                                                                                                                                            |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Usado apenas quando `remoteHost` está definido para buscas por SCP.                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Padrão de 16 MB no iMessage (o padrão do BlueBubbles era 8 MB). Defina explicitamente se quiser manter o limite mais baixo.                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Padrão 4000 em ambos.                                                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Mesma opção de adesão. Somente DM — chats de grupo mantêm despacho instantâneo por mensagem nos dois canais. Amplia o debounce de entrada padrão para 7000 ms quando ativado sem um `messages.inbound.byChannel.imessage` explícito ou `messages.inbound.debounceMs` global. Veja [documentação do iMessage § Agrupando DMs de envio dividido](/pt-BR/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | O iMessage já lê os nomes de exibição dos remetentes de `chat.db`.                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Alternâncias por ação: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                              |

Configurações de múltiplas contas (`channels.bluebubbles.accounts.*`) são traduzidas uma a uma para `channels.imessage.accounts.*`.

## Armadilha do registro de grupos

O Plugin iMessage incluído executa **duas** portas de allowlist de grupo separadas em sequência. Ambas precisam passar para que uma mensagem de grupo chegue ao agente:

1. **Allowlist de remetente / destino do chat** (`channels.imessage.groupAllowFrom`) — verificada por `isAllowedIMessageSender`. Corresponde mensagens de entrada por identificador do remetente, `chat_guid`, `chat_identifier` ou `chat_id`. Mesmo formato do BlueBubbles.
2. **Registro de grupos** (`channels.imessage.groups`) — verificado por `resolveChannelGroupPolicy` de `inbound-processing.ts:199`. Com `groupPolicy: "allowlist"`, esta porta exige:
   - uma entrada curinga `groups: { "*": { ... } }` (define `allowAll = true`), ou
   - uma entrada explícita por `chat_id` em `groups`.

Se a porta 1 passar, mas a porta 2 falhar, a mensagem será descartada. O Plugin emite dois sinais de nível `warn`, então isso não fica mais silencioso no nível de log padrão:

- Um `warn` único na inicialização por conta quando `groupPolicy: "allowlist"` está definido, mas `channels.imessage.groups` está vazio (sem curinga `"*"`, sem entradas por `chat_id`) — disparado antes de qualquer mensagem chegar.
- Um `warn` único por `chat_id` na primeira vez que um grupo específico é descartado em tempo de execução, nomeando o chat_id e a chave exata a adicionar a `groups` para permiti-lo.

As mensagens diretas continuam funcionando porque seguem um caminho de código diferente.

Este é o modo de falha mais comum na migração BlueBubbles → iMessage integrado: operadores copiam `groupAllowFrom` e `groupPolicy`, mas pulam o bloco `groups`, porque `groups: { "*": { "requireMention": true } }` do BlueBubbles parece uma configuração de menção sem relação. Na verdade, ele é essencial para o gate do registro.

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

`requireMention: true` em `*` é inofensivo quando nenhum padrão de menção está configurado: o runtime define `canDetectMention = false` e interrompe antecipadamente o descarte por menção em `inbound-processing.ts:512`. Com padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`), ele funciona como esperado.

Se os logs do Gateway mostrarem `imessage: dropping group message from chat_id=<id>` ou a linha de inicialização `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, o gate 2 está descartando — adicione o bloco `groups`.

## Passo a passo

1. Adicione um bloco iMessage ao lado do bloco BlueBubbles existente. Mantenha-o desabilitado enquanto o Gateway ainda estiver roteando tráfego do BlueBubbles:

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

2. **Faça uma sondagem antes que o tráfego importe** — pare o Gateway, habilite temporariamente o bloco iMessage e confirme que o iMessage reporta integridade pela CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` sonda apenas contas configuradas e habilitadas. Não reinicie o Gateway com BlueBubbles e iMessage habilitados ao mesmo tempo, a menos que você queira intencionalmente os dois monitores de canal em execução. Se você não for fazer a transição imediatamente, defina `channels.imessage.enabled` de volta para `false` antes de reiniciar o Gateway. Use os comandos diretos de `imsg` em [Antes de começar](#before-you-start) para validar o Mac antes de habilitar tráfego do OpenClaw.

3. **Faça a transição.** Depois que a conta iMessage habilitada reportar integridade, remova a configuração do BlueBubbles e mantenha o iMessage habilitado:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Reinicie o Gateway. O tráfego iMessage de entrada agora flui pelo Plugin integrado.

4. **Verifique as mensagens diretas.** Envie uma mensagem direta ao agente; confirme que a resposta chega.

5. **Verifique grupos separadamente.** Mensagens diretas e grupos seguem caminhos de código diferentes — sucesso em mensagens diretas não prova que grupos estão sendo roteados. Envie uma mensagem ao agente em um chat de grupo pareado e confirme que a resposta chega. Se o grupo ficar silencioso (sem resposta do agente, sem erro), verifique o log do Gateway para `imessage: dropping group message from chat_id=<id>` ou a linha de inicialização `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — ambas aparecem no nível de log padrão. Se qualquer uma aparecer, seu bloco `groups` está ausente ou vazio — veja "armadilha do registro de grupos" acima.

6. **Verifique a superfície de ações** — a partir de uma mensagem direta pareada, peça ao agente para reagir, editar, desfazer envio, responder, enviar uma foto e (em um grupo) renomear o grupo / adicionar ou remover um participante. Cada ação deve chegar nativamente no Messages.app. Se alguma lançar "iMessage `<action>` requires the imsg private API bridge", execute `imsg launch` novamente e atualize `channels status --probe`.

7. **Remova o servidor e a configuração do BlueBubbles** depois que mensagens diretas, grupos e ações do iMessage forem verificados. O OpenClaw não usará `channels.bluebubbles`.

## Paridade de ações em resumo

| Ação                                                | BlueBubbles legado                  | iMessage integrado                                                            |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Enviar texto / fallback de SMS                      | ✅                                  | ✅                                                                            |
| Enviar mídia (foto, vídeo, arquivo, voz)            | ✅                                  | ✅                                                                            |
| Resposta em thread (`reply_to_guid`)                | ✅                                  | ✅ (fecha [#51892](https://github.com/openclaw/openclaw/issues/51892))        |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Editar / desfazer envio (destinatários macOS 13+)   | ✅                                  | ✅                                                                            |
| Enviar com efeito de tela                           | ✅                                  | ✅ (fecha parte de [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Texto rico em negrito / itálico / sublinhado / tachado | ✅                               | ✅ (formatação typed-run via attributedBody)                                  |
| Renomear grupo / definir ícone do grupo             | ✅                                  | ✅                                                                            |
| Adicionar / remover participante, sair do grupo     | ✅                                  | ✅                                                                            |
| Recibos de leitura e indicador de digitação         | ✅                                  | ✅ (condicionado à sondagem da API privada)                                   |
| Coalescência de mensagens diretas do mesmo remetente | ✅                                 | ✅ (somente mensagens diretas; opt-in via `channels.imessage.coalesceSameSenderDms`) |
| Recuperação de entrada após uma reinicialização     | ✅ (replay de Webhook + busca de histórico) | ✅ (automática: reproduz perdidas via since_rowid + desduplicação; janela mais ampla no local) |

O iMessage recupera mensagens perdidas enquanto o Gateway estava fora do ar: na inicialização, ele reproduz a partir do último rowid despachado via `since_rowid` de `imsg watch.subscribe` e desduplica por GUID, enquanto uma barreira de idade para backlog obsoleto suprime a "bomba de backlog" do Push-flush. Isso roda pela conexão RPC de `imsg`, portanto também funciona para configurações remotas de SSH `cliPath`; configurações locais recebem uma janela de recuperação mais ampla porque conseguem ler `chat.db`. Veja [Recuperação de entrada após a reinicialização de uma ponte ou do Gateway](/pt-BR/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Pareamento, sessões e vínculos ACP

- **Aprovações de pareamento** são mantidas por identificador. Você não precisa aprovar novamente remetentes conhecidos — `channels.imessage.allowFrom` reconhece as mesmas strings `+15555550123` / `user@example.com` que o BlueBubbles usava.
- **Sessões** permanecem escopadas por agente + chat. Mensagens diretas são consolidadas na sessão principal do agente sob o padrão `session.dmScope=main`; sessões de grupo permanecem isoladas por `chat_id`. As chaves de sessão diferem (`agent:<id>:imessage:group:<chat_id>` vs. o equivalente do BlueBubbles) — o histórico de conversas antigo nas chaves de sessão do BlueBubbles não é levado para sessões do iMessage.
- **Vínculos ACP** que referenciam `match.channel: "bluebubbles"` precisam ser atualizados para `"imessage"`. Os formatos de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador simples) são idênticos.

## Sem canal de rollback

Não há runtime BlueBubbles compatível para voltar a usar. Se a verificação do iMessage falhar, defina `channels.imessage.enabled: false`, reinicie o Gateway, corrija o bloqueador de `imsg` e tente a transição novamente.

O cache de respostas fica no estado SQLite do Plugin. `openclaw doctor --fix` importa e arquiva o sidecar antigo `imessage/reply-cache.jsonl` quando ele está presente.

## Relacionados

- [Remoção do BlueBubbles e o caminho iMessage por imsg](/pt-BR/announcements/bluebubbles-imessage) — anúncio curto e resumo para operadores.
- [iMessage](/pt-BR/channels/imessage) — referência completa do canal iMessage, incluindo configuração de `imsg launch` e detecção de capacidades.
- `/channels/bluebubbles` — URL legado que redireciona para este guia de migração.
- [Pareamento](/pt-BR/channels/pairing) — autenticação por mensagem direta e fluxo de pareamento.
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como o Gateway escolhe um canal para respostas de saída.
