---
read_when:
    - Planejando uma migração do BlueBubbles para o Plugin iMessage incluído
    - Traduzindo chaves de configuração do BlueBubbles para equivalentes do iMessage
    - Verificando o imsg antes de habilitar o plugin do iMessage
summary: Migre configurações antigas do BlueBubbles para o Plugin iMessage incluído sem perder o pareamento, as listas de permissões ou as vinculações de grupos.
title: Migrando do BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

O Plugin `imessage` incluído agora alcança a mesma superfície de API privada que o BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gerenciamento de grupos, anexos) acionando [`steipete/imsg`](https://github.com/steipete/imsg) por JSON-RPC. Se você já executa um Mac com `imsg` instalado, pode dispensar o servidor BlueBubbles e deixar o Plugin falar diretamente com o Messages.app.

O suporte ao BlueBubbles foi removido. O OpenClaw oferece suporte ao iMessage somente por meio do `imsg`. Este guia é para migrar configurações antigas de `channels.bluebubbles` para `channels.imessage`; não há outro caminho de migração compatível.

## Quando esta migração faz sentido

- Você já executa o `imsg` no mesmo Mac (ou em um acessível por SSH) onde o Messages.app está conectado.
- Você quer um componente a menos — sem servidor BlueBubbles separado, sem endpoint REST para autenticar, sem encanamento de Webhook. Um único binário CLI em vez de um servidor + aplicativo cliente + auxiliar.
- Você está em uma [versão compatível do macOS / `imsg`](/pt-BR/channels/imessage#requirements-and-permissions-macos) em que a sondagem da API privada relata `available: true`.

## O que o imsg faz

`imsg` é uma CLI local para macOS voltada ao Messages. O OpenClaw inicia `imsg rpc` como um processo filho e se comunica por JSON-RPC via stdin/stdout. Não há servidor HTTP, URL de Webhook, daemon em segundo plano, launch agent ou porta a expor.

- As leituras vêm de `~/Library/Messages/chat.db` usando um handle SQLite somente leitura.
- Mensagens recebidas ao vivo vêm de `imsg watch` / `watch.subscribe`, que acompanha eventos do sistema de arquivos de `chat.db` com uma alternativa por polling.
- Os envios usam a automação do Messages.app para texto normal e envios de arquivos.
- Ações avançadas usam `imsg launch` para injetar o auxiliar `imsg` no Messages.app. É isso que desbloqueia confirmações de leitura, indicadores de digitação, envios ricos, edição, cancelamento de envio, resposta em thread, tapbacks e gerenciamento de grupos.
- Builds Linux podem inspecionar um `chat.db` copiado, mas não podem enviar, observar o banco de dados ativo do Mac nem controlar o Messages.app. Para iMessage no OpenClaw, execute `imsg` no Mac conectado ou por meio de um wrapper SSH para esse Mac.

## Antes de começar

1. Instale `imsg` no Mac que executa o Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Se `imsg chats` falhar com `unable to open database file`, saída vazia ou `authorization denied`, conceda Acesso Total ao Disco ao terminal, editor, processo Node, serviço Gateway ou processo pai SSH que inicia `imsg`; em seguida, reabra esse processo pai.

2. Verifique as superfícies de leitura, observação, envio e RPC antes de alterar a configuração do OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Substitua `42` por um ID de chat real obtido em `imsg chats`. Enviar exige permissão de Automação para o Messages.app. Se o OpenClaw for executado por SSH, execute estes comandos pelo mesmo wrapper SSH ou contexto de usuário que o OpenClaw usará.

3. Habilite a ponte de API privada quando precisar de ações avançadas:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` exige que o SIP esteja desativado. Envio básico, histórico e observação funcionam sem `imsg launch`; ações avançadas não.

4. Verifique a ponte pelo OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Você deve obter `imessage.privateApi.available: true`. Se relatar `false`, corrija isso primeiro — consulte [Detecção de capacidade](/pt-BR/channels/imessage#private-api-actions).

5. Faça um snapshot da sua configuração:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Tradução da configuração

iMessage e BlueBubbles compartilham boa parte da configuração em nível de canal. As chaves que mudam são principalmente de transporte (servidor REST vs CLI local). Chaves de comportamento (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) mantêm o mesmo significado.

| BlueBubbles                                                | iMessage incluído                         | Observações                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Mesma semântica.                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.serverUrl`                           | _(removido)_                              | Sem servidor REST — o plugin inicia `imsg rpc` via stdio.                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(removido)_                              | Nenhuma autenticação de webhook necessária.                                                                                                                                                                                                                                                                                                  |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Caminho para `imsg` (padrão `imsg`); use um script wrapper para SSH.                                                                                                                                                                                                                                                                         |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Substituição opcional de `chat.db` do Messages.app; detectada automaticamente quando omitida.                                                                                                                                                                                                                                                |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` — necessário somente quando `cliPath` é um wrapper de SSH e você quer buscas de anexos via SCP.                                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mesmos valores (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Aprovações de pareamento são transferidas por identificador, não por token.                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mesmos valores (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual.                                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copie isto literalmente, incluindo qualquer entrada curinga `groups: { "*": { ... } }`.** `requireMention`, `tools`, `toolsBySender` por grupo são transferidos. Com `groupPolicy: "allowlist"`, um bloco `groups` vazio ou ausente descarta silenciosamente todas as mensagens de grupo — veja "Armadilha do registro de grupos" abaixo. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Padrão `true`. Com o plugin incluído, isso só é acionado quando a sondagem da API privada está ativa.                                                                                                                                                                                                                                        |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Mesmo formato, **também desativado por padrão**. Se você tinha anexos fluindo no BlueBubbles, precisa redefinir isso explicitamente no bloco do iMessage — isso não é transferido implicitamente, e fotos/mídia de entrada serão descartadas silenciosamente sem linha de log `Inbound message` até você fazer isso.                         |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raízes locais; mesmas regras de curinga.                                                                                                                                                                                                                                                                                                     |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Usado somente quando `remoteHost` está definido para buscas via SCP.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Padrão de 16 MB no iMessage (o padrão do BlueBubbles era 8 MB). Defina explicitamente se quiser manter o limite menor.                                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Padrão 4000 em ambos.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Mesma opção de adesão. Apenas DMs — conversas em grupo mantêm o envio instantâneo por mensagem em ambos os canais. Aumenta o debounce de entrada padrão para 2500 ms quando ativado sem um `messages.inbound.byChannel.imessage` explícito. Veja [docs do iMessage § Mesclar DMs de envio dividido](/pt-BR/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | O iMessage já lê os nomes de exibição dos remetentes a partir de `chat.db`.                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Alternâncias por ação: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                       |

Configurações de várias contas (`channels.bluebubbles.accounts.*`) são traduzidas um para um para `channels.imessage.accounts.*`.

## Armadilha do registro de grupos

O plugin iMessage incluído executa **dois** gates separados de lista de permissões de grupos em sequência. Ambos precisam passar para que uma mensagem de grupo chegue ao agente:

1. **Lista de permissões de remetente / destino de chat** (`channels.imessage.groupAllowFrom`) — verificada por `isAllowedIMessageSender`. Corresponde mensagens de entrada pelo identificador do remetente, `chat_guid`, `chat_identifier` ou `chat_id`. Mesmo formato do BlueBubbles.
2. **Registro de grupos** (`channels.imessage.groups`) — verificado por `resolveChannelGroupPolicy` de `inbound-processing.ts:199`. Com `groupPolicy: "allowlist"`, este gate exige:
   - uma entrada curinga `groups: { "*": { ... } }` (define `allowAll = true`), ou
   - uma entrada explícita por `chat_id` em `groups`.

Se o gate 1 passar, mas o gate 2 falhar, a mensagem é descartada. O plugin emite dois sinais em nível `warn`, então isso não fica mais silencioso no nível de log padrão:

- Um `warn` único na inicialização por conta quando `groupPolicy: "allowlist"` está definido, mas `channels.imessage.groups` está vazio (sem curinga `"*"`, sem entradas por `chat_id`) — disparado antes de qualquer mensagem chegar.
- Um `warn` único por `chat_id` na primeira vez que um grupo específico é descartado em tempo de execução, nomeando o chat_id e a chave exata a adicionar a `groups` para permiti-lo.

DMs continuam funcionando porque usam um caminho de código diferente.

Este é o modo de falha mais comum na migração BlueBubbles → iMessage incluído: operadores copiam `groupAllowFrom` e `groupPolicy`, mas pulam o bloco `groups`, porque `groups: { "*": { "requireMention": true } }` do BlueBubbles parece uma configuração de menção não relacionada. Na verdade, ele é essencial para o gate do registro.

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

`requireMention: true` em `*` é inofensivo quando nenhum padrão de menção está configurado: o runtime define `canDetectMention = false` e interrompe a remoção por menção em `inbound-processing.ts:512`. Com padrões de menção configurados (`agents.list[].groupChat.mentionPatterns`), funciona conforme esperado.

Se os logs do gateway mostrarem `imessage: dropping group message from chat_id=<id>` ou a linha de inicialização `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, a barreira 2 está bloqueando — adicione o bloco `groups`.

## Passo a passo

1. Adicione um bloco iMessage junto ao bloco BlueBubbles existente. Mantenha o bloco antigo apenas como fonte de cópia até que o novo caminho seja verificado:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Sondagem de simulação** — inicie o gateway e confirme que o iMessage relata estado saudável:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Como `imessage.enabled` ainda é `false`, nenhum tráfego de entrada do iMessage é roteado ainda — mas `--probe` exercita a ponte para que você detecte problemas de permissão/instalação antes da migração.

3. **Migre.** Remova a configuração do BlueBubbles e habilite o iMessage em uma única edição de configuração:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Reinicie o gateway. O tráfego de entrada do iMessage agora passa pelo Plugin incluído.

4. **Verifique DMs.** Envie uma mensagem direta ao agente; confirme que a resposta chega.

5. **Verifique grupos separadamente.** DMs e grupos usam caminhos de código diferentes — o sucesso de DM não prova que grupos estão sendo roteados. Envie uma mensagem ao agente em um chat em grupo pareado e confirme que a resposta chega. Se o grupo ficar silencioso (sem resposta do agente, sem erro), verifique o log do gateway por `imessage: dropping group message from chat_id=<id>` ou pela linha de inicialização `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — ambas disparam no nível de log padrão. Se uma delas aparecer, seu bloco `groups` está ausente ou vazio — veja "armadilha do registro de grupos" acima.

6. **Verifique a superfície de ações** — a partir de uma DM pareada, peça ao agente para reagir, editar, desfazer envio, responder, enviar uma foto e (em um grupo) renomear o grupo / adicionar ou remover um participante. Cada ação deve aparecer nativamente no Messages.app. Se alguma lançar "iMessage `<action>` requires the imsg private API bridge", execute `imsg launch` novamente e atualize `channels status --probe`.

7. **Remova o servidor e a configuração do BlueBubbles** depois que DMs, grupos e ações do iMessage forem verificados. O OpenClaw não usará `channels.bluebubbles`.

## Paridade de ações em resumo

| Ação                                                       | BlueBubbles legado                  | iMessage incluído                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Enviar texto / fallback para SMS                           | ✅                                  | ✅                                                                                                                      |
| Enviar mídia (foto, vídeo, arquivo, voz)                   | ✅                                  | ✅                                                                                                                      |
| Resposta encadeada (`reply_to_guid`)                       | ✅                                  | ✅ (fecha [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                  |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Editar / desfazer envio (destinatários no macOS 13+)       | ✅                                  | ✅                                                                                                                      |
| Enviar com efeito de tela                                  | ✅                                  | ✅ (fecha parte de [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| Texto rico em negrito / itálico / sublinhado / tachado     | ✅                                  | ✅ (formatação de execuções tipadas via attributedBody)                                                                 |
| Renomear grupo / definir ícone do grupo                    | ✅                                  | ✅                                                                                                                      |
| Adicionar / remover participante, sair do grupo            | ✅                                  | ✅                                                                                                                      |
| Confirmações de leitura e indicador de digitação           | ✅                                  | ✅ (controlado pela sondagem da API privada)                                                                            |
| Coalescência de DMs do mesmo remetente                     | ✅                                  | ✅ (somente DM; opcional via `channels.imessage.coalesceSameSenderDms`)                                                 |
| Recuperação de mensagens de entrada recebidas enquanto o gateway está inativo | ✅ (replay de webhook + busca de histórico) | ✅ (opcional via `channels.imessage.catchup.enabled`; fecha [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

A recuperação do iMessage agora está disponível como recurso opcional no Plugin incluído. Na inicialização do gateway, se `channels.imessage.catchup.enabled` for `true`, o gateway executa uma passagem de `chats.list` + `messages.history` por chat contra o mesmo cliente JSON-RPC usado por `imsg watch`, reproduz cada linha de entrada perdida pelo caminho de despacho ativo (listas de permissão, política de grupo, debouncer, cache de eco) e persiste um cursor por conta para que inicializações subsequentes continuem de onde pararam. Veja [Recuperação após tempo de inatividade do gateway](/pt-BR/channels/imessage#catching-up-after-gateway-downtime) para ajuste.

## Pareamento, sessões e associações ACP

- **Aprovações de pareamento** são transferidas por identificador. Você não precisa aprovar remetentes conhecidos novamente — `channels.imessage.allowFrom` reconhece as mesmas strings `+15555550123` / `user@example.com` usadas pelo BlueBubbles.
- **Sessões** continuam com escopo por agente + chat. DMs convergem para a sessão principal do agente com o padrão `session.dmScope=main`; sessões de grupo permanecem isoladas por `chat_id`. As chaves de sessão diferem (`agent:<id>:imessage:group:<chat_id>` versus o equivalente do BlueBubbles) — o histórico de conversas antigo nas chaves de sessão do BlueBubbles não é levado para sessões do iMessage.
- **Associações ACP** que referenciam `match.channel: "bluebubbles"` precisam ser atualizadas para `"imessage"`. Os formatos de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador sem prefixo) são idênticos.

## Sem canal de rollback

Não há runtime BlueBubbles compatível para voltar. Se a verificação do iMessage falhar, defina `channels.imessage.enabled: false`, reinicie o Gateway, corrija o bloqueador do `imsg` e tente a migração novamente.

O cache de respostas fica em `~/.openclaw/state/imessage/reply-cache.jsonl` (modo `0600`, diretório pai `0700`). É seguro excluí-lo se você quiser começar do zero.

## Relacionados

- [iMessage](/pt-BR/channels/imessage) — referência completa do canal iMessage, incluindo configuração de `imsg launch` e detecção de capacidades.
- `/channels/bluebubbles` — URL legada que redireciona para este guia de migração.
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento.
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como o gateway escolhe um canal para respostas de saída.
