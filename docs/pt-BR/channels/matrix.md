---
read_when:
    - Configurando o Matrix no OpenClaw
    - Configurando E2EE e verificação do Matrix
summary: status de suporte, configuração inicial e exemplos de configuração do Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix é um Plugin de canal empacotado do OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a DMs, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Plugin empacotado

O Matrix é distribuído como um Plugin empacotado nas versões atuais do OpenClaw, portanto builds empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui o Matrix, instale-o manualmente:

Instalar pelo npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulte [Plugins](/pt-BR/tools/plugin) para o comportamento e as regras de instalação de Plugin.

## Configuração inicial

1. Verifique se o Plugin do Matrix está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta Matrix no seu homeserver.
3. Configure `channels.matrix` com um destes conjuntos:
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Reinicie o Gateway.
5. Inicie uma DM com o bot ou convide-o para uma sala.
   - Convites novos do Matrix só funcionam quando `channels.matrix.autoJoin` permite isso.

Caminhos de configuração interativa:

```bash
openclaw channels add
openclaw configure --section channels
```

O assistente do Matrix solicita:

- URL do homeserver
- método de autenticação: token de acesso ou senha
- ID do usuário (somente autenticação por senha)
- nome opcional do dispositivo
- se deve ativar E2EE
- se deve configurar acesso à sala e entrada automática por convite

Principais comportamentos do assistente:

- Se variáveis de ambiente de autenticação do Matrix já existirem e essa conta ainda não tiver autenticação salva na configuração, o assistente oferece um atalho de env para manter a autenticação nas variáveis de ambiente.
- Os nomes de conta são normalizados para o ID da conta. Por exemplo, `Ops Bot` se torna `ops-bot`.
- Entradas de allowlist de DM aceitam `@user:server` diretamente; nomes de exibição só funcionam quando a busca ativa no diretório encontra uma correspondência exata.
- Entradas de allowlist de sala aceitam IDs e aliases de sala diretamente. Prefira `!room:server` ou `#alias:server`; nomes não resolvidos são ignorados em tempo de execução pela resolução da allowlist.
- No modo de allowlist para entrada automática por convite, use apenas destinos de convite estáveis: `!roomId:server`, `#alias:server` ou `*`. Nomes simples de sala são rejeitados.
- Para resolver nomes de sala antes de salvar, use `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` tem como padrão `off`.

Se você deixar isso sem definir, o bot não entrará em salas convidadas nem em convites novos no estilo DM, então ele não aparecerá em novos grupos nem em DMs por convite, a menos que você entre manualmente primeiro.

Defina `autoJoin: "allowlist"` junto com `autoJoinAllowlist` para restringir quais convites ele aceita, ou defina `autoJoin: "always"` se quiser que ele entre em todos os convites.

No modo `allowlist`, `autoJoinAllowlist` aceita apenas `!roomId:server`, `#alias:server` ou `*`.
</Warning>

Exemplo de allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Entrar em todos os convites:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Configuração mínima baseada em token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configuração baseada em senha (o token é armazenado em cache após o login):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

O Matrix armazena credenciais em cache em `~/.openclaw/credentials/matrix/`.
A conta padrão usa `credentials.json`; contas nomeadas usam `credentials-<account>.json`.
Quando existem credenciais em cache nesse local, o OpenClaw trata o Matrix como configurado para configuração inicial, doctor e descoberta de status do canal, mesmo que a autenticação atual não esteja definida diretamente na configuração.

Equivalentes em variáveis de ambiente (usados quando a chave de configuração não está definida):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Para contas não padrão, use variáveis de ambiente com escopo da conta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Exemplo para a conta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Para o ID de conta normalizado `ops-bot`, use:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

O Matrix escapa pontuação nos IDs de conta para manter variáveis de ambiente com escopo livres de colisões.
Por exemplo, `-` se torna `_X2D_`, então `ops-prod` é mapeado para `MATRIX_OPS_X2D_PROD_*`.

O assistente interativo só oferece o atalho de variável de ambiente quando essas variáveis de autenticação já estão presentes e a conta selecionada ainda não tem autenticação do Matrix salva na configuração.

`MATRIX_HOMESERVER` não pode ser definido a partir de um `.env` do workspace; consulte [Workspace `.env` files](/pt-BR/gateway/security).

## Exemplo de configuração

Esta é uma configuração base prática com emparelhamento por DM, allowlist de salas e E2EE ativado:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` se aplica a todos os convites do Matrix, incluindo convites no estilo DM. O OpenClaw não consegue
classificar com confiabilidade uma sala convidada como DM ou grupo no momento do convite, então todos os convites passam por `autoJoin`
primeiro. `dm.policy` se aplica depois que o bot entra e a sala é classificada como DM.

## Prévias de streaming

O streaming de respostas no Matrix é opt-in.

Defina `channels.matrix.streaming` como `"partial"` quando quiser que o OpenClaw envie uma única
resposta de prévia ao vivo, edite essa prévia no mesmo lugar enquanto o modelo gera texto e depois a
finalize quando a resposta estiver concluída:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` é o padrão. O OpenClaw espera a resposta final e a envia uma vez.
- `streaming: "partial"` cria uma mensagem de prévia editável para o bloco atual do assistente usando mensagens de texto normais do Matrix. Isso preserva o comportamento legado do Matrix de notificação pela prévia primeiro, então clientes padrão podem notificar com base no primeiro texto da prévia transmitida em vez do bloco concluído.
- `streaming: "quiet"` cria um aviso silencioso de prévia editável para o bloco atual do assistente. Use isso somente quando também configurar regras de push do destinatário para edições de prévia finalizadas.
- `blockStreaming: true` ativa mensagens separadas de progresso no Matrix. Com a prévia de streaming ativada, o Matrix mantém o rascunho ao vivo do bloco atual e preserva os blocos concluídos como mensagens separadas.
- Quando a prévia de streaming está ativada e `blockStreaming` está desativado, o Matrix edita o rascunho ao vivo no mesmo lugar e finaliza esse mesmo evento quando o bloco ou turno termina.
- Se a prévia não couber mais em um único evento do Matrix, o OpenClaw interrompe a prévia de streaming e volta para a entrega final normal.
- Respostas com mídia ainda enviam anexos normalmente. Se uma prévia desatualizada não puder mais ser reutilizada com segurança, o OpenClaw a remove antes de enviar a resposta final com mídia.
- Edições de prévia geram chamadas extras para a API do Matrix. Deixe o streaming desativado se quiser o comportamento mais conservador em relação a limite de taxa.

`blockStreaming` não ativa prévias de rascunho por si só.
Use `streaming: "partial"` ou `streaming: "quiet"` para edições de prévia; depois adicione `blockStreaming: true` somente se também quiser que blocos concluídos do assistente permaneçam visíveis como mensagens separadas de progresso.

Se você precisar de notificações padrão do Matrix sem regras de push personalizadas, use `streaming: "partial"` para o comportamento de prévia primeiro ou deixe `streaming` desativado para entrega somente final. Com `streaming: "off"`:

- `blockStreaming: true` envia cada bloco concluído como uma mensagem normal de notificação do Matrix.
- `blockStreaming: false` envia apenas a resposta final concluída como uma mensagem normal de notificação do Matrix.

### Regras de push auto-hospedadas para prévias silenciosas finalizadas

O streaming silencioso (`streaming: "quiet"`) só notifica destinatários quando um bloco ou turno é finalizado — uma regra de push por usuário precisa corresponder ao marcador de prévia finalizada. Consulte [Matrix push rules for quiet previews](/pt-BR/channels/matrix-push-rules) para a configuração completa (token do destinatário, verificação de pusher, instalação da regra, observações por homeserver).

## Salas bot para bot

Por padrão, mensagens do Matrix de outras contas Matrix configuradas do OpenClaw são ignoradas.

Use `allowBots` quando você quiser intencionalmente tráfego Matrix entre agentes:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` aceita mensagens de outras contas de bot Matrix configuradas em salas e DMs permitidas.
- `allowBots: "mentions"` aceita essas mensagens somente quando mencionam visivelmente este bot nas salas. DMs continuam permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário do Matrix para evitar loops de autorresposta.
- O Matrix não expõe aqui um sinalizador nativo de bot; o OpenClaw trata “autoria de bot” como “enviado por outra conta Matrix configurada neste Gateway OpenClaw”.

Use allowlists rígidas de sala e exigências de menção ao ativar tráfego bot para bot em salas compartilhadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem de saída usam `thumbnail_file` para que as prévias de imagem sejam criptografadas junto com o anexo completo. Salas não criptografadas ainda usam `thumbnail_url` simples. Nenhuma configuração é necessária — o Plugin detecta o estado de E2EE automaticamente.

Ativar criptografia:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Comandos de verificação (todos aceitam `--verbose` para diagnósticos e `--json` para saída legível por máquina):

```bash
openclaw matrix verify status
```

Status detalhado (diagnósticos completos):

```bash
openclaw matrix verify status --verbose
```

Incluir a chave de recuperação armazenada na saída legível por máquina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inicializar o estado de cross-signing e verificação:

```bash
openclaw matrix verify bootstrap
```

Diagnósticos detalhados da inicialização:

```bash
openclaw matrix verify bootstrap --verbose
```

Forçar uma redefinição nova da identidade de cross-signing antes da inicialização:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verificar este dispositivo com uma chave de recuperação:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Este comando informa três estados separados:

- `Recovery key accepted`: o Matrix aceitou a chave de recuperação para armazenamento secreto ou confiança do dispositivo.
- `Backup usable`: o backup da chave da sala pode ser carregado com material de recuperação confiável.
- `Device verified by owner`: o dispositivo atual do OpenClaw tem confiança total na identidade de cross-signing do Matrix.

`Signed by owner` na saída detalhada ou JSON é apenas diagnóstico. O OpenClaw não
trata isso como suficiente, a menos que `Cross-signing verified` também seja `yes`.

O comando ainda termina com código diferente de zero quando a confiança total da identidade do Matrix está incompleta,
mesmo que a chave de recuperação consiga desbloquear o material de backup. Nesse caso, conclua
a autoverificação em outro cliente Matrix:

```bash
openclaw matrix verify self
```

Aceite a solicitação em outro cliente Matrix, compare os emojis SAS ou os decimais
e digite `yes` somente quando eles corresponderem. O comando aguarda o Matrix informar
`Cross-signing verified: yes` antes de ser concluído com sucesso.

Use `verify bootstrap --force-reset-cross-signing` apenas quando você
quiser intencionalmente substituir a identidade atual de cross-signing.

Detalhes detalhados da verificação do dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Verificar a integridade do backup da chave da sala:

```bash
openclaw matrix verify backup status
```

Diagnósticos detalhados da integridade do backup:

```bash
openclaw matrix verify backup status --verbose
```

Restaurar chaves de sala a partir do backup do servidor:

```bash
openclaw matrix verify backup restore
```

Fluxo interativo de autoverificação:

```bash
openclaw matrix verify self
```

Para solicitações de verificação de nível mais baixo ou de entrada, use:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Use `openclaw matrix verify cancel <id>` para cancelar uma solicitação.

Diagnósticos detalhados da restauração:

```bash
openclaw matrix verify backup restore --verbose
```

Excluir o backup atual do servidor e criar uma nova linha de base de backup. Se a
chave de backup armazenada não puder ser carregada corretamente, essa redefinição também poderá recriar o armazenamento secreto para que
futuras inicializações a frio possam carregar a nova chave de backup:

```bash
openclaw matrix verify backup reset --yes
```

Todos os comandos `verify` são concisos por padrão (incluindo logs internos silenciosos do SDK) e mostram diagnósticos detalhados apenas com `--verbose`.
Use `--json` para saída completa legível por máquina ao criar scripts.

Em configurações com várias contas, os comandos Matrix da CLI usam a conta padrão implícita do Matrix, a menos que você passe `--account <id>`.
Se você configurar várias contas nomeadas, defina primeiro `channels.matrix.defaultAccount`, caso contrário essas operações implícitas da CLI serão interrompidas e pedirão que você escolha uma conta explicitamente.
Use `--account` sempre que quiser que operações de verificação ou de dispositivo tenham como alvo explicitamente uma conta nomeada:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando a criptografia estiver desativada ou indisponível para uma conta nomeada, avisos do Matrix e erros de verificação apontarão para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="O que significa verified">
    O OpenClaw trata um dispositivo como verificado apenas quando sua própria identidade de cross-signing o assina. `verify status --verbose` expõe três sinais de confiança:

    - `Locally trusted`: confiável apenas por este cliente
    - `Cross-signing verified`: o SDK informa verificação via cross-signing
    - `Signed by owner`: assinado pela sua própria chave self-signing

    `Verified by owner` se torna `yes` somente quando a verificação por cross-signing está presente.
    Confiança local ou uma assinatura do proprietário, por si só, não são suficientes para o OpenClaw tratar
    o dispositivo como totalmente verificado.

  </Accordion>

  <Accordion title="O que o bootstrap faz">
    `verify bootstrap` é o comando de reparo e configuração para contas criptografadas. Em ordem, ele:

    - inicializa o armazenamento secreto, reutilizando uma chave de recuperação existente quando possível
    - inicializa o cross-signing e envia chaves públicas de cross-signing ausentes
    - marca e assina por cross-signing o dispositivo atual
    - cria um backup de chave de sala no lado do servidor se ainda não existir

    Se o homeserver exigir UIA para enviar chaves de cross-signing, o OpenClaw tenta primeiro sem autenticação, depois `m.login.dummy`, depois `m.login.password` (requer `channels.matrix.password`). Use `--force-reset-cross-signing` apenas ao descartar intencionalmente a identidade atual.

  </Accordion>

  <Accordion title="Nova linha de base de backup">
    Se você quiser manter futuras mensagens criptografadas funcionando e aceitar perder histórico antigo irrecuperável:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Adicione `--account <id>` para direcionar a uma conta nomeada. Isso também pode recriar o armazenamento secreto se o segredo de backup atual não puder ser carregado com segurança.

  </Accordion>

  <Accordion title="Comportamento na inicialização">
    Com `encryption: true`, `startupVerification` assume `"if-unverified"` por padrão. Na inicialização, um dispositivo não verificado solicita autoverificação em outro cliente Matrix, ignorando duplicatas e aplicando um período de espera. Ajuste com `startupVerificationCooldownHours` ou desative com `startupVerification: "off"`.

    A inicialização também executa uma passagem conservadora de bootstrap de criptografia que reutiliza o armazenamento secreto atual e a identidade atual de cross-signing. Se o estado do bootstrap estiver quebrado, o OpenClaw tentará um reparo protegido mesmo sem `channels.matrix.password`; se o homeserver exigir UIA por senha, a inicialização registrará um aviso e permanecerá não fatal. Dispositivos já assinados pelo proprietário são preservados.

    Consulte [Matrix migration](/pt-BR/install/migrating-matrix) para o fluxo completo de atualização.

  </Accordion>

  <Accordion title="Avisos de verificação">
    O Matrix publica avisos do ciclo de vida da verificação na DM estrita de verificação como mensagens `m.notice`: solicitação, pronto (com orientação "Verificar por emoji"), início/conclusão e detalhes do SAS (emoji/decimal) quando disponíveis.

    Solicitações recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente. Para autoverificação, o OpenClaw inicia o fluxo SAS automaticamente e confirma seu próprio lado assim que a verificação por emoji fica disponível — você ainda precisa comparar e confirmar "They match" no seu cliente Matrix.

    Avisos de sistema de verificação não são encaminhados ao pipeline de chat do agente.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Dispositivos antigos gerenciados pelo OpenClaw podem se acumular. Liste e remova os obsoletos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Armazenamento de criptografia">
    O E2EE do Matrix usa o caminho oficial de criptografia Rust do `matrix-js-sdk` com `fake-indexeddb` como shim do IndexedDB. O estado de criptografia persiste em `crypto-idb-snapshot.json` (permissões restritivas de arquivo).

    O estado criptografado de execução fica em `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e inclui o armazenamento de sincronização, armazenamento de criptografia, chave de recuperação, snapshot do IDB, vínculos de thread e estado de verificação na inicialização. Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor raiz existente para que o estado anterior continue visível.

  </Accordion>
</AccordionGroup>

## Gerenciamento de perfil

Atualize o próprio perfil Matrix da conta selecionada com:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Adicione `--account <id>` quando quiser direcionar explicitamente a uma conta Matrix nomeada.

O Matrix aceita URLs de avatar `mxc://` diretamente. Quando você passa uma URL de avatar `http://` ou `https://`, o OpenClaw a envia primeiro para o Matrix e armazena a URL `mxc://` resolvida de volta em `channels.matrix.avatarUrl` (ou na substituição da conta selecionada).

## Threads

O Matrix oferece suporte a threads nativas do Matrix tanto para respostas automáticas quanto para envios da ferramenta de mensagens.

- `dm.sessionScope: "per-user"` (padrão) mantém o roteamento de DM do Matrix com escopo por remetente, para que várias salas de DM possam compartilhar uma sessão quando forem resolvidas para o mesmo par.
- `dm.sessionScope: "per-room"` isola cada sala de DM do Matrix em sua própria chave de sessão, ainda usando autenticação normal de DM e verificações de allowlist.
- Vínculos explícitos de conversa do Matrix ainda têm prioridade sobre `dm.sessionScope`, então salas e threads vinculadas mantêm a sessão de destino escolhida.
- `threadReplies: "off"` mantém as respostas no nível superior e mantém mensagens de entrada em thread na sessão pai.
- `threadReplies: "inbound"` responde dentro de uma thread apenas quando a mensagem de entrada já estava nessa thread.
- `threadReplies: "always"` mantém respostas de sala em uma thread enraizada na mensagem que disparou a ação e roteia essa conversa pela sessão com escopo de thread correspondente a partir da primeira mensagem disparadora.
- `dm.threadReplies` substitui a configuração de nível superior apenas para DMs. Por exemplo, você pode manter threads de salas isoladas enquanto mantém DMs planas.
- Mensagens de entrada em thread incluem a mensagem raiz da thread como contexto adicional para o agente.
- Envios da ferramenta de mensagens herdam automaticamente a thread Matrix atual quando o destino é a mesma sala, ou o mesmo destino de usuário em DM, a menos que um `threadId` explícito seja fornecido.
- A reutilização do mesmo destino de usuário em DM na mesma sessão só entra em ação quando os metadados da sessão atual comprovam o mesmo par de DM na mesma conta Matrix; caso contrário, o OpenClaw volta ao roteamento normal com escopo por usuário.
- Quando o OpenClaw vê uma sala de DM do Matrix colidir com outra sala de DM na mesma sessão compartilhada de DM do Matrix, ele publica um único `m.notice` nessa sala com a via de escape `/focus` quando os vínculos de thread estão ativados e a dica `dm.sessionScope`.
- Vínculos de thread em tempo de execução são compatíveis com Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a thread funcionam em salas Matrix e DMs.
- `/focus` no nível superior de sala/DM do Matrix cria uma nova thread Matrix e a vincula à sessão de destino quando `threadBindings.spawnSubagentSessions=true`.
- Executar `/focus` ou `/acp spawn --thread here` dentro de uma thread Matrix existente vincula essa thread atual em vez disso.

## Vínculos de conversa ACP

Salas Matrix, DMs e threads Matrix existentes podem ser transformadas em workspaces ACP duráveis sem alterar a superfície de chat.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM, sala ou thread existente do Matrix que você deseja continuar usando.
- Em uma DM ou sala Matrix de nível superior, a DM/sala atual continua sendo a superfície de chat e futuras mensagens são roteadas para a sessão ACP criada.
- Dentro de uma thread Matrix existente, `--bind here` vincula essa thread atual no mesmo lugar.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no mesmo lugar.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Observações:

- `--bind here` não cria uma thread Matrix filha.
- `threadBindings.spawnAcpSessions` só é necessário para `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou vincular uma thread Matrix filha.

### Configuração de vínculo de thread

O Matrix herda padrões globais de `session.threadBindings` e também oferece suporte a substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Os sinalizadores de criação vinculada a thread no Matrix são opt-in:

- Defina `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` no nível superior crie e vincule novas threads Matrix.
- Defina `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sessões ACP a threads Matrix.

## Reações

O Matrix oferece suporte a ações de reação de saída, notificações de reação de entrada e reações de confirmação de entrada.

- O ferramental de reações de saída é controlado por `channels["matrix"].actions.reactions`.
- `react` adiciona uma reação a um evento específico do Matrix.
- `reactions` lista o resumo atual de reações para um evento específico do Matrix.
- `emoji=""` remove as reações da própria conta do bot nesse evento.
- `remove: true` remove apenas a reação de emoji especificada da conta do bot.

O escopo das reações de confirmação é resolvido nesta ordem padrão do OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback para o emoji da identidade do agente

O escopo da reação de confirmação é resolvido nesta ordem:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

O modo de notificação de reação é resolvido nesta ordem:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- padrão: `own`

Comportamento:

- `reactionNotifications: "own"` encaminha eventos `m.reaction` adicionados quando eles têm como alvo mensagens Matrix de autoria do bot.
- `reactionNotifications: "off"` desativa eventos de sistema de reação.
- Remoções de reação não são sintetizadas em eventos de sistema porque o Matrix as expõe como redações, não como remoções independentes de `m.reaction`.

## Contexto do histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala do Matrix aciona o agente. Usa como fallback `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo é `0`. Defina `0` para desativar.
- O histórico de sala do Matrix é somente da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de sala do Matrix é apenas pendente: o OpenClaw armazena em buffer mensagens da sala que ainda não acionaram uma resposta e então captura um snapshot dessa janela quando uma menção ou outro gatilho chega.
- A mensagem atual que acionou o evento não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada daquele turno.
- Novas tentativas do mesmo evento Matrix reutilizam o snapshot original do histórico em vez de avançar para mensagens mais novas da sala.

## Visibilidade de contexto

O Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar da sala, como texto de resposta buscado, raízes de thread e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist de sala/usuário.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

Essa configuração afeta a visibilidade do contexto suplementar, não se a própria mensagem de entrada pode acionar uma resposta.
A autorização do gatilho continua vindo de `groupPolicy`, `groups`, `groupAllowFrom` e das configurações de política de DM.

## Política de DM e sala

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Consulte [Groups](/pt-BR/channels/groups) para comportamento de exigência de menção e allowlist.

Exemplo de emparelhamento para DMs do Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário Matrix não aprovado continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de emparelhamento pendente e pode enviar uma resposta de lembrete novamente após um curto período de espera em vez de gerar um novo código.

Consulte [Pairing](/pt-BR/channels/pairing) para o fluxo compartilhado de emparelhamento de DM e o layout de armazenamento.

## Reparo direto de sala

Se o estado de mensagem direta sair de sincronia, o OpenClaw pode acabar com mapeamentos `m.direct` obsoletos que apontam para salas solo antigas em vez da DM ativa. Inspecione o mapeamento atual para um par com:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repare com:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

O fluxo de reparo:

- prefere uma DM estrita 1:1 que já esteja mapeada em `m.direct`
- recorre a qualquer DM estrita 1:1 atualmente ingressada com esse usuário
- cria uma nova sala direta e reescreve `m.direct` se não existir uma DM saudável

O fluxo de reparo não exclui salas antigas automaticamente. Ele apenas escolhe a DM saudável e atualiza o mapeamento para que novos envios Matrix, avisos de verificação e outros fluxos de mensagem direta voltem a apontar para a sala correta.

## Aprovações de exec

O Matrix pode atuar como um cliente nativo de aprovação para uma conta Matrix. Os controles nativos
de roteamento de DM/canal ainda ficam na configuração de aprovação de exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; usa `channels.matrix.dm.allowFrom` como fallback)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Os aprovadores devem ser IDs de usuário Matrix, como `@owner:example.org`. O Matrix ativa automaticamente aprovações nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido. Aprovações de exec usam primeiro `execApprovals.approvers` e podem recorrer a `channels.matrix.dm.allowFrom`. Aprovações de Plugin autorizam por meio de `channels.matrix.dm.allowFrom`. Defina `enabled: false` para desativar explicitamente o Matrix como cliente nativo de aprovação. Caso contrário, solicitações de aprovação recorrem a outras rotas de aprovação configuradas ou à política de fallback de aprovação.

O roteamento nativo do Matrix oferece suporte a ambos os tipos de aprovação:

- `channels.matrix.execApprovals.*` controla o modo nativo de fanout de DM/canal para prompts de aprovação do Matrix.
- Aprovações de exec usam o conjunto de aprovadores de exec de `execApprovals.approvers` ou `channels.matrix.dm.allowFrom`.
- Aprovações de Plugin usam a allowlist de DM do Matrix de `channels.matrix.dm.allowFrom`.
- Atalhos de reação e atualizações de mensagem do Matrix se aplicam tanto a aprovações de exec quanto de Plugin.

Regras de entrega:

- `target: "dm"` envia prompts de aprovação para as DMs dos aprovadores
- `target: "channel"` envia o prompt de volta para a sala Matrix ou DM de origem
- `target: "both"` envia para as DMs dos aprovadores e para a sala Matrix ou DM de origem

Prompts de aprovação do Matrix semeiam atalhos de reação na mensagem principal de aprovação:

- `✅` = permitir uma vez
- `❌` = negar
- `♾️` = permitir sempre quando essa decisão for permitida pela política de exec efetiva

Os aprovadores podem reagir nessa mensagem ou usar os comandos slash de fallback: `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. Para aprovações de exec, a entrega em canal inclui o texto do comando, portanto ative `channel` ou `both` apenas em salas confiáveis.

Substituição por conta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentação relacionada: [Exec approvals](/pt-BR/tools/exec-approvals)

## Comandos slash

Comandos slash do Matrix (por exemplo, `/new`, `/reset`, `/model`) funcionam diretamente em DMs. Em salas, o OpenClaw também reconhece comandos slash prefixados com a própria menção Matrix do bot, então `@bot:server /new` aciona o caminho de comando sem precisar de uma regex de menção personalizada. Isso mantém o bot responsivo a publicações no estilo de sala `@mention /command` que o Element e clientes semelhantes emitem quando um usuário completa com Tab o bot antes de digitar o comando.

As regras de autorização ainda se aplicam: remetentes de comandos devem satisfazer as políticas de proprietário ou allowlist de DM ou sala, assim como em mensagens simples.

## Várias contas

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Valores de nível superior em `channels.matrix` atuam como padrões para contas nomeadas, a menos que uma conta os substitua.
Você pode aplicar entradas de sala herdadas a uma única conta Matrix com `groups.<room>.account`.
Entradas sem `account` permanecem compartilhadas entre todas as contas Matrix, e entradas com `account: "default"` continuam funcionando quando a conta padrão é configurada diretamente no nível superior em `channels.matrix.*`.
Padrões parciais compartilhados de autenticação não criam, por si só, uma conta padrão implícita separada. O OpenClaw só sintetiza a conta `default` de nível superior quando esse padrão tem autenticação nova (`homeserver` mais `accessToken`, ou `homeserver` mais `userId` e `password`); contas nomeadas ainda podem continuar detectáveis a partir de `homeserver` mais `userId` quando credenciais em cache satisfizerem a autenticação depois.
Se o Matrix já tiver exatamente uma conta nomeada, ou `defaultAccount` apontar para uma chave de conta nomeada existente, a promoção de reparo/configuração de conta única para várias contas preserva essa conta em vez de criar uma nova entrada `accounts.default`. Apenas chaves de autenticação/bootstrap do Matrix são movidas para essa conta promovida; chaves compartilhadas de política de entrega permanecem no nível superior.
Defina `defaultAccount` quando quiser que o OpenClaw prefira uma conta Matrix nomeada para roteamento implícito, sondagem e operações da CLI.
Se várias contas Matrix estiverem configuradas e um dos IDs de conta for `default`, o OpenClaw usa essa conta implicitamente mesmo quando `defaultAccount` não está definido.
Se você configurar várias contas nomeadas, defina `defaultAccount` ou passe `--account <id>` para comandos da CLI que dependem da seleção implícita de conta.
Passe `--account <id>` para `openclaw matrix verify ...` e `openclaw matrix devices ...` quando quiser substituir essa seleção implícita para um comando.

Consulte [Configuration reference](/pt-BR/gateway/config-channels#multi-account-all-channels) para o padrão compartilhado de várias contas.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers Matrix privados/internos para proteção contra SSRF, a menos que você
faça a ativação explícita por conta.

Se o seu homeserver estiver em localhost, em um IP de LAN/Tailscale ou em um hostname interno, ative
`network.dangerouslyAllowPrivateNetwork` para essa conta Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Exemplo de configuração pela CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Essa ativação explícita permite apenas destinos privados/internos confiáveis. Homeservers públicos em texto simples, como
`http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Uso de proxy para tráfego Matrix

Se a sua implantação Matrix precisar de um proxy HTTP(S) de saída explícito, defina `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Contas nomeadas podem substituir o padrão de nível superior com `channels.matrix.accounts.<id>.proxy`.
O OpenClaw usa a mesma configuração de proxy para tráfego Matrix em tempo de execução e para sondas de status da conta.

## Resolução de destino

O Matrix aceita estes formatos de destino em qualquer lugar onde o OpenClaw peça um destino de sala ou usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

A busca ativa no diretório usa a conta Matrix autenticada:

- Buscas de usuário consultam o diretório de usuários Matrix nesse homeserver.
- Buscas de sala aceitam diretamente IDs e aliases de sala explícitos e depois recorrem à pesquisa de nomes de salas ingressadas para essa conta.
- A busca por nome de sala ingressada é por melhor esforço. Se um nome de sala não puder ser resolvido para um ID ou alias, ele será ignorado pela resolução de allowlist em tempo de execução.

## Referência de configuração

- `enabled`: ativa ou desativa o canal.
- `name`: rótulo opcional para a conta.
- `defaultAccount`: ID de conta preferido quando várias contas Matrix estão configuradas.
- `homeserver`: URL do homeserver, por exemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta Matrix se conecte a homeservers privados/internos. Ative isso quando o homeserver for resolvido para `localhost`, um IP de LAN/Tailscale ou um host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para tráfego Matrix. Contas nomeadas podem substituir o padrão de nível superior com seu próprio `proxy`.
- `userId`: ID completo do usuário Matrix, por exemplo `@bot:example.org`.
- `accessToken`: token de acesso para autenticação baseada em token. Valores em texto simples e valores SecretRef são compatíveis com `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` em provedores env/file/exec. Consulte [Secrets Management](/pt-BR/gateway/secrets).
- `password`: senha para login baseado em senha. Valores em texto simples e valores SecretRef são compatíveis.
- `deviceId`: ID explícito do dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo para login com senha.
- `avatarUrl`: URL armazenada do próprio avatar para sincronização de perfil e atualizações de `profile set`.
- `initialSyncLimit`: número máximo de eventos buscados durante a sincronização na inicialização.
- `encryption`: ativa E2EE.
- `allowlistOnly`: quando `true`, promove a política de sala `open` para `allowlist` e força todas as políticas de DM ativas, exceto `disabled` (incluindo `pairing` e `open`), para `allowlist`. Não afeta políticas `disabled`.
- `allowBots`: permite mensagens de outras contas Matrix configuradas do OpenClaw (`true` ou `"mentions"`).
- `groupPolicy`: `open`, `allowlist` ou `disabled`.
- `contextVisibility`: modo de visibilidade do contexto suplementar da sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist de IDs de usuário para tráfego de sala. IDs completos de usuário Matrix são os mais seguros; correspondências exatas de diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `historyLimit`: número máximo de mensagens da sala a incluir como contexto de histórico de grupo. Usa como fallback `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo é `0`. Defina `0` para desativar.
- `replyToMode`: `off`, `first`, `all` ou `batched`.
- `markdown`: configuração opcional de renderização Markdown para texto Matrix de saída.
- `streaming`: `off` (padrão), `"partial"`, `"quiet"`, `true` ou `false`. `"partial"` e `true` ativam atualizações de rascunho com prévia primeiro usando mensagens de texto Matrix normais. `"quiet"` usa avisos de prévia sem notificação para configurações auto-hospedadas com regras de push. `false` equivale a `"off"`.
- `blockStreaming`: `true` ativa mensagens separadas de progresso para blocos concluídos do assistente enquanto a prévia de rascunho por streaming está ativa.
- `threadReplies`: `off`, `inbound` ou `always`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessão vinculados a thread.
- `startupVerification`: modo automático de solicitação de autoverificação na inicialização (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: período de espera antes de tentar novamente solicitações automáticas de verificação na inicialização.
- `textChunkLimit`: tamanho do chunk de mensagem de saída em caracteres (aplica-se quando `chunkMode` é `length`).
- `chunkMode`: `length` divide mensagens por contagem de caracteres; `newline` divide em limites de linha.
- `responsePrefix`: string opcional adicionada antes de todas as respostas de saída deste canal.
- `ackReaction`: substituição opcional da reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição opcional do escopo da reação de confirmação (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificação de reações de entrada (`own`, `off`).
- `mediaMaxMb`: limite de tamanho de mídia em MB para envios de saída e processamento de mídia de entrada.
- `autoJoin`: política de entrada automática por convite (`always`, `allowlist`, `off`). Padrão: `off`. Aplica-se a todos os convites Matrix, incluindo convites no estilo DM.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `allowlist`. Entradas de alias são resolvidas para IDs de sala durante o tratamento do convite; o OpenClaw não confia no estado de alias declarado pela sala convidada.
- `dm`: bloco de política de DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla o acesso por DM depois que o OpenClaw entrou na sala e a classificou como DM. Isso não muda se um convite será aceito automaticamente.
- `dm.allowFrom`: allowlist de IDs de usuário para tráfego de DM. IDs completos de usuário Matrix são os mais seguros; correspondências exatas de diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `dm.sessionScope`: `per-user` (padrão) ou `per-room`. Use `per-room` quando quiser que cada sala de DM do Matrix mantenha contexto separado, mesmo que o par seja o mesmo.
- `dm.threadReplies`: substituição da política de thread apenas para DM (`off`, `inbound`, `always`). Substitui a configuração `threadReplies` de nível superior tanto para posicionamento de resposta quanto para isolamento de sessão em DMs.
- `execApprovals`: entrega nativa de aprovações de exec no Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuário Matrix autorizados a aprovar solicitações de exec. Opcional quando `dm.allowFrom` já identifica os aprovadores.
- `execApprovals.target`: `dm | channel | both` (padrão: `dm`).
- `accounts`: substituições nomeadas por conta. Valores de nível superior em `channels.matrix` atuam como padrões para essas entradas.
- `groups`: mapa de política por sala. Prefira IDs ou aliases de sala; nomes de sala não resolvidos são ignorados em tempo de execução. A identidade de sessão/grupo usa o ID estável da sala após a resolução.
- `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta Matrix específica em configurações com várias contas.
- `groups.<room>.allowBots`: substituição no nível da sala para remetentes de bots configurados (`true` ou `"mentions"`).
- `groups.<room>.users`: allowlist de remetentes por sala.
- `groups.<room>.tools`: substituições por sala de permitir/negar ferramentas.
- `groups.<room>.autoReply`: substituição no nível da sala para exigência de menção. `true` desativa exigências de menção para essa sala; `false` as força novamente.
- `groups.<room>.skills`: filtro opcional de Skills no nível da sala.
- `groups.<room>.systemPrompt`: snippet opcional de prompt de sistema no nível da sala.
- `rooms`: alias legado para `groups`.
- `actions`: controle por ação de ferramentas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Channels Overview](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação por DM e fluxo de emparelhamento
- [Groups](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Channel Routing](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
