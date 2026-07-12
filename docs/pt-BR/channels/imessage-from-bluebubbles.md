---
read_when:
    - Planejando a migração do BlueBubbles para o plugin iMessage incluído no pacote
    - Traduzindo chaves de configuração do BlueBubbles para equivalentes do iMessage
    - Verificando o imsg antes de ativar o plugin do iMessage
summary: 'Migre configurações antigas do BlueBubbles para o plugin integrado do iMessage: mapeamento de chaves, controles da lista de permissões de grupos e verificação da transição.'
title: Migrando do BlueBubbles
x-i18n:
    generated_at: "2026-07-12T14:53:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

O suporte ao BlueBubbles foi removido. O OpenClaw oferece suporte ao iMessage somente por meio do plugin `imessage` incluído, que controla o [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC e acessa a mesma superfície de API privada que o BlueBubbles acessava (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, enquetes nativas, gerenciamento de grupos, anexos). Um único binário da CLI substitui o servidor BlueBubbles + aplicativo cliente + infraestrutura de Webhook: sem endpoint REST, sem autenticação de Webhook.

Este guia migra configurações antigas de `channels.bluebubbles` para `channels.imessage`. Não há nenhum outro caminho de migração compatível. Na versão atual do OpenClaw, um bloco `channels.bluebubbles` remanescente fica inerte — nenhum runtime o lê.

<Note>
Para ver o anúncio resumido e o resumo para operadores, consulte [Remoção do BlueBubbles e o caminho do iMessage via imsg](/pt-BR/announcements/bluebubbles-imessage).
</Note>

## Lista de verificação da migração

O caminho seguro mais curto quando você já conhece sua configuração antiga do BlueBubbles:

1. Verifique o `imsg` diretamente no Mac que executa o Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Copie as chaves de comportamento de `channels.bluebubbles` para `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` e `actions`.
3. Remova as chaves de transporte que não existem mais: `serverUrl`, `password`, URLs de Webhook e a configuração do servidor BlueBubbles.
4. Se o Gateway não estiver em execução no Mac do Messages, defina `channels.imessage.cliPath` como um wrapper SSH e defina `remoteHost` para buscar anexos remotamente.
5. Habilite `channels.imessage`, reinicie o Gateway e execute `openclaw channels status --probe --channel imessage`.
6. Teste uma mensagem direta, um grupo permitido, anexos, se estiverem habilitados, e cada ação da API privada que você espera que o agente use.
7. Exclua o servidor BlueBubbles e a configuração antiga de `channels.bluebubbles` depois de verificar o caminho do iMessage.

## O que o imsg faz

O `imsg` é uma CLI local do macOS para o Messages. O OpenClaw inicia `imsg rpc` como um processo filho e se comunica por JSON-RPC via stdin/stdout. Não há servidor HTTP, URL de Webhook, daemon em segundo plano, agente de inicialização nem porta a ser exposta.

- As leituras vêm de `~/Library/Messages/chat.db` usando um identificador SQLite somente leitura.
- As mensagens recebidas em tempo real vêm de `imsg watch` / `watch.subscribe`, que acompanha os eventos do sistema de arquivos de `chat.db` com sondagem como alternativa.
- Os envios usam a automação do Messages.app para enviar textos e arquivos comuns.
- As ações avançadas usam `imsg launch` para injetar o auxiliar `imsg` no Messages.app. É isso que habilita confirmações de leitura, indicadores de digitação, envios avançados, edição, cancelamento de envio, resposta encadeada, tapbacks, enquetes e gerenciamento de grupos.
- As compilações para Linux podem inspecionar uma cópia de `chat.db`, mas não podem enviar, monitorar o banco de dados ativo do Mac nem controlar o Messages.app. Para usar o iMessage com o OpenClaw, execute o `imsg` no Mac com a sessão iniciada ou por meio de um wrapper SSH para esse Mac.

## Antes de começar

1. Instale o `imsg` no Mac que executa o Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Na configuração local habitual, a configuração do OpenClaw pode oferecer uma instalação ou atualização do `imsg` via Homebrew, confirmada pelo usuário, no Mac do Messages com a sessão iniciada. A configuração manual e as topologias com wrapper SSH continuam sob gerenciamento do operador: repita a atualização do Homebrew no mesmo contexto de usuário local ou remoto que executará o `imsg`. Se `imsg chats` falhar com `unable to open database file`, saída vazia ou `authorization denied`, conceda Acesso Total ao Disco ao terminal, editor, processo Node, serviço do Gateway ou processo SSH pai que inicia o `imsg` e reabra esse processo pai.

2. Verifique as superfícies de leitura, monitoramento, envio e RPC antes de alterar a configuração do OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "Teste do OpenClaw imsg"
   imsg rpc --help
   ```

   Substitua `42` por um ID de conversa real obtido em `imsg chats`. O envio requer permissão de Automação para o Messages.app. Se o OpenClaw for executado via SSH, execute esses comandos por meio do mesmo wrapper SSH ou contexto de usuário que o OpenClaw usará. Se as leituras funcionarem, mas os envios falharem com AppleEvents `-1743`, verifique se a permissão de Automação foi atribuída a `/usr/libexec/sshd-keygen-wrapper`; consulte [Falha nos envios do wrapper SSH com AppleEvents -1743](/pt-BR/channels/imessage#requirements-and-permissions-macos).

3. Habilite a ponte da API privada. Isso é altamente recomendado para o iMessage no OpenClaw porque respostas, tapbacks, efeitos, enquetes, respostas a anexos e ações de grupo dependem dela:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` exige que o SIP esteja desabilitado (e, no macOS moderno, que a validação de bibliotecas esteja flexibilizada — consulte [Como habilitar a API privada do imsg](/pt-BR/channels/imessage#enabling-the-imsg-private-api)). O envio básico, o histórico e o monitoramento funcionam sem `imsg launch`; a superfície completa de ações do iMessage no OpenClaw não.

4. Depois de habilitar `channels.imessage` e iniciar o Gateway, verifique a ponte por meio do OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   A conta do iMessage deve informar `works`; com `--json`, a carga útil da sondagem inclui `privateApi.available: true`. Se ela informar `false`, corrija isso primeiro — consulte [Detecção de recursos](/pt-BR/channels/imessage#private-api-actions). A sondagem exige um Gateway acessível (caso contrário, a CLI retorna apenas a saída baseada na configuração) e verifica somente contas configuradas e habilitadas.

5. Crie uma cópia de segurança da sua configuração:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Tradução da configuração

O iMessage e o BlueBubbles compartilham a maioria das chaves de comportamento no nível do canal. O que muda é o transporte (servidor REST em comparação com a CLI local) e o formato da chave do registro de grupos.

| BlueBubbles                                                | iMessage incluído                         | Observações                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Mesma semântica (padrão `true` depois que o bloco existe).                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.serverUrl`                           | _(removido)_                              | Sem servidor REST — o plugin inicia `imsg rpc` por stdio.                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(removido)_                              | Não é necessária autenticação de webhook.                                                                                                                                                                                                                                                                             |
| _(implícito)_                                              | `channels.imessage.cliPath`               | Caminho para `imsg` (padrão `imsg`); use um script wrapper para SSH.                                                                                                                                                                                                                                                  |
| _(implícito)_                                              | `channels.imessage.dbPath`                | Substituição opcional do `chat.db` do Messages.app; detectado automaticamente quando omitido.                                                                                                                                                                                                                         |
| _(implícito)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` — necessário somente quando `cliPath` é um wrapper SSH e você deseja buscar anexos via SCP.                                                                                                                                                                                                     |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mesmos valores (`pairing` / `allowlist` / `open` / `disabled`); padrão `pairing`.                                                                                                                                                                                                                                     |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Mesmos formatos de identificador (`+15555550123`, `user@example.com`). As aprovações do armazenamento de pareamento não são transferidas — veja abaixo.                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mesmos valores (`allowlist` / `open` / `disabled`); padrão `allowlist`.                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Igual. Quando não definido, o iMessage recorre a `allowFrom`; um `groupAllowFrom: []` explicitamente vazio bloqueia todos os grupos com `groupPolicy: "allowlist"`.                                                                                                                                                     |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Copie literalmente a entrada curinga `"*"`; altere as chaves das entradas por grupo para o `chat_id` numérico do iMessage — veja "Armadilha do registro de grupos". `requireMention`, `tools`, `toolsBySender` e `systemPrompt` são mantidos.                                                                           |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Padrão `true`. Com o plugin incluído, isso só é acionado quando a sondagem da API privada está ativa.                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Mesmo formato, também desativado por padrão. Se os anexos eram processados no BlueBubbles, defina isso explicitamente — fotos/mídias recebidas são descartadas silenciosamente (sem linha de log `Inbound message`) até que você faça isso.                                                                            |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Raízes locais; mesmas regras de curinga.                                                                                                                                                                                                                                                                              |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Usado somente quando `remoteHost` está definido para buscas via SCP.                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Padrão de 16 MB no iMessage (o padrão do BlueBubbles era 8 MB). Defina explicitamente para manter o limite menor.                                                                                                                                                                                                      |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Padrão de 4000 em ambos.                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Mesma ativação opcional. Somente para DMs — grupos mantêm o despacho por mensagem. Amplia o debounce padrão de entrada para 7000 ms, a menos que `messages.inbound.byChannel.imessage` ou um `messages.inbound.debounceMs` global esteja definido. Veja [Agrupamento de DMs enviadas separadamente](/pt-BR/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | `imsg` já fornece os nomes de exibição dos remetentes a partir de `chat.db`.                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Mesmos controles por ação (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`), além do novo `polls`. Todos são habilitados por padrão; ações da API privada ainda exigem a ponte.                           |

Configurações com várias contas (`channels.bluebubbles.accounts.*`) são convertidas individualmente para `channels.imessage.accounts.*`.

## Armadilha do registro de grupos

O plugin iMessage incluído executa dois controles de grupo em sequência. Uma mensagem de grupo deve passar por ambos para chegar ao agente:

1. **Lista de permissões de remetente/destino do chat** (`channels.imessage.groupAllowFrom`) — corresponde ao identificador do remetente ou ao destino do chat (entradas `chat_id:`, `chat_guid:`, `chat_identifier:`). Quando `groupAllowFrom` não está definido, esse controle recorre a `allowFrom`; um `groupAllowFrom: []` explícito desativa esse fallback e descarta todas as mensagens de grupo com `groupPolicy: "allowlist"`.
2. **Registro de grupos** (`channels.imessage.groups`) — indexado pelo `chat_id` numérico do iMessage:
   - Sem bloco `groups` (ou com um bloco vazio): os grupos passam por esse controle desde que o controle 1 tenha uma lista de permissões efetiva e não vazia de remetentes; a filtragem de remetentes controla o acesso e nenhum aviso de descarte total é emitido na inicialização.
   - `groups` com entradas, mas sem `"*"`: somente as chaves `chat_id` listadas passam. Listar qualquer grupo transforma o registro em uma lista de permissões, mesmo com `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: todos os grupos passam por esse controle.

A armadilha da migração: o BlueBubbles indexava as entradas de `groups` por GUID do chat/identificador do chat, enquanto o registro do iMessage usa o `chat_id` numérico. Entradas por grupo copiadas literalmente criam um registro não vazio cujas chaves nunca correspondem, portanto todas as mensagens de grupo são descartadas no controle 2. Copie literalmente o curinga `"*"`; altere as chaves das entradas de grupos específicos usando valores de `chat_id` obtidos de `imsg chats`.

Ambos os caminhos de descarte ficam visíveis no nível de log padrão por meio de linhas `warn`:

- Uma vez por conta na inicialização, quando `groupPolicy: "allowlist"` está definido e a lista de permissões efetiva de remetentes de grupo está vazia: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Defina `groupAllowFrom` (ou `allowFrom`) para admitir remetentes; adicionar apenas `groups` não satisfaz o controle de remetentes.
- Uma vez por `chat_id` em tempo de execução, quando o registro descarta um grupo: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, indicando a chave exata a adicionar.

As DMs continuam funcionando de qualquer forma — elas seguem um caminho de código diferente, portanto o sucesso das DMs não comprova o roteamento de grupos.

A configuração mínima com escopo por remetente usando `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Isso admite os remetentes configurados em qualquer grupo. Adicione entradas em `groups` para restringir os chats permitidos ou definir opções por chat, como `requireMention`; copie literalmente a entrada `"*"` do BlueBubbles, mas altere as chaves das entradas específicas usando valores numéricos de `chat_id` do iMessage.

## Passo a passo

1. Traduza a configuração. Mantenha o novo bloco desativado enquanto edita; o bloco antigo `channels.bluebubbles` é ignorado pelo OpenClaw atual e pode permanecer ao lado como referência:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // altere para true quando estiver pronto para fazer a transição
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copie de bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copie de bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // o curinga é copiado literalmente; altere as chaves das entradas por conversa para chat_id
         // as ações são habilitadas por padrão; defina opções individuais como false para desabilitá-las
       },
     },
   }
   ```

2. **Faça a transição e execute uma sondagem.** Defina `channels.imessage.enabled: true`, reinicie o Gateway e confirme que o canal é relatado como íntegro:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # espere "works"; --json mostra privateApi.available: true
   ```

   A sondagem exige um Gateway acessível e verifica somente contas configuradas e habilitadas. Use os comandos diretos de `imsg` em [Antes de começar](#before-you-start) para validar o próprio Mac.

3. **Verifique as mensagens diretas.** Envie uma mensagem direta ao agente; confirme que a resposta foi entregue.

4. **Verifique os grupos separadamente.** Mensagens diretas e grupos seguem caminhos de código diferentes — o sucesso das mensagens diretas não comprova que os grupos estão sendo roteados. Envie uma mensagem em uma conversa de grupo permitida e confirme que a resposta foi entregue. Se o grupo ficar em silêncio (sem resposta do agente e sem erro), verifique no log do Gateway as duas linhas de `warn` mencionadas em "Armadilha do registro de grupos" acima. O aviso de inicialização significa que a lista efetiva de remetentes permitidos está vazia; um aviso por `chat_id` significa que um registro `groups` preenchido não contém essa conversa.

5. **Verifique o conjunto de ações.** Em uma mensagem direta emparelhada, peça ao agente para reagir, editar, desfazer o envio, responder, enviar uma foto e, em um grupo, renomear o grupo ou adicionar/remover um participante. Cada ação deve ser realizada de forma nativa no Messages.app. Se alguma ação gerar `iMessage <action> requires the imsg private API bridge`, execute `imsg launch` novamente e atualize com `openclaw channels status --probe`.

6. **Remova o servidor BlueBubbles e o bloco `channels.bluebubbles`** depois de verificar as mensagens diretas, os grupos e as ações do iMessage. O OpenClaw não lê `channels.bluebubbles`.

## Comparação rápida das ações

| Ação                                                | BlueBubbles legado | iMessage incluído                                                              |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| Enviar texto / fallback para SMS                    | ✅                 | ✅                                                                            |
| Enviar mídia (foto, vídeo, arquivo, voz)            | ✅                 | ✅                                                                            |
| Resposta encadeada (`reply_to_guid`)                | ✅                 | ✅ (resolve [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                 | ✅                                                                            |
| Editar / desfazer envio (destinatários no macOS 13+)| ✅                 | ✅                                                                            |
| Enviar com efeito de tela                           | ✅                 | ✅ (resolve parte de [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Texto rico em negrito / itálico / sublinhado / tachado | ✅              | ✅ (formatação por intervalos tipados via attributedBody)                     |
| Enquetes nativas do Messages (criar e votar)        | ❌                 | ✅ (`actions.polls`; os destinatários precisam do iOS/macOS 26+ para renderização nativa) |
| Renomear grupo / definir ícone do grupo             | ✅                 | ✅                                                                            |
| Adicionar / remover participante, sair do grupo     | ✅                 | ✅                                                                            |
| Confirmações de leitura e indicador de digitação    | ✅                 | ✅ (condicionado à sondagem da API privada)                                   |
| Agrupamento de mensagens diretas do mesmo remetente | ✅                 | ✅ (somente mensagens diretas; adesão via `channels.imessage.coalesceSameSenderDms`) |
| Recuperação de mensagens recebidas após reinicialização | ✅              | ✅ (automática: reprodução de `since_rowid` + desduplicação por GUID; janela mais ampla localmente) |

O iMessage recupera mensagens perdidas enquanto o Gateway estava inativo: na inicialização, ele reproduz a partir do último rowid despachado usando `since_rowid` de `imsg watch.subscribe`, desduplica por GUID e uma barreira de idade para o backlog obsoleto suprime a "bomba de backlog" da descarga de Push. Isso ocorre pela conexão RPC do `imsg`, portanto também funciona em configurações remotas de `cliPath` por SSH; configurações locais têm uma janela de recuperação mais ampla porque podem ler `chat.db`. Consulte [Recuperação de mensagens recebidas após a reinicialização de uma ponte ou do Gateway](/pt-BR/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Emparelhamento, sessões e vinculações ACP

- **As listas de permissões são mantidas por identificador.** `channels.imessage.allowFrom` reconhece as mesmas strings `+15555550123` / `user@example.com` usadas pelo BlueBubbles — copie-as literalmente.
- **As aprovações do armazenamento de emparelhamento não são transferidas.** O armazenamento de emparelhamento é específico de cada canal, e nada migra o armazenamento antigo do BlueBubbles. Os remetentes que foram aprovados somente por emparelhamento precisam emparelhar novamente no iMessage, ou você deve adicionar os identificadores deles a `allowFrom`.
- **As sessões** permanecem no escopo de cada agente + conversa. Por padrão, as mensagens diretas são consolidadas na sessão principal do agente com `session.dmScope=main`; as sessões de grupo permanecem isoladas por `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). O histórico antigo de conversas associado às chaves de sessão do BlueBubbles não é transferido para as sessões do iMessage.
- **As vinculações ACP** que fazem referência a `match.channel: "bluebubbles"` devem ser alteradas para `"imessage"`. Os formatos de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificador sem prefixo) são idênticos.

## Sem canal de reversão

Não há um runtime BlueBubbles compatível para o qual seja possível voltar. Se a verificação do iMessage falhar, defina `channels.imessage.enabled: false`, reinicie o Gateway, corrija o bloqueio do `imsg` e tente a transição novamente.

O cache de respostas fica no estado SQLite do Plugin. `openclaw doctor --fix` importa e arquiva o arquivo auxiliar antigo `imessage/reply-cache.jsonl` quando ele está presente.

## Relacionados

- [Remoção do BlueBubbles e o caminho do iMessage com imsg](/pt-BR/announcements/bluebubbles-imessage) — anúncio breve e resumo para operadores.
- [iMessage](/pt-BR/channels/imessage) — referência completa do canal iMessage, incluindo a configuração de `imsg launch` e a detecção de recursos.
- `/channels/bluebubbles` — URL legada que redireciona para este guia de migração.
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de emparelhamento.
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como o Gateway escolhe um canal para respostas de saída.
