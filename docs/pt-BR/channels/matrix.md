---
read_when:
    - Configurando o Matrix no OpenClaw
    - Configurando E2EE e verificação do Matrix
summary: Status de suporte, configuração inicial e exemplos de configuração do Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-24T05:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix é um Plugin de canal incluído no OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a DMs, salas, tópicos, mídia, reações, enquetes, localização e E2EE.

## Plugin incluído

O Matrix é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto
compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Matrix, instale-o manualmente:

Instalar pelo npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulte [Plugins](/pt-BR/tools/plugin) para o comportamento e as regras de instalação de Plugin.

## Configuração

1. Verifique se o Plugin Matrix está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta Matrix no seu homeserver.
3. Configure `channels.matrix` com:
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Reinicie o Gateway.
5. Inicie uma DM com o bot ou convide-o para uma sala.
   - Convites novos no Matrix só funcionam quando `channels.matrix.autoJoin` os permite.

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

- Se as variáveis de ambiente de autenticação do Matrix já existirem e essa conta ainda não tiver autenticação salva na configuração, o assistente oferece um atalho de env para manter a autenticação nas variáveis de ambiente.
- Os nomes das contas são normalizados para o ID da conta. Por exemplo, `Ops Bot` se torna `ops-bot`.
- Entradas da allowlist de DM aceitam `@user:server` diretamente; nomes de exibição só funcionam quando a busca ativa no diretório encontra uma correspondência exata.
- Entradas da allowlist de sala aceitam IDs e aliases de sala diretamente. Prefira `!room:server` ou `#alias:server`; nomes não resolvidos são ignorados em tempo de execução pela resolução da allowlist.
- No modo de allowlist de entrada automática por convite, use apenas destinos de convite estáveis: `!roomId:server`, `#alias:server` ou `*`. Nomes simples de sala são rejeitados.
- Para resolver nomes de sala antes de salvar, use `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` usa `off` por padrão.

Se você deixar sem configurar, o bot não entrará em salas convidadas nem em convites novos no estilo DM, portanto não aparecerá em novos grupos ou DMs por convite, a menos que você entre manualmente primeiro.

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

Para contas não padrão, use variáveis de ambiente com escopo por conta:

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

O Matrix escapa pontuação nos IDs de conta para manter variáveis de ambiente com escopo sem colisões.
Por exemplo, `-` se torna `_X2D_`, então `ops-prod` é mapeado para `MATRIX_OPS_X2D_PROD_*`.

O assistente interativo só oferece o atalho de variável de ambiente quando essas variáveis de autenticação já estão presentes e a conta selecionada ainda não tem autenticação do Matrix salva na configuração.

`MATRIX_HOMESERVER` não pode ser definido a partir de um `.env` do espaço de trabalho; consulte [arquivos `.env` do espaço de trabalho](/pt-BR/gateway/security).

## Exemplo de configuração

Esta é uma configuração base prática com pareamento de DM, allowlist de sala e E2EE ativado:

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

`autoJoin` se aplica a todos os convites do Matrix, incluindo convites no estilo DM. O OpenClaw não consegue classificar de forma confiável
uma sala convidada como DM ou grupo no momento do convite, então todos os convites passam primeiro por `autoJoin`.
`dm.policy` se aplica depois que o bot entra e a sala é classificada como uma DM.

## Prévias em streaming

O streaming de respostas do Matrix é opcional.

Defina `channels.matrix.streaming` como `"partial"` quando quiser que o OpenClaw envie uma única
resposta de prévia ao vivo, edite essa prévia no lugar enquanto o modelo gera texto e depois a finalize quando a
resposta terminar:

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
- `streaming: "partial"` cria uma mensagem de prévia editável para o bloco atual do assistente usando mensagens de texto normais do Matrix. Isso preserva o comportamento legado do Matrix de notificação pela primeira prévia, então clientes padrão podem notificar com base no primeiro texto transmitido em streaming em vez do bloco concluído.
- `streaming: "quiet"` cria uma prévia silenciosa editável para o bloco atual do assistente. Use isso apenas quando você também configurar regras de push do destinatário para edições de prévia finalizadas.
- `blockStreaming: true` ativa mensagens separadas de progresso do Matrix. Com a prévia em streaming ativada, o Matrix mantém o rascunho ao vivo do bloco atual e preserva blocos concluídos como mensagens separadas.
- Quando a prévia em streaming está ativada e `blockStreaming` está desativado, o Matrix edita o rascunho ao vivo no lugar e finaliza esse mesmo evento quando o bloco ou turno termina.
- Se a prévia não couber mais em um único evento do Matrix, o OpenClaw interrompe a prévia em streaming e retorna à entrega final normal.
- Respostas com mídia continuam enviando anexos normalmente. Se uma prévia obsoleta não puder mais ser reutilizada com segurança, o OpenClaw a redige antes de enviar a resposta final com mídia.
- Edições de prévia geram chamadas extras à API do Matrix. Deixe o streaming desativado se quiser o comportamento mais conservador em relação a limite de taxa.

`blockStreaming` não ativa prévias de rascunho por si só.
Use `streaming: "partial"` ou `streaming: "quiet"` para edições de prévia; depois adicione `blockStreaming: true` somente se também quiser que os blocos concluídos do assistente permaneçam visíveis como mensagens separadas de progresso.

Se você precisar de notificações padrão do Matrix sem regras de push personalizadas, use `streaming: "partial"` para comportamento de prévia primeiro ou deixe `streaming` desativado para entrega apenas final. Com `streaming: "off"`:

- `blockStreaming: true` envia cada bloco concluído como uma mensagem normal do Matrix com notificação.
- `blockStreaming: false` envia apenas a resposta final concluída como uma mensagem normal do Matrix com notificação.

### Regras de push auto-hospedadas para prévias silenciosas finalizadas

O streaming silencioso (`streaming: "quiet"`) só notifica os destinatários quando um bloco ou turno é finalizado — uma regra de push por usuário precisa corresponder ao marcador de prévia finalizada. Consulte [regras de push do Matrix para prévias silenciosas](/pt-BR/channels/matrix-push-rules) para a configuração completa (token do destinatário, verificação do pusher, instalação da regra, observações por homeserver).

## Salas bot para bot

Por padrão, mensagens do Matrix de outras contas Matrix do OpenClaw configuradas são ignoradas.

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
- `allowBots: "mentions"` aceita essas mensagens apenas quando elas mencionam visivelmente este bot nas salas. DMs ainda são permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário Matrix para evitar loops de autorresposta.
- O Matrix não expõe aqui uma flag nativa de bot; o OpenClaw trata "de autoria de bot" como "enviado por outra conta Matrix configurada neste Gateway do OpenClaw".

Use allowlists de sala estritas e exigências de menção ao ativar tráfego bot para bot em salas compartilhadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem de saída usam `thumbnail_file`, assim as prévias de imagem são criptografadas junto com o anexo completo. Salas não criptografadas continuam usando `thumbnail_url` simples. Nenhuma configuração é necessária — o Plugin detecta o estado de E2EE automaticamente.

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

Comandos de verificação (todos aceitam `--verbose` para diagnóstico e `--json` para saída legível por máquina):

| Comando                                                        | Finalidade                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Verificar o estado de cross-signing e verificação do dispositivo                    |
| `openclaw matrix verify status --include-recovery-key --json`  | Incluir a recovery key armazenada                                                   |
| `openclaw matrix verify bootstrap`                             | Inicializar cross-signing e verificação (veja abaixo)                               |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Descartar a identidade atual de cross-signing e criar uma nova                      |
| `openclaw matrix verify device "<recovery-key>"`               | Verificar este dispositivo com uma recovery key                                     |
| `openclaw matrix verify backup status`                         | Verificar a integridade do backup de chaves de sala                                 |
| `openclaw matrix verify backup restore`                        | Restaurar chaves de sala do backup do servidor                                      |
| `openclaw matrix verify backup reset --yes`                    | Excluir o backup atual e criar uma nova base inicial (pode recriar o armazenamento secreto) |

Em configurações com múltiplas contas, os comandos CLI do Matrix usam a conta padrão implícita do Matrix, a menos que você passe `--account <id>`.
Se você configurar várias contas nomeadas, defina primeiro `channels.matrix.defaultAccount`; caso contrário, essas operações implícitas da CLI vão parar e pedir que você escolha uma conta explicitamente.
Use `--account` sempre que quiser que operações de verificação ou de dispositivo tenham como alvo explícito uma conta nomeada:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando a criptografia está desativada ou indisponível para uma conta nomeada, os avisos do Matrix e os erros de verificação apontam para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="O que significa verificado">
    O OpenClaw trata um dispositivo como verificado somente quando sua própria identidade de cross-signing o assina. `verify status --verbose` expõe três sinais de confiança:

    - `Locally trusted`: confiável apenas neste cliente
    - `Cross-signing verified`: o SDK informa verificação por cross-signing
    - `Signed by owner`: assinado pela sua própria self-signing key

    `Verified by owner` passa a ser `yes` somente quando cross-signing ou owner-signing estão presentes. Confiança local sozinha não é suficiente.

  </Accordion>

  <Accordion title="O que o bootstrap faz">
    `verify bootstrap` é o comando de reparo e configuração para contas criptografadas. Em ordem, ele:

    - inicializa o armazenamento secreto, reutilizando uma recovery key existente quando possível
    - inicializa o cross-signing e envia chaves públicas de cross-signing ausentes
    - marca e assina com cross-signing o dispositivo atual
    - cria um backup de chaves de sala no servidor, se ainda não existir

    Se o homeserver exigir UIA para enviar chaves de cross-signing, o OpenClaw tenta primeiro sem autenticação, depois `m.login.dummy`, depois `m.login.password` (requer `channels.matrix.password`). Use `--force-reset-cross-signing` somente quando quiser descartar intencionalmente a identidade atual.

  </Accordion>

  <Accordion title="Nova base inicial de backup">
    Se você quiser manter o funcionamento de futuras mensagens criptografadas e aceitar a perda de histórico antigo irrecuperável:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Adicione `--account <id>` para direcionar uma conta nomeada. Isso também pode recriar o armazenamento secreto se o segredo do backup atual não puder ser carregado com segurança.

  </Accordion>

  <Accordion title="Comportamento na inicialização">
    Com `encryption: true`, `startupVerification` usa `"if-unverified"` por padrão. Na inicialização, um dispositivo não verificado solicita autoverificação em outro cliente Matrix, pulando duplicatas e aplicando um tempo de espera. Ajuste com `startupVerificationCooldownHours` ou desative com `startupVerification: "off"`.

    A inicialização também executa uma etapa conservadora de bootstrap de criptografia que reutiliza o armazenamento secreto atual e a identidade de cross-signing atual. Se o estado do bootstrap estiver corrompido, o OpenClaw tenta um reparo protegido mesmo sem `channels.matrix.password`; se o homeserver exigir UIA com senha, a inicialização registra um aviso e permanece não fatal. Dispositivos já assinados pelo proprietário são preservados.

    Consulte [migração do Matrix](/pt-BR/install/migrating-matrix) para o fluxo completo de atualização.

  </Accordion>

  <Accordion title="Avisos de verificação">
    O Matrix publica avisos do ciclo de vida da verificação na DM estrita de verificação como mensagens `m.notice`: solicitação, pronto (com orientação "Verify by emoji"), início/conclusão e detalhes de SAS (emoji/decimal) quando disponíveis.

    Solicitações recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente. Para autoverificação, o OpenClaw inicia o fluxo SAS automaticamente e confirma seu próprio lado assim que a verificação por emoji estiver disponível — você ainda precisa comparar e confirmar "They match" no seu cliente Matrix.

    Avisos do sistema de verificação não são encaminhados para o pipeline de chat do agente.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Dispositivos antigos gerenciados pelo OpenClaw podem se acumular. Liste e remova:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Armazenamento criptográfico">
    O E2EE do Matrix usa o caminho oficial de criptografia Rust do `matrix-js-sdk` com `fake-indexeddb` como shim do IndexedDB. O estado criptográfico persiste em `crypto-idb-snapshot.json` (permissões de arquivo restritivas).

    O estado criptografado em tempo de execução fica em `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e inclui o armazenamento de sincronização, o armazenamento criptográfico, a recovery key, o snapshot do IDB, os bindings de tópico e o estado de verificação na inicialização. Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor raiz existente para que o estado anterior continue visível.

  </Accordion>
</AccordionGroup>

## Gerenciamento de perfil

Atualize o perfil próprio do Matrix para a conta selecionada com:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Adicione `--account <id>` quando quiser direcionar explicitamente uma conta Matrix nomeada.

O Matrix aceita URLs de avatar `mxc://` diretamente. Quando você passa uma URL de avatar `http://` ou `https://`, o OpenClaw primeiro a envia para o Matrix e armazena a URL `mxc://` resolvida de volta em `channels.matrix.avatarUrl` (ou na substituição da conta selecionada).

## Tópicos

O Matrix oferece suporte a tópicos nativos do Matrix tanto para respostas automáticas quanto para envios com ferramentas de mensagem.

- `dm.sessionScope: "per-user"` (padrão) mantém o roteamento de DMs do Matrix com escopo por remetente, para que várias salas de DM possam compartilhar uma sessão quando forem resolvidas para o mesmo par.
- `dm.sessionScope: "per-room"` isola cada sala de DM do Matrix em sua própria chave de sessão, enquanto continua usando verificações normais de autenticação e allowlist de DM.
- Bindings explícitos de conversa do Matrix ainda prevalecem sobre `dm.sessionScope`, portanto salas e tópicos vinculados mantêm a sessão de destino escolhida.
- `threadReplies: "off"` mantém as respostas no nível superior e mantém mensagens recebidas em tópicos na sessão pai.
- `threadReplies: "inbound"` responde dentro de um tópico somente quando a mensagem recebida já estava nesse tópico.
- `threadReplies: "always"` mantém respostas de sala em um tópico enraizado na mensagem que acionou a resposta e roteia essa conversa pela sessão com escopo de tópico correspondente a partir da primeira mensagem que acionou.
- `dm.threadReplies` substitui a configuração de nível superior apenas para DMs. Por exemplo, você pode manter tópicos de sala isolados enquanto mantém DMs simples.
- Mensagens recebidas em tópicos incluem a mensagem raiz do tópico como contexto extra para o agente.
- Envios com ferramentas de mensagem herdam automaticamente o tópico atual do Matrix quando o destino é a mesma sala, ou o mesmo destino de usuário de DM, a menos que um `threadId` explícito seja fornecido.
- A reutilização do mesmo destino de usuário de DM na mesma sessão só entra em ação quando os metadados da sessão atual comprovam o mesmo par de DM na mesma conta Matrix; caso contrário, o OpenClaw volta ao roteamento normal com escopo por usuário.
- Quando o OpenClaw detecta que uma sala de DM do Matrix colide com outra sala de DM na mesma sessão de DM compartilhada do Matrix, ele publica um `m.notice` único nessa sala com a saída `/focus` quando os bindings de tópico estão ativados e a dica `dm.sessionScope`.
- Bindings de tópico em tempo de execução são compatíveis com o Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a tópico funcionam em salas e DMs do Matrix.
- `/focus` no nível superior de sala/DM do Matrix cria um novo tópico do Matrix e o vincula à sessão de destino quando `threadBindings.spawnSubagentSessions=true`.
- Executar `/focus` ou `/acp spawn --thread here` dentro de um tópico existente do Matrix vincula esse tópico atual.

## Bindings de conversa ACP

Salas, DMs e tópicos Matrix existentes podem ser transformados em workspaces ACP duráveis sem mudar a superfície de chat.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM, sala ou tópico existente do Matrix que você quer continuar usando.
- Em uma DM ou sala Matrix de nível superior, a DM/sala atual continua sendo a superfície de chat e as mensagens futuras são roteadas para a sessão ACP criada.
- Dentro de um tópico Matrix existente, `--bind here` vincula esse tópico atual no local.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` encerra a sessão ACP e remove o binding.

Observações:

- `--bind here` não cria um tópico Matrix filho.
- `threadBindings.spawnAcpSessions` é necessário apenas para `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou vincular um tópico Matrix filho.

### Configuração de binding de tópico

O Matrix herda padrões globais de `session.threadBindings` e também oferece suporte a substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

As flags de criação vinculada a tópico do Matrix são opcionais:

- Defina `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` no nível superior crie e vincule novos tópicos Matrix.
- Defina `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sessões ACP a tópicos Matrix.

## Reações

O Matrix oferece suporte a ações de reação de saída, notificações de reação de entrada e reações de confirmação de entrada.

- O uso de reações de saída é controlado por `channels["matrix"].actions.reactions`.
- `react` adiciona uma reação a um evento específico do Matrix.
- `reactions` lista o resumo atual de reações para um evento específico do Matrix.
- `emoji=""` remove as reações da própria conta do bot nesse evento.
- `remove: true` remove apenas a reação do emoji especificado da conta do bot.

O escopo de resolução das reações de confirmação segue a ordem padrão do OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback para emoji de identidade do agente

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

## Contexto de histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala do Matrix aciona o agente. Usa como fallback `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo será `0`. Defina `0` para desativar.
- O histórico de sala do Matrix é somente da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de sala do Matrix é somente pendente: o OpenClaw armazena em buffer mensagens da sala que ainda não acionaram uma resposta e então captura esse intervalo quando uma menção ou outro gatilho chega.
- A mensagem de gatilho atual não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada daquele turno.
- Novas tentativas do mesmo evento do Matrix reutilizam o snapshot original do histórico em vez de avançar para mensagens mais novas da sala.

## Visibilidade de contexto

O Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar de sala, como texto de resposta buscado, raízes de tópico e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido conforme recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist de sala/usuário.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

Essa configuração afeta a visibilidade do contexto suplementar, não se a própria mensagem de entrada pode acionar uma resposta.
A autorização de gatilho ainda vem de `groupPolicy`, `groups`, `groupAllowFrom` e das configurações de política de DM.

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

Consulte [Grupos](/pt-BR/channels/groups) para o comportamento de exigência de menção e allowlist.

Exemplo de pareamento para DMs do Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário Matrix não aprovado continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de pareamento pendente e pode enviar uma resposta de lembrete novamente após um curto tempo de espera, em vez de gerar um novo código.

Consulte [Pareamento](/pt-BR/channels/pairing) para o fluxo compartilhado de pareamento de DM e o layout de armazenamento.

## Reparo direto de sala

Se o estado de mensagem direta ficar fora de sincronia, o OpenClaw pode acabar com mapeamentos `m.direct` desatualizados que apontam para salas individuais antigas em vez da DM ativa. Inspecione o mapeamento atual de um par com:

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

O fluxo de reparo não exclui salas antigas automaticamente. Ele apenas escolhe a DM saudável e atualiza o mapeamento para que novos envios do Matrix, avisos de verificação e outros fluxos de mensagem direta voltem a direcionar para a sala correta.

## Aprovações de exec

O Matrix pode atuar como um cliente nativo de aprovação para uma conta Matrix. Os controles nativos
de roteamento de DM/canal ainda ficam na configuração de aprovação de exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; usa como fallback `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Os aprovadores devem ser IDs de usuário Matrix, como `@owner:example.org`. O Matrix ativa automaticamente aprovações nativas quando `enabled` não está definido ou está como `"auto"` e pelo menos um aprovador pode ser resolvido. Aprovações de exec usam primeiro `execApprovals.approvers` e podem usar como fallback `channels.matrix.dm.allowFrom`. Aprovações de Plugin autorizam por meio de `channels.matrix.dm.allowFrom`. Defina `enabled: false` para desativar explicitamente o Matrix como cliente nativo de aprovação. Caso contrário, solicitações de aprovação recorrem a outras rotas de aprovação configuradas ou à política de fallback de aprovação.

O roteamento nativo do Matrix oferece suporte a ambos os tipos de aprovação:

- `channels.matrix.execApprovals.*` controla o modo nativo de distribuição em DM/canal para prompts de aprovação do Matrix.
- Aprovações de exec usam o conjunto de aprovadores de exec de `execApprovals.approvers` ou `channels.matrix.dm.allowFrom`.
- Aprovações de Plugin usam a allowlist de DM do Matrix de `channels.matrix.dm.allowFrom`.
- Atalhos de reação e atualizações de mensagem do Matrix se aplicam tanto a aprovações de exec quanto de Plugin.

Regras de entrega:

- `target: "dm"` envia prompts de aprovação para as DMs dos aprovadores
- `target: "channel"` envia o prompt de volta para a sala ou DM de origem do Matrix
- `target: "both"` envia para as DMs dos aprovadores e para a sala ou DM de origem do Matrix

Prompts de aprovação do Matrix inicializam atalhos de reação na mensagem principal de aprovação:

- `✅` = permitir uma vez
- `❌` = negar
- `♾️` = permitir sempre quando essa decisão for permitida pela política efetiva de exec

Os aprovadores podem reagir nessa mensagem ou usar os comandos com barra de fallback: `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. Para aprovações de exec, a entrega por canal inclui o texto do comando, então só ative `channel` ou `both` em salas confiáveis.

Substituição por conta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentação relacionada: [Aprovações de exec](/pt-BR/tools/exec-approvals)

## Comandos com barra

Comandos com barra do Matrix (por exemplo, `/new`, `/reset`, `/model`) funcionam diretamente em DMs. Em salas, o OpenClaw também reconhece comandos com barra prefixados pela própria menção Matrix do bot, então `@bot:server /new` aciona o caminho de comando sem precisar de uma regex de menção personalizada. Isso mantém o bot responsivo a postagens em salas no estilo `@mention /command` que o Element e clientes semelhantes emitem quando um usuário completa o bot com tab antes de digitar o comando.

As regras de autorização ainda se aplicam: remetentes de comandos devem satisfazer políticas de proprietário ou allowlist de DM ou sala, assim como mensagens simples.

## Múltiplas contas

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
Você pode limitar entradas de sala herdadas a uma conta Matrix com `groups.<room>.account`.
Entradas sem `account` permanecem compartilhadas entre todas as contas Matrix, e entradas com `account: "default"` ainda funcionam quando a conta padrão está configurada diretamente no nível superior em `channels.matrix.*`.
Padrões parciais compartilhados de autenticação não criam por si só uma conta padrão implícita separada. O OpenClaw só sintetiza a conta `default` de nível superior quando esse padrão tem autenticação nova (`homeserver` mais `accessToken`, ou `homeserver` mais `userId` e `password`); contas nomeadas ainda podem permanecer detectáveis a partir de `homeserver` mais `userId` quando credenciais em cache satisfazem a autenticação posteriormente.
Se o Matrix já tiver exatamente uma conta nomeada, ou `defaultAccount` apontar para uma chave de conta nomeada existente, a promoção de reparo/configuração de conta única para múltiplas contas preserva essa conta em vez de criar uma nova entrada `accounts.default`. Apenas chaves de autenticação/bootstrap do Matrix são movidas para essa conta promovida; chaves compartilhadas de política de entrega permanecem no nível superior.
Defina `defaultAccount` quando quiser que o OpenClaw prefira uma conta Matrix nomeada para roteamento implícito, sondagem e operações de CLI.
Se várias contas Matrix estiverem configuradas e um ID de conta for `default`, o OpenClaw usará essa conta implicitamente mesmo quando `defaultAccount` não estiver definido.
Se você configurar várias contas nomeadas, defina `defaultAccount` ou passe `--account <id>` para comandos de CLI que dependem de seleção implícita de conta.
Passe `--account <id>` para `openclaw matrix verify ...` e `openclaw matrix devices ...` quando quiser substituir essa seleção implícita em um comando.

Consulte [Referência de configuração](/pt-BR/gateway/config-channels#multi-account-all-channels) para o padrão compartilhado de múltiplas contas.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers Matrix privados/internos para proteção contra SSRF, a menos que você
opte explicitamente por isso por conta.

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

Exemplo de configuração via CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Essa opção só permite destinos privados/internos confiáveis. Homeservers públicos em texto sem criptografia, como
`http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Uso de proxy para tráfego Matrix

Se a sua implantação do Matrix precisar de um proxy HTTP(S) de saída explícito, defina `channels.matrix.proxy`:

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
O OpenClaw usa a mesma configuração de proxy para o tráfego Matrix em tempo de execução e para sondagens de status da conta.

## Resolução de destino

O Matrix aceita estes formatos de destino em qualquer lugar em que o OpenClaw pedir um destino de sala ou usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

A busca ativa no diretório usa a conta Matrix autenticada:

- Buscas de usuário consultam o diretório de usuários Matrix nesse homeserver.
- Buscas de sala aceitam IDs e aliases de sala explícitos diretamente e, depois, recorrem à busca por nomes de salas ingressadas para essa conta.
- A busca por nome de sala ingressada é feita no melhor esforço. Se um nome de sala não puder ser resolvido para um ID ou alias, ele será ignorado pela resolução de allowlist em tempo de execução.

## Referência de configuração

- `enabled`: ativa ou desativa o canal.
- `name`: rótulo opcional para a conta.
- `defaultAccount`: ID de conta preferido quando várias contas Matrix estiverem configuradas.
- `homeserver`: URL do homeserver, por exemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta Matrix se conecte a homeservers privados/internos. Ative isto quando o homeserver for resolvido para `localhost`, um IP de LAN/Tailscale ou um host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para tráfego Matrix. Contas nomeadas podem substituir o padrão de nível superior com seu próprio `proxy`.
- `userId`: ID completo de usuário Matrix, por exemplo `@bot:example.org`.
- `accessToken`: token de acesso para autenticação baseada em token. Valores em texto simples e valores SecretRef são compatíveis com `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` nos provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).
- `password`: senha para login baseado em senha. Valores em texto simples e valores SecretRef são compatíveis.
- `deviceId`: ID explícito do dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo para login com senha.
- `avatarUrl`: URL armazenada do próprio avatar para sincronização de perfil e atualizações de `profile set`.
- `initialSyncLimit`: número máximo de eventos buscados durante a sincronização na inicialização.
- `encryption`: ativa E2EE.
- `allowlistOnly`: quando `true`, atualiza a política de sala `open` para `allowlist` e força todas as políticas de DM ativas, exceto `disabled` (incluindo `pairing` e `open`), para `allowlist`. Não afeta políticas `disabled`.
- `allowBots`: permite mensagens de outras contas Matrix configuradas do OpenClaw (`true` ou `"mentions"`).
- `groupPolicy`: `open`, `allowlist` ou `disabled`.
- `contextVisibility`: modo de visibilidade de contexto suplementar da sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist de IDs de usuário para tráfego de sala. IDs completos de usuário Matrix são mais seguros; correspondências exatas do diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `historyLimit`: máximo de mensagens de sala a incluir como contexto de histórico de grupo. Usa como fallback `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo será `0`. Defina `0` para desativar.
- `replyToMode`: `off`, `first`, `all` ou `batched`.
- `markdown`: configuração opcional de renderização Markdown para texto Matrix de saída.
- `streaming`: `off` (padrão), `"partial"`, `"quiet"`, `true` ou `false`. `"partial"` e `true` ativam atualizações de rascunho com prévia primeiro usando mensagens de texto normais do Matrix. `"quiet"` usa avisos de prévia sem notificação para configurações auto-hospedadas com regras de push. `false` é equivalente a `"off"`.
- `blockStreaming`: `true` ativa mensagens separadas de progresso para blocos concluídos do assistente enquanto o streaming de prévia de rascunho está ativo.
- `threadReplies`: `off`, `inbound` ou `always`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessão vinculados a tópicos.
- `startupVerification`: modo automático de solicitação de autoverificação na inicialização (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: tempo de espera antes de tentar novamente solicitações automáticas de verificação na inicialização.
- `textChunkLimit`: tamanho do bloco de mensagem de saída em caracteres (aplica-se quando `chunkMode` é `length`).
- `chunkMode`: `length` divide mensagens por contagem de caracteres; `newline` divide nos limites de linha.
- `responsePrefix`: string opcional adicionada no início de todas as respostas de saída para este canal.
- `ackReaction`: substituição opcional de reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição opcional de escopo de reação de confirmação (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificação de reação de entrada (`own`, `off`).
- `mediaMaxMb`: limite de tamanho de mídia em MB para envios de saída e processamento de mídia de entrada.
- `autoJoin`: política de entrada automática por convite (`always`, `allowlist`, `off`). Padrão: `off`. Aplica-se a todos os convites Matrix, incluindo convites no estilo DM.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `allowlist`. Entradas de alias são resolvidas para IDs de sala durante o tratamento do convite; o OpenClaw não confia no estado de alias informado pela sala convidada.
- `dm`: bloco de política de DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla o acesso por DM depois que o OpenClaw entrou na sala e a classificou como DM. Não altera se um convite entra automaticamente.
- `dm.allowFrom`: allowlist de IDs de usuário para tráfego de DM. IDs completos de usuário Matrix são mais seguros; correspondências exatas do diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `dm.sessionScope`: `per-user` (padrão) ou `per-room`. Use `per-room` quando quiser que cada sala de DM do Matrix mantenha contexto separado mesmo que o par seja o mesmo.
- `dm.threadReplies`: substituição de política de tópico somente para DM (`off`, `inbound`, `always`). Ela substitui a configuração `threadReplies` de nível superior tanto para posicionamento de resposta quanto para isolamento de sessão em DMs.
- `execApprovals`: entrega nativa de aprovações de exec no Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuário Matrix com permissão para aprovar solicitações de exec. Opcional quando `dm.allowFrom` já identifica os aprovadores.
- `execApprovals.target`: `dm | channel | both` (padrão: `dm`).
- `accounts`: substituições nomeadas por conta. Valores de nível superior em `channels.matrix` atuam como padrões para essas entradas.
- `groups`: mapa de política por sala. Prefira IDs de sala ou aliases; nomes de sala não resolvidos são ignorados em tempo de execução. A identidade de sessão/grupo usa o ID de sala estável após a resolução.
- `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta Matrix específica em configurações com múltiplas contas.
- `groups.<room>.allowBots`: substituição em nível de sala para remetentes de bot configurados (`true` ou `"mentions"`).
- `groups.<room>.users`: allowlist de remetentes por sala.
- `groups.<room>.tools`: substituições por sala de permitir/negar ferramentas.
- `groups.<room>.autoReply`: substituição em nível de sala para exigência de menção. `true` desativa exigências de menção para essa sala; `false` volta a ativá-las.
- `groups.<room>.skills`: filtro opcional de Skills por sala.
- `groups.<room>.systemPrompt`: trecho opcional de prompt de sistema por sala.
- `rooms`: alias legado para `groups`.
- `actions`: controle por ação para ferramentas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
