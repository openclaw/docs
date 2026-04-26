---
read_when:
    - Configurando o Matrix no OpenClaw
    - Configurando E2EE e verificação do Matrix
summary: Status de suporte, configuração inicial e exemplos de configuração do Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix é um plugin de canal empacotado para o OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a DMs, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Plugin empacotado

O Matrix é distribuído como um plugin empacotado nas versões atuais do OpenClaw, portanto compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Matrix, instale-o manualmente:

Instalar via npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulte [Plugins](/pt-BR/tools/plugin) para o comportamento de plugins e regras de instalação.

## Configuração inicial

1. Garanta que o plugin Matrix esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta Matrix no seu homeserver.
3. Configure `channels.matrix` com um destes formatos:
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Reinicie o gateway.
5. Inicie uma DM com o bot ou convide-o para uma sala.
   - Convites Matrix novos só funcionam quando `channels.matrix.autoJoin` permite isso.

Caminhos de configuração interativa:

```bash
openclaw channels add
openclaw configure --section channels
```

O assistente do Matrix solicita:

- URL do homeserver
- método de autenticação: token de acesso ou senha
- ID de usuário (somente autenticação por senha)
- nome opcional do dispositivo
- se deve habilitar E2EE
- se deve configurar acesso à sala e entrada automática por convite

Comportamentos principais do assistente:

- Se as variáveis de ambiente de autenticação do Matrix já existirem e essa conta ainda não tiver autenticação salva na configuração, o assistente oferece um atalho de env para manter a autenticação nas variáveis de ambiente.
- Os nomes de conta são normalizados para o ID da conta. Por exemplo, `Ops Bot` se torna `ops-bot`.
- Entradas de allowlist de DM aceitam `@user:server` diretamente; nomes de exibição só funcionam quando a busca em diretório em tempo real encontra uma correspondência exata.
- Entradas de allowlist de sala aceitam IDs e aliases de sala diretamente. Prefira `!room:server` ou `#alias:server`; nomes não resolvidos são ignorados em tempo de execução pela resolução da allowlist.
- No modo de allowlist de entrada automática por convite, use apenas destinos de convite estáveis: `!roomId:server`, `#alias:server` ou `*`. Nomes simples de sala são rejeitados.
- Para resolver nomes de sala antes de salvar, use `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` usa `off` por padrão.

Se você deixá-lo sem definir, o bot não entrará em salas convidadas nem em novos convites no estilo DM, portanto ele não aparecerá em novos grupos ou DMs por convite, a menos que você entre manualmente primeiro.

Defina `autoJoin: "allowlist"` junto com `autoJoinAllowlist` para restringir quais convites ele aceita, ou defina `autoJoin: "always"` se quiser que ele entre em todo convite.

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

Entrar em todo convite:

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

Para contas não padrão, use variáveis de ambiente com escopo de conta:

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

O Matrix escapa pontuação nos IDs de conta para manter variáveis de ambiente com escopo livres de colisão.
Por exemplo, `-` se torna `_X2D_`, então `ops-prod` mapeia para `MATRIX_OPS_X2D_PROD_*`.

O assistente interativo só oferece o atalho de variável de ambiente quando essas variáveis de autenticação já estão presentes e a conta selecionada ainda não tem autenticação Matrix salva na configuração.

`MATRIX_HOMESERVER` não pode ser definido a partir de um `.env` do workspace; consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Exemplo de configuração

Esta é uma configuração base prática com emparelhamento de DM, allowlist de sala e E2EE habilitado:

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

`autoJoin` se aplica a todos os convites Matrix, incluindo convites no estilo DM. O OpenClaw não consegue classificar de forma confiável uma sala convidada como DM ou grupo no momento do convite, então todos os convites passam primeiro por `autoJoin`. `dm.policy` se aplica depois que o bot entra e a sala é classificada como DM.

## Visualizações de streaming

O streaming de respostas do Matrix é opt-in.

Defina `channels.matrix.streaming` como `"partial"` quando quiser que o OpenClaw envie uma única resposta de pré-visualização ao vivo, edite essa pré-visualização no mesmo lugar enquanto o modelo gera texto e depois a finalize quando a resposta terminar:

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
- `streaming: "partial"` cria uma mensagem de pré-visualização editável para o bloco atual do assistente usando mensagens de texto normais do Matrix. Isso preserva o comportamento legado do Matrix de notificação primeiro na pré-visualização, então clientes padrão podem notificar com base no primeiro texto transmitido em streaming em vez do bloco concluído.
- `streaming: "quiet"` cria um aviso silencioso editável para a pré-visualização atual do bloco do assistente. Use isso somente quando você também configurar regras de push do destinatário para edições finalizadas da pré-visualização.
- `blockStreaming: true` habilita mensagens de progresso separadas no Matrix. Com streaming de pré-visualização habilitado, o Matrix mantém o rascunho ao vivo para o bloco atual e preserva blocos concluídos como mensagens separadas.
- Quando o streaming de pré-visualização está ativado e `blockStreaming` está desativado, o Matrix edita o rascunho ao vivo no mesmo lugar e finaliza esse mesmo evento quando o bloco ou turno termina.
- Se a pré-visualização deixar de caber em um único evento Matrix, o OpenClaw interrompe o streaming da pré-visualização e volta à entrega final normal.
- Respostas com mídia ainda enviam anexos normalmente. Se uma pré-visualização obsoleta não puder mais ser reutilizada com segurança, o OpenClaw a redige antes de enviar a resposta final com mídia.
- Edições de pré-visualização geram chamadas extras para a API do Matrix. Deixe o streaming desativado se quiser o comportamento mais conservador em relação a limite de taxa.

`blockStreaming` não habilita visualizações em rascunho por si só.
Use `streaming: "partial"` ou `streaming: "quiet"` para edições de pré-visualização; depois adicione `blockStreaming: true` somente se também quiser que blocos concluídos do assistente permaneçam visíveis como mensagens de progresso separadas.

Se você precisar de notificações padrão do Matrix sem regras de push personalizadas, use `streaming: "partial"` para comportamento de pré-visualização primeiro ou deixe `streaming` desativado para entrega somente final. Com `streaming: "off"`:

- `blockStreaming: true` envia cada bloco concluído como uma mensagem Matrix normal com notificação.
- `blockStreaming: false` envia apenas a resposta final concluída como uma mensagem Matrix normal com notificação.

### Regras de push auto-hospedadas para pré-visualizações silenciosas finalizadas

O streaming silencioso (`streaming: "quiet"`) só notifica destinatários quando um bloco ou turno é finalizado — uma regra de push por usuário precisa corresponder ao marcador da pré-visualização finalizada. Consulte [Regras de push do Matrix para pré-visualizações silenciosas](/pt-BR/channels/matrix-push-rules) para a configuração completa (token do destinatário, verificação do pusher, instalação da regra, observações por homeserver).

## Salas bot-para-bot

Por padrão, mensagens Matrix de outras contas Matrix do OpenClaw configuradas são ignoradas.

Use `allowBots` quando quiser intencionalmente tráfego Matrix entre agentes:

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
- `allowBots: "mentions"` aceita essas mensagens somente quando elas mencionam visivelmente este bot nas salas. DMs continuam permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário Matrix para evitar loops de autorresposta.
- O Matrix não expõe aqui um sinalizador nativo de bot; o OpenClaw trata "de autoria de bot" como "enviado por outra conta Matrix configurada neste gateway OpenClaw".

Use allowlists de sala estritas e requisitos de menção ao habilitar tráfego bot-para-bot em salas compartilhadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem de saída usam `thumbnail_file` para que pré-visualizações de imagem sejam criptografadas junto com o anexo completo. Salas não criptografadas continuam usando `thumbnail_url` simples. Nenhuma configuração é necessária — o plugin detecta automaticamente o estado de E2EE.

Habilitar criptografia:

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

Diagnósticos detalhados de bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forçar uma nova redefinição da identidade de cross-signing antes do bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verificar este dispositivo com uma chave de recuperação:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Este comando informa três estados separados:

- `Recovery key accepted`: o Matrix aceitou a chave de recuperação para armazenamento secreto ou confiança no dispositivo.
- `Backup usable`: o backup de chaves de sala pode ser carregado com material de recuperação confiável.
- `Device verified by owner`: o dispositivo atual do OpenClaw tem confiança total na identidade de cross-signing do Matrix.

`Signed by owner` na saída detalhada ou JSON é apenas diagnóstico. O OpenClaw não
trata isso como suficiente a menos que `Cross-signing verified` também seja `yes`.

O comando ainda termina com código diferente de zero quando a confiança total na identidade Matrix está incompleta,
mesmo que a chave de recuperação possa desbloquear material de backup. Nesse caso, conclua
a autoverificação em outro cliente Matrix:

```bash
openclaw matrix verify self
```

Aceite a solicitação em outro cliente Matrix, compare os emoji SAS ou os decimais,
e digite `yes` somente quando eles corresponderem. O comando espera o Matrix informar
`Cross-signing verified: yes` antes de sair com sucesso.

Use `verify bootstrap --force-reset-cross-signing` somente quando você quiser
intencionalmente substituir a identidade atual de cross-signing.

Detalhes detalhados de verificação do dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Verificar a integridade do backup de chaves de sala:

```bash
openclaw matrix verify backup status
```

Diagnósticos detalhados da integridade do backup:

```bash
openclaw matrix verify backup status --verbose
```

Restaurar chaves de sala do backup do servidor:

```bash
openclaw matrix verify backup restore
```

Se a chave de backup ainda não estiver carregada em disco, passe a chave de recuperação do Matrix:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Fluxo interativo de autoverificação:

```bash
openclaw matrix verify self
```

Para solicitações de verificação de nível mais baixo ou recebidas, use:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Use `openclaw matrix verify cancel <id>` para cancelar uma solicitação.

Diagnósticos detalhados de restauração:

```bash
openclaw matrix verify backup restore --verbose
```

Excluir o backup atual do servidor e criar uma nova linha de base de backup. Se a chave de
backup armazenada não puder ser carregada corretamente, essa redefinição também poderá recriar o armazenamento secreto para que
inicializações frias futuras possam carregar a nova chave de backup:

```bash
openclaw matrix verify backup reset --yes
```

Todos os comandos `verify` são concisos por padrão (incluindo logging interno silencioso do SDK) e mostram diagnósticos detalhados somente com `--verbose`.
Use `--json` para saída completa legível por máquina ao criar scripts.

Em configurações com várias contas, os comandos Matrix da CLI usam a conta padrão implícita do Matrix, a menos que você passe `--account <id>`.
Se você configurar várias contas nomeadas, defina primeiro `channels.matrix.defaultAccount`, ou essas operações implícitas da CLI irão parar e pedir que você escolha uma conta explicitamente.
Use `--account` sempre que quiser que operações de verificação ou de dispositivo tenham como alvo explicitamente uma conta nomeada:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando a criptografia estiver desabilitada ou indisponível para uma conta nomeada, avisos do Matrix e erros de verificação apontam para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="O que significa verificado">
    O OpenClaw trata um dispositivo como verificado somente quando sua própria identidade de cross-signing o assina. `verify status --verbose` expõe três sinais de confiança:

    - `Locally trusted`: confiável apenas para este cliente
    - `Cross-signing verified`: o SDK informa verificação via cross-signing
    - `Signed by owner`: assinado pela sua própria chave de self-signing

    `Verified by owner` torna-se `yes` somente quando a verificação por cross-signing está presente.
    Confiança local ou uma assinatura do proprietário por si só não são suficientes para o OpenClaw tratar
    o dispositivo como totalmente verificado.

  </Accordion>

  <Accordion title="O que o bootstrap faz">
    `verify bootstrap` é o comando de reparo e configuração para contas criptografadas. Em ordem, ele:

    - faz bootstrap do armazenamento secreto, reutilizando uma chave de recuperação existente quando possível
    - faz bootstrap do cross-signing e envia chaves públicas de cross-signing ausentes
    - marca e faz cross-sign no dispositivo atual
    - cria um backup de chaves de sala no servidor se ainda não existir um

    Se o homeserver exigir UIA para enviar chaves de cross-signing, o OpenClaw tenta primeiro sem autenticação, depois `m.login.dummy` e em seguida `m.login.password` (requer `channels.matrix.password`). Use `--force-reset-cross-signing` somente quando quiser descartar intencionalmente a identidade atual.

  </Accordion>

  <Accordion title="Nova linha de base de backup">
    Se você quiser manter futuras mensagens criptografadas funcionando e aceitar perder histórico antigo irrecuperável:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Adicione `--account <id>` para ter como alvo uma conta nomeada. Isso também pode recriar o armazenamento secreto se o segredo de backup atual não puder ser carregado com segurança.
    Adicione `--rotate-recovery-key` somente quando quiser intencionalmente que a chave de recuperação antiga
    deixe de desbloquear a nova linha de base de backup.

  </Accordion>

  <Accordion title="Comportamento na inicialização">
    Com `encryption: true`, `startupVerification` usa `"if-unverified"` por padrão. Na inicialização, um dispositivo não verificado solicita autoverificação em outro cliente Matrix, pulando duplicatas e aplicando um período de espera. Ajuste com `startupVerificationCooldownHours` ou desabilite com `startupVerification: "off"`.

    A inicialização também executa uma passada conservadora de bootstrap de criptografia que reutiliza o armazenamento secreto atual e a identidade atual de cross-signing. Se o estado de bootstrap estiver corrompido, o OpenClaw tentará um reparo protegido mesmo sem `channels.matrix.password`; se o homeserver exigir UIA com senha, a inicialização registrará um aviso e permanecerá não fatal. Dispositivos já assinados pelo proprietário são preservados.

    Consulte [Migração do Matrix](/pt-BR/install/migrating-matrix) para o fluxo completo de atualização.

  </Accordion>

  <Accordion title="Avisos de verificação">
    O Matrix publica avisos de ciclo de vida da verificação na DM estrita de verificação como mensagens `m.notice`: solicitação, pronto (com orientação "Verify by emoji"), início/conclusão e detalhes SAS (emoji/decimal) quando disponíveis.

    Solicitações recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente. Para autoverificação, o OpenClaw inicia o fluxo SAS automaticamente e confirma seu próprio lado assim que a verificação por emoji estiver disponível — você ainda precisa comparar e confirmar "They match" no seu cliente Matrix.

    Avisos do sistema de verificação não são encaminhados para o pipeline de chat do agente.

  </Accordion>

  <Accordion title="Dispositivo Matrix excluído ou inválido">
    Se `verify status` disser que o dispositivo atual não está mais listado no
    homeserver, crie um novo dispositivo Matrix do OpenClaw. Para login com senha:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticação por token, crie um novo token de acesso no seu cliente Matrix ou na interface de administração,
    depois atualize o OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Substitua `assistant` pelo ID da conta do comando com falha, ou omita
    `--account` para a conta padrão.

  </Accordion>

  <Accordion title="Higiene do dispositivo">
    Dispositivos antigos gerenciados pelo OpenClaw podem se acumular. Liste e remova os obsoletos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Armazenamento de criptografia">
    O Matrix E2EE usa o caminho oficial de criptografia Rust do `matrix-js-sdk` com `fake-indexeddb` como shim do IndexedDB. O estado de criptografia persiste em `crypto-idb-snapshot.json` (com permissões restritivas de arquivo).

    O estado criptografado em tempo de execução fica em `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e inclui o armazenamento de sincronização, armazenamento de criptografia, chave de recuperação, snapshot de IDB, vinculações de thread e estado de verificação na inicialização. Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor raiz existente para que o estado anterior continue visível.

  </Accordion>
</AccordionGroup>

## Gerenciamento de perfil

Atualize o autoprofile do Matrix para a conta selecionada com:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Adicione `--account <id>` quando quiser ter como alvo explicitamente uma conta Matrix nomeada.

O Matrix aceita URLs de avatar `mxc://` diretamente. Quando você passa uma URL de avatar `http://` ou `https://`, o OpenClaw primeiro a envia para o Matrix e armazena de volta a URL `mxc://` resolvida em `channels.matrix.avatarUrl` (ou na substituição da conta selecionada).

## Threads

O Matrix oferece suporte a threads nativas do Matrix tanto para respostas automáticas quanto para envios da ferramenta de mensagem.

- `dm.sessionScope: "per-user"` (padrão) mantém o roteamento de DM do Matrix com escopo por remetente, de modo que várias salas de DM possam compartilhar uma sessão quando forem resolvidas para o mesmo par.
- `dm.sessionScope: "per-room"` isola cada sala de DM do Matrix em sua própria chave de sessão, enquanto ainda usa autenticação normal de DM e verificações de allowlist.
- Vinculações explícitas de conversa do Matrix ainda têm precedência sobre `dm.sessionScope`, portanto salas e threads vinculadas mantêm a sessão de destino escolhida.
- `threadReplies: "off"` mantém respostas no nível superior e mantém mensagens recebidas em thread na sessão pai.
- `threadReplies: "inbound"` responde dentro de uma thread somente quando a mensagem recebida já estava nessa thread.
- `threadReplies: "always"` mantém respostas de sala em uma thread enraizada na mensagem que disparou a ação e roteia essa conversa pela sessão com escopo de thread correspondente desde a primeira mensagem disparadora.
- `dm.threadReplies` substitui a configuração de nível superior somente para DMs. Por exemplo, você pode manter threads de sala isoladas enquanto mantém DMs sem threads.
- Mensagens recebidas em thread incluem a mensagem raiz da thread como contexto extra para o agente.
- Envios da ferramenta de mensagem herdam automaticamente a thread atual do Matrix quando o destino é a mesma sala, ou o mesmo destino de usuário em DM, a menos que um `threadId` explícito seja fornecido.
- A reutilização do mesmo destino de usuário DM na mesma sessão só entra em ação quando os metadados atuais da sessão comprovam o mesmo par de DM na mesma conta Matrix; caso contrário, o OpenClaw volta ao roteamento normal com escopo por usuário.
- Quando o OpenClaw detecta que uma sala de DM do Matrix colide com outra sala de DM na mesma sessão de DM compartilhada do Matrix, ele publica um `m.notice` único nessa sala com a rota de escape `/focus` quando vinculações de thread estão habilitadas e a dica `dm.sessionScope`.
- Vinculações de thread em tempo de execução são suportadas no Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a thread funcionam em salas e DMs do Matrix.
- `/focus` no nível superior de uma sala/DM do Matrix cria uma nova thread do Matrix e a vincula à sessão de destino quando `threadBindings.spawnSubagentSessions=true`.
- Executar `/focus` ou `/acp spawn --thread here` dentro de uma thread Matrix existente vincula essa thread atual no lugar.

## Vinculações de conversa ACP

Salas, DMs e threads Matrix existentes podem ser transformadas em workspaces ACP duráveis sem alterar a superfície de chat.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM, sala ou thread existente do Matrix que você quer continuar usando.
- Em uma DM ou sala Matrix de nível superior, a DM/sala atual continua sendo a superfície de chat e mensagens futuras são roteadas para a sessão ACP criada.
- Dentro de uma thread Matrix existente, `--bind here` vincula essa thread atual no lugar.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no lugar.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Observações:

- `--bind here` não cria uma thread Matrix filha.
- `threadBindings.spawnAcpSessions` só é necessário para `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou vincular uma thread Matrix filha.

### Configuração de vinculação de thread

O Matrix herda padrões globais de `session.threadBindings` e também oferece suporte a substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

As flags de criação vinculada a thread do Matrix são opt-in:

- Defina `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` no nível superior crie e vincule novas threads Matrix.
- Defina `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sessões ACP a threads Matrix.

## Reações

O Matrix oferece suporte a ações de reação de saída, notificações de reação recebidas e reações de confirmação recebidas.

- O uso de reações de saída em ferramentas é controlado por `channels["matrix"].actions.reactions`.
- `react` adiciona uma reação a um evento Matrix específico.
- `reactions` lista o resumo atual de reações para um evento Matrix específico.
- `emoji=""` remove as reações da própria conta do bot nesse evento.
- `remove: true` remove apenas a reação do emoji especificado da conta do bot.

As reações de confirmação usam a ordem de resolução padrão do OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback para o emoji de identidade do agente

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
- `reactionNotifications: "off"` desabilita eventos de sistema de reação.
- Remoções de reação não são sintetizadas em eventos de sistema porque o Matrix as expõe como redações, não como remoções independentes de `m.reaction`.

## Contexto de histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala do Matrix aciona o agente. Usa fallback para `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo será `0`. Defina `0` para desabilitar.
- O histórico de salas do Matrix é apenas da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de salas do Matrix é apenas pendente: o OpenClaw coloca em buffer mensagens da sala que ainda não acionaram uma resposta, depois faz um snapshot dessa janela quando uma menção ou outro gatilho chega.
- A mensagem atual que acionou o gatilho não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada daquele turno.
- Novas tentativas do mesmo evento Matrix reutilizam o snapshot de histórico original em vez de avançar para mensagens mais novas da sala.

## Visibilidade de contexto

O Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar da sala, como texto de resposta buscado, raízes de thread e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist de sala/usuário.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta explicitamente citada.

Essa configuração afeta a visibilidade do contexto suplementar, não se a própria mensagem recebida pode acionar uma resposta.
A autorização do gatilho ainda vem de `groupPolicy`, `groups`, `groupAllowFrom` e das configurações de política de DM.

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

Consulte [Grupos](/pt-BR/channels/groups) para o comportamento de menção obrigatória e allowlist.

Exemplo de emparelhamento para DMs do Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário Matrix não aprovado continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de emparelhamento pendente e pode enviar novamente uma resposta de lembrete após um curto período de espera, em vez de gerar um novo código.

Consulte [Pairing](/pt-BR/channels/pairing) para o fluxo compartilhado de emparelhamento de DM e layout de armazenamento.

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
- cria uma nova sala direta e regrava `m.direct` se não existir uma DM saudável

O fluxo de reparo não exclui salas antigas automaticamente. Ele apenas escolhe a DM saudável e atualiza o mapeamento para que novos envios do Matrix, avisos de verificação e outros fluxos de mensagem direta voltem a ter como destino a sala correta.

## Aprovações de execução

O Matrix pode atuar como um cliente nativo de aprovação para uma conta Matrix. Os controles nativos
de roteamento de DM/canal ainda ficam na configuração de aprovação de execução:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; usa fallback para `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Aprovadores devem ser IDs de usuário Matrix, como `@owner:example.org`. O Matrix habilita automaticamente aprovações nativas quando `enabled` não está definido ou está como `"auto"` e pelo menos um aprovador pode ser resolvido. Aprovações de execução usam primeiro `execApprovals.approvers` e podem usar fallback para `channels.matrix.dm.allowFrom`. Aprovações de plugin autorizam por meio de `channels.matrix.dm.allowFrom`. Defina `enabled: false` para desabilitar explicitamente o Matrix como cliente nativo de aprovação. Caso contrário, solicitações de aprovação usam fallback para outras rotas de aprovação configuradas ou para a política de fallback de aprovação.

O roteamento nativo do Matrix oferece suporte a ambos os tipos de aprovação:

- `channels.matrix.execApprovals.*` controla o modo nativo de distribuição para DM/canal dos prompts de aprovação do Matrix.
- Aprovações de execução usam o conjunto de aprovadores de execução de `execApprovals.approvers` ou `channels.matrix.dm.allowFrom`.
- Aprovações de plugin usam a allowlist de DM do Matrix em `channels.matrix.dm.allowFrom`.
- Atalhos de reação do Matrix e atualizações de mensagem se aplicam tanto a aprovações de execução quanto de plugin.

Regras de entrega:

- `target: "dm"` envia prompts de aprovação para DMs dos aprovadores
- `target: "channel"` envia o prompt de volta para a sala ou DM Matrix de origem
- `target: "both"` envia para as DMs dos aprovadores e para a sala ou DM Matrix de origem

Prompts de aprovação do Matrix inicializam atalhos de reação na mensagem principal de aprovação:

- `✅` = permitir uma vez
- `❌` = negar
- `♾️` = permitir sempre quando essa decisão for permitida pela política efetiva de execução

Os aprovadores podem reagir nessa mensagem ou usar os comandos slash de fallback: `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. Para aprovações de execução, a entrega no canal inclui o texto do comando, portanto só habilite `channel` ou `both` em salas confiáveis.

Substituição por conta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentação relacionada: [Aprovações de execução](/pt-BR/tools/exec-approvals)

## Comandos slash

Os comandos slash do Matrix (por exemplo `/new`, `/reset`, `/model`) funcionam diretamente em DMs. Em salas, o OpenClaw também reconhece comandos slash prefixados com a própria menção Matrix do bot, então `@bot:server /new` aciona o caminho de comando sem precisar de uma regex de menção personalizada. Isso mantém o bot responsivo a postagens no estilo de sala `@mention /command` que Element e clientes semelhantes emitem quando um usuário completa automaticamente o bot antes de digitar o comando.

As regras de autorização continuam valendo: remetentes de comandos devem satisfazer políticas de allowlist/proprietário de DM ou sala, assim como mensagens simples.

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
Você pode aplicar entradas de sala herdadas a uma conta Matrix com `groups.<room>.account`.
Entradas sem `account` permanecem compartilhadas entre todas as contas Matrix, e entradas com `account: "default"` ainda funcionam quando a conta padrão é configurada diretamente no nível superior de `channels.matrix.*`.
Padrões parciais de autenticação compartilhada não criam por si só uma conta padrão implícita separada. O OpenClaw só sintetiza a conta `default` de nível superior quando esse padrão tiver autenticação nova (`homeserver` mais `accessToken`, ou `homeserver` mais `userId` e `password`); contas nomeadas ainda podem permanecer detectáveis a partir de `homeserver` mais `userId` quando credenciais em cache satisfizerem a autenticação depois.
Se o Matrix já tiver exatamente uma conta nomeada, ou `defaultAccount` apontar para uma chave de conta nomeada existente, a promoção de reparo/configuração de conta única para várias contas preserva essa conta em vez de criar uma nova entrada `accounts.default`. Apenas chaves de autenticação/bootstrap do Matrix são movidas para essa conta promovida; chaves compartilhadas de política de entrega permanecem no nível superior.
Defina `defaultAccount` quando quiser que o OpenClaw prefira uma conta Matrix nomeada para roteamento implícito, sondagem e operações de CLI.
Se várias contas Matrix estiverem configuradas e um ID de conta for `default`, o OpenClaw usará essa conta implicitamente mesmo quando `defaultAccount` não estiver definido.
Se você configurar várias contas nomeadas, defina `defaultAccount` ou passe `--account <id>` para comandos da CLI que dependem de seleção implícita de conta.
Passe `--account <id>` para `openclaw matrix verify ...` e `openclaw matrix devices ...` quando quiser substituir essa seleção implícita para um comando.

Consulte [Referência de configuração](/pt-BR/gateway/config-channels#multi-account-all-channels) para o padrão compartilhado de várias contas.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers Matrix privados/internos para proteção contra SSRF, a menos que você
opte explicitamente por isso por conta.

Se o seu homeserver estiver em localhost, em um IP de LAN/Tailscale ou em um hostname interno, habilite
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

Essa opção de adesão permite apenas destinos privados/internos confiáveis. Homeservers públicos em texto claro, como
`http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Uso de proxy para tráfego Matrix

Se sua implantação Matrix exigir um proxy HTTP(S) de saída explícito, defina `channels.matrix.proxy`:

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
O OpenClaw usa a mesma configuração de proxy para tráfego Matrix em tempo de execução e sondas de status da conta.

## Resolução de destino

O Matrix aceita estes formatos de destino sempre que o OpenClaw pedir um destino de sala ou usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Use a capitalização exata do ID de sala do Matrix
ao configurar destinos explícitos de entrega, trabalhos Cron, vinculações ou allowlists.
O OpenClaw mantém chaves internas de sessão canônicas para armazenamento, então essas chaves
em minúsculas não são uma fonte confiável para IDs de entrega do Matrix.

A busca em diretório em tempo real usa a conta Matrix autenticada:

- Buscas de usuário consultam o diretório de usuários do Matrix nesse homeserver.
- Buscas de sala aceitam IDs e aliases de sala explícitos diretamente e depois recorrem à pesquisa de nomes de salas ingressadas para essa conta.
- A busca por nome em salas ingressadas é best-effort. Se um nome de sala não puder ser resolvido para um ID ou alias, ele será ignorado pela resolução de allowlist em tempo de execução.

## Referência de configuração

- `enabled`: habilita ou desabilita o canal.
- `name`: rótulo opcional para a conta.
- `defaultAccount`: ID de conta preferido quando várias contas Matrix estão configuradas.
- `homeserver`: URL do homeserver, por exemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta Matrix se conecte a homeservers privados/internos. Habilite isso quando o homeserver resolver para `localhost`, um IP de LAN/Tailscale ou um host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para o tráfego Matrix. Contas nomeadas podem substituir o padrão de nível superior com seu próprio `proxy`.
- `userId`: ID completo de usuário Matrix, por exemplo `@bot:example.org`.
- `accessToken`: token de acesso para autenticação baseada em token. Valores em texto simples e valores SecretRef são suportados para `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` nos provedores env/file/exec. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).
- `password`: senha para login baseado em senha. Valores em texto simples e valores SecretRef são suportados.
- `deviceId`: ID explícito de dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo para login com senha.
- `avatarUrl`: URL de autoavatar armazenada para sincronização de perfil e atualizações de `profile set`.
- `initialSyncLimit`: número máximo de eventos buscados durante a sincronização na inicialização.
- `encryption`: habilita E2EE.
- `allowlistOnly`: quando `true`, promove a política de sala `open` para `allowlist` e força todas as políticas de DM ativas, exceto `disabled` (incluindo `pairing` e `open`), para `allowlist`. Não afeta políticas `disabled`.
- `allowBots`: permite mensagens de outras contas Matrix configuradas do OpenClaw (`true` ou `"mentions"`).
- `groupPolicy`: `open`, `allowlist` ou `disabled`.
- `contextVisibility`: modo de visibilidade de contexto suplementar da sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist de IDs de usuário para tráfego de sala. IDs completos de usuário Matrix são mais seguros; correspondências exatas de diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `historyLimit`: máximo de mensagens da sala a incluir como contexto de histórico de grupo. Usa fallback para `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo será `0`. Defina `0` para desabilitar.
- `replyToMode`: `off`, `first`, `all` ou `batched`.
- `markdown`: configuração opcional de renderização Markdown para texto Matrix de saída.
- `streaming`: `off` (padrão), `"partial"`, `"quiet"`, `true` ou `false`. `"partial"` e `true` habilitam atualizações de rascunho com pré-visualização primeiro usando mensagens de texto Matrix normais. `"quiet"` usa avisos de pré-visualização sem notificação para configurações auto-hospedadas com regras de push. `false` equivale a `"off"`.
- `blockStreaming`: `true` habilita mensagens de progresso separadas para blocos concluídos do assistente enquanto o streaming de pré-visualização de rascunho está ativo.
- `threadReplies`: `off`, `inbound` ou `always`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessão vinculados a thread.
- `startupVerification`: modo automático de solicitação de autoverificação na inicialização (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: período de espera antes de tentar novamente solicitações automáticas de verificação na inicialização.
- `textChunkLimit`: tamanho do chunk de mensagem de saída em caracteres (aplica-se quando `chunkMode` é `length`).
- `chunkMode`: `length` divide mensagens por contagem de caracteres; `newline` divide em limites de linha.
- `responsePrefix`: string opcional adicionada no início de todas as respostas de saída para este canal.
- `ackReaction`: substituição opcional da reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição opcional do escopo da reação de confirmação (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificação de reação recebida (`own`, `off`).
- `mediaMaxMb`: limite de tamanho de mídia em MB para envios de saída e processamento de mídia recebida.
- `autoJoin`: política de entrada automática por convite (`always`, `allowlist`, `off`). Padrão: `off`. Aplica-se a todos os convites Matrix, incluindo convites no estilo DM.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `allowlist`. Entradas de alias são resolvidas para IDs de sala durante o processamento do convite; o OpenClaw não confia no estado de alias declarado pela sala convidada.
- `dm`: bloco de política de DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla o acesso a DM depois que o OpenClaw entrou na sala e a classificou como DM. Isso não altera se um convite será aceito automaticamente.
- `dm.allowFrom`: allowlist de IDs de usuário para tráfego de DM. IDs completos de usuário Matrix são mais seguros; correspondências exatas de diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `dm.sessionScope`: `per-user` (padrão) ou `per-room`. Use `per-room` quando quiser que cada sala de DM do Matrix mantenha contexto separado, mesmo se o par for o mesmo.
- `dm.threadReplies`: substituição da política de thread somente para DMs (`off`, `inbound`, `always`). Ela substitui a configuração `threadReplies` de nível superior tanto para posicionamento de resposta quanto para isolamento de sessão em DMs.
- `execApprovals`: entrega nativa de aprovação de execução do Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuário Matrix autorizados a aprovar solicitações de execução. Opcional quando `dm.allowFrom` já identifica os aprovadores.
- `execApprovals.target`: `dm | channel | both` (padrão: `dm`).
- `accounts`: substituições nomeadas por conta. Valores de nível superior em `channels.matrix` atuam como padrões para essas entradas.
- `groups`: mapa de políticas por sala. Prefira IDs ou aliases de sala; nomes de sala não resolvidos são ignorados em tempo de execução. A identidade de sessão/grupo usa o ID de sala estável após a resolução.
- `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta Matrix específica em configurações com várias contas.
- `groups.<room>.allowBots`: substituição em nível de sala para remetentes de bots configurados (`true` ou `"mentions"`).
- `groups.<room>.users`: allowlist de remetentes por sala.
- `groups.<room>.tools`: substituições por sala para permitir/negar ferramentas.
- `groups.<room>.autoReply`: substituição em nível de sala para exigência de menção. `true` desabilita exigências de menção para essa sala; `false` as força de volta.
- `groups.<room>.skills`: filtro opcional de skill por sala.
- `groups.<room>.systemPrompt`: trecho opcional de prompt de sistema por sala.
- `rooms`: alias legado para `groups`.
- `actions`: controle por ação para ferramentas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais suportados
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
