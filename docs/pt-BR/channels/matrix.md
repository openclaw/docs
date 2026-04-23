---
read_when:
    - Configurando o Matrix no OpenClaw
    - Configurando E2EE e verificação do Matrix
summary: Status do suporte ao Matrix, configuração inicial e exemplos de configuração
title: Matrix
x-i18n:
    generated_at: "2026-04-23T13:58:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix é um plugin de canal integrado do OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a DMs, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Plugin integrado

O Matrix é distribuído como um plugin integrado nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver usando uma versão mais antiga ou uma instalação personalizada que exclua o Matrix, instale-o
manualmente:

Instalar pelo npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Veja [Plugins](/pt-BR/tools/plugin) para o comportamento e as regras de instalação de plugin.

## Configuração inicial

1. Certifique-se de que o plugin Matrix está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta Matrix no seu homeserver.
3. Configure `channels.matrix` com um destes conjuntos:
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Reinicie o Gateway.
5. Inicie uma DM com o bot ou convide-o para uma sala.
   - Convites novos do Matrix só funcionam quando `channels.matrix.autoJoin` os permite.

Caminhos de configuração interativos:

```bash
openclaw channels add
openclaw configure --section channels
```

O assistente do Matrix pergunta por:

- URL do homeserver
- método de autenticação: access token ou senha
- ID do usuário (somente autenticação por senha)
- nome opcional do dispositivo
- se deve habilitar E2EE
- se deve configurar acesso à sala e entrada automática em convites

Principais comportamentos do assistente:

- Se variáveis de ambiente de autenticação do Matrix já existirem e essa conta ainda não tiver autenticação salva na configuração, o assistente oferece um atalho de variável de ambiente para manter a autenticação nas variáveis de ambiente.
- Nomes de conta são normalizados para o ID da conta. Por exemplo, `Ops Bot` vira `ops-bot`.
- Entradas de allowlist de DM aceitam `@user:server` diretamente; nomes de exibição só funcionam quando a busca ativa no diretório encontra uma correspondência exata.
- Entradas de allowlist de sala aceitam IDs de sala e aliases diretamente. Prefira `!room:server` ou `#alias:server`; nomes não resolvidos são ignorados em runtime pela resolução da allowlist.
- No modo allowlist de entrada automática por convite, use apenas destinos de convite estáveis: `!roomId:server`, `#alias:server` ou `*`. Nomes simples de sala são rejeitados.
- Para resolver nomes de sala antes de salvar, use `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` tem como padrão `off`.

Se você deixá-lo sem definir, o bot não entrará em salas convidadas nem em convites novos no estilo DM, então ele não aparecerá em novos grupos ou DMs convidadas, a menos que você entre manualmente primeiro.

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
Quando credenciais em cache existem ali, o OpenClaw trata o Matrix como configurado para configuração inicial, doctor e descoberta de status do canal, mesmo que a autenticação atual não esteja definida diretamente na configuração.

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

O Matrix escapa pontuação nos IDs de conta para manter variáveis de ambiente com escopo livres de colisão.
Por exemplo, `-` vira `_X2D_`, então `ops-prod` mapeia para `MATRIX_OPS_X2D_PROD_*`.

O assistente interativo só oferece o atalho de variável de ambiente quando essas variáveis de ambiente de autenticação já estão presentes e a conta selecionada ainda não tem autenticação do Matrix salva na configuração.

`MATRIX_HOMESERVER` não pode ser definido a partir de um `.env` do espaço de trabalho; veja [arquivos `.env` do espaço de trabalho](/pt-BR/gateway/security).

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

`autoJoin` se aplica a todos os convites do Matrix, incluindo convites no estilo DM. O OpenClaw não consegue
classificar com confiabilidade uma sala convidada como DM ou grupo no momento do convite, então todos os convites passam por `autoJoin`
primeiro. `dm.policy` se aplica depois que o bot entra e a sala é classificada como DM.

## Pré-visualizações em streaming

O streaming de respostas do Matrix é opt-in.

Defina `channels.matrix.streaming` como `"partial"` quando quiser que o OpenClaw envie uma única resposta
de pré-visualização ao vivo, edite essa pré-visualização no mesmo lugar enquanto o modelo gera texto e depois a
finalize quando a resposta terminar:

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
- `streaming: "partial"` cria uma mensagem de pré-visualização editável para o bloco atual do assistente usando mensagens de texto normais do Matrix. Isso preserva o comportamento legado do Matrix de notificação na primeira pré-visualização, então clientes padrão podem notificar com base no primeiro texto transmitido em vez do bloco concluído.
- `streaming: "quiet"` cria um aviso silencioso de pré-visualização editável para o bloco atual do assistente. Use isso apenas quando você também configurar regras de push do destinatário para edições finalizadas da pré-visualização.
- `blockStreaming: true` habilita mensagens separadas de progresso do Matrix. Com o streaming de pré-visualização habilitado, o Matrix mantém o rascunho ao vivo do bloco atual e preserva os blocos concluídos como mensagens separadas.
- Quando a pré-visualização em streaming está ativada e `blockStreaming` está desativado, o Matrix edita o rascunho ao vivo no mesmo lugar e finaliza esse mesmo evento quando o bloco ou turno termina.
- Se a pré-visualização não couber mais em um único evento do Matrix, o OpenClaw interrompe o streaming da pré-visualização e recorre à entrega final normal.
- Respostas com mídia ainda enviam anexos normalmente. Se uma pré-visualização antiga não puder mais ser reutilizada com segurança, o OpenClaw a remove antes de enviar a resposta final com mídia.
- Edições de pré-visualização geram chamadas extras à API do Matrix. Deixe o streaming desativado se quiser o comportamento mais conservador em relação a limites de taxa.

`blockStreaming` não habilita pré-visualizações de rascunho por si só.
Use `streaming: "partial"` ou `streaming: "quiet"` para edições de pré-visualização; depois adicione `blockStreaming: true` apenas se também quiser que blocos concluídos do assistente permaneçam visíveis como mensagens separadas de progresso.

Se você precisa de notificações padrão do Matrix sem regras de push personalizadas, use `streaming: "partial"` para comportamento de pré-visualização primeiro ou deixe `streaming` desativado para entrega somente final. Com `streaming: "off"`:

- `blockStreaming: true` envia cada bloco concluído como uma mensagem normal do Matrix com notificação.
- `blockStreaming: false` envia apenas a resposta final concluída como uma mensagem normal do Matrix com notificação.

### Regras de push auto-hospedadas para pré-visualizações silenciosas finalizadas

Se você executa sua própria infraestrutura Matrix e quer que pré-visualizações silenciosas notifiquem apenas quando um bloco ou
resposta final terminar, defina `streaming: "quiet"` e adicione uma regra de push por usuário para edições finalizadas da pré-visualização.

Normalmente isso é uma configuração do usuário destinatário, não uma alteração de configuração global do homeserver:

Mapa rápido antes de começar:

- usuário destinatário = a pessoa que deve receber a notificação
- usuário bot = a conta Matrix do OpenClaw que envia a resposta
- use o access token do usuário destinatário para as chamadas de API abaixo
- faça a correspondência de `sender` na regra de push com o MXID completo do usuário bot

1. Configure o OpenClaw para usar pré-visualizações silenciosas:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Certifique-se de que a conta destinatária já recebe notificações push normais do Matrix. Regras
   de pré-visualização silenciosa só funcionam se esse usuário já tiver pushers/dispositivos funcionando.

3. Obtenha o access token do usuário destinatário.
   - Use o token do usuário que recebe, não o token do bot.
   - Reutilizar um token de sessão de cliente existente geralmente é o mais fácil.
   - Se precisar gerar um token novo, você pode fazer login pela API padrão Client-Server do Matrix:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Verifique se a conta destinatária já tem pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se isso retornar nenhum pusher/dispositivo ativo, corrija primeiro as notificações normais do Matrix antes de adicionar a
regra do OpenClaw abaixo.

O OpenClaw marca edições finalizadas de pré-visualização somente de texto com:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Crie uma regra de push do tipo override para cada conta destinatária que deve receber essas notificações:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Substitua estes valores antes de executar o comando:

- `https://matrix.example.org`: a URL base do seu homeserver
- `$USER_ACCESS_TOKEN`: o access token do usuário que recebe
- `openclaw-finalized-preview-botname`: um ID de regra exclusivo para este bot para este usuário que recebe
- `@bot:example.org`: o MXID do seu bot Matrix do OpenClaw, não o MXID do usuário que recebe

Importante para configurações com vários bots:

- Regras de push são indexadas por `ruleId`. Executar `PUT` novamente com o mesmo ID de regra atualiza essa mesma regra.
- Se um usuário destinatário precisar notificar para várias contas de bot Matrix do OpenClaw, crie uma regra por bot com um ID de regra exclusivo para cada correspondência de remetente.
- Um padrão simples é `openclaw-finalized-preview-<botname>`, como `openclaw-finalized-preview-ops` ou `openclaw-finalized-preview-support`.

A regra é avaliada em relação ao remetente do evento:

- autentique com o token do usuário destinatário
- faça a correspondência de `sender` com o MXID do bot OpenClaw

6. Verifique se a regra existe:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Teste uma resposta em streaming. No modo silencioso, a sala deve mostrar um rascunho silencioso de pré-visualização e a
   edição final no mesmo lugar deve notificar quando o bloco ou turno terminar.

Se precisar remover a regra depois, exclua esse mesmo ID de regra com o token do usuário destinatário:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Observações:

- Crie a regra com o access token do usuário destinatário, não com o token do bot.
- Novas regras `override` definidas pelo usuário são inseridas antes das regras padrão de supressão, então nenhum parâmetro extra de ordenação é necessário.
- Isso afeta apenas edições de pré-visualização somente de texto que o OpenClaw consegue finalizar com segurança no mesmo lugar. Fallbacks de mídia e fallbacks de pré-visualização antiga ainda usam a entrega normal do Matrix.
- Se `GET /_matrix/client/v3/pushers` mostrar que não há pushers, o usuário ainda não tem entrega de push do Matrix funcionando para esta conta/dispositivo.

#### Synapse

Para o Synapse, a configuração acima geralmente já é suficiente por si só:

- Nenhuma alteração especial em `homeserver.yaml` é necessária para notificações de pré-visualização finalizada do OpenClaw.
- Se sua implantação do Synapse já envia notificações push normais do Matrix, o token do usuário + a chamada `pushrules` acima são a principal etapa de configuração.
- Se você executa o Synapse atrás de um proxy reverso ou workers, verifique se `/_matrix/client/.../pushrules/` chega corretamente ao Synapse.
- Se você executa workers do Synapse, verifique se os pushers estão saudáveis. A entrega de push é tratada pelo processo principal ou por `synapse.app.pusher` / workers de pusher configurados.

#### Tuwunel

Para o Tuwunel, use o mesmo fluxo de configuração e a mesma chamada à API `push-rule` mostrados acima:

- Nenhuma configuração específica do Tuwunel é necessária para o marcador de pré-visualização finalizada em si.
- Se as notificações normais do Matrix já funcionam para esse usuário, o token do usuário + a chamada `pushrules` acima são a principal etapa de configuração.
- Se as notificações parecerem desaparecer enquanto o usuário está ativo em outro dispositivo, verifique se `suppress_push_when_active` está habilitado. O Tuwunel adicionou essa opção no Tuwunel 1.4.2 em 12 de setembro de 2025, e ela pode suprimir intencionalmente pushes para outros dispositivos enquanto um dispositivo está ativo.

## Salas bot para bot

Por padrão, mensagens do Matrix de outras contas Matrix configuradas do OpenClaw são ignoradas.

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
- `allowBots: "mentions"` aceita essas mensagens apenas quando elas mencionam visivelmente este bot em salas. DMs continuam permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário Matrix para evitar loops de autorresposta.
- O Matrix não expõe aqui um sinalizador nativo de bot; o OpenClaw trata “autoria de bot” como “enviado por outra conta Matrix configurada neste Gateway OpenClaw”.

Use allowlists rígidas de sala e exigências de menção ao habilitar tráfego bot para bot em salas compartilhadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem enviados usam `thumbnail_file`, então pré-visualizações de imagem são criptografadas junto com o anexo completo. Salas não criptografadas ainda usam `thumbnail_url` simples. Nenhuma configuração é necessária — o plugin detecta o estado de E2EE automaticamente.

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

Verificar status da verificação:

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

Inicializar estado de cross-signing e verificação:

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

Detalhes detalhados da verificação do dispositivo:

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

Restaurar chaves de sala a partir do backup do servidor:

```bash
openclaw matrix verify backup restore
```

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

Em configurações com múltiplas contas, os comandos CLI do Matrix usam a conta padrão implícita do Matrix, a menos que você passe `--account <id>`.
Se você configurar várias contas nomeadas, defina `channels.matrix.defaultAccount` primeiro ou essas operações implícitas da CLI vão parar e pedir que você escolha uma conta explicitamente.
Use `--account` sempre que quiser que operações de verificação ou dispositivo tenham como alvo explicitamente uma conta nomeada:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando a criptografia estiver desabilitada ou indisponível para uma conta nomeada, avisos do Matrix e erros de verificação apontarão para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

### O que “verified” significa

O OpenClaw trata este dispositivo Matrix como verificado somente quando ele é verificado pela sua própria identidade de cross-signing.
Na prática, `openclaw matrix verify status --verbose` expõe três sinais de confiança:

- `Locally trusted`: este dispositivo é confiável apenas pelo cliente atual
- `Cross-signing verified`: o SDK informa o dispositivo como verificado por meio de cross-signing
- `Signed by owner`: o dispositivo é assinado pela sua própria chave de autoassinatura

`Verified by owner` passa a ser `yes` somente quando a verificação por cross-signing ou a assinatura do proprietário está presente.
A confiança local sozinha não é suficiente para o OpenClaw tratar o dispositivo como totalmente verificado.

### O que a inicialização faz

`openclaw matrix verify bootstrap` é o comando de reparo e configuração para contas Matrix criptografadas.
Ele faz tudo o que segue, nesta ordem:

- inicializa o armazenamento secreto, reutilizando uma chave de recuperação existente quando possível
- inicializa o cross-signing e envia chaves públicas de cross-signing ausentes
- tenta marcar e assinar via cross-signing o dispositivo atual
- cria um novo backup de chaves de sala no servidor caso ainda não exista um

Se o homeserver exigir autenticação interativa para enviar chaves de cross-signing, o OpenClaw tenta o envio sem autenticação primeiro, depois com `m.login.dummy` e depois com `m.login.password` quando `channels.matrix.password` estiver configurado.

Use `--force-reset-cross-signing` somente quando quiser intencionalmente descartar a identidade atual de cross-signing e criar uma nova.

Se você quiser intencionalmente descartar o backup atual de chaves de sala e iniciar uma nova
linha de base de backup para mensagens futuras, use `openclaw matrix verify backup reset --yes`.
Faça isso somente se aceitar que o histórico criptografado antigo irrecuperável continuará
indisponível e que o OpenClaw poderá recriar o armazenamento secreto se o segredo de backup atual
não puder ser carregado com segurança.

### Nova linha de base de backup

Se quiser manter mensagens criptografadas futuras funcionando e aceitar perder o histórico antigo irrecuperável, execute estes comandos nesta ordem:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Adicione `--account <id>` a cada comando quando quiser direcionar explicitamente uma conta Matrix nomeada.

### Comportamento na inicialização

Quando `encryption: true`, o Matrix define `startupVerification` por padrão como `"if-unverified"`.
Na inicialização, se este dispositivo ainda não estiver verificado, o Matrix solicitará autoverificação em outro cliente Matrix,
pulará solicitações duplicadas enquanto uma já estiver pendente e aplicará um cooldown local antes de tentar novamente após reinicializações.
Por padrão, tentativas de solicitação com falha tentam novamente mais cedo do que a criação bem-sucedida de solicitações.
Defina `startupVerification: "off"` para desabilitar solicitações automáticas na inicialização, ou ajuste `startupVerificationCooldownHours`
se quiser uma janela de nova tentativa mais curta ou mais longa.

A inicialização também realiza automaticamente uma passagem conservadora de bootstrap criptográfico.
Essa passagem tenta reutilizar primeiro o armazenamento secreto e a identidade atual de cross-signing, e evita redefinir o cross-signing a menos que você execute um fluxo explícito de reparo de bootstrap.

Se a inicialização ainda encontrar um estado de bootstrap quebrado, o OpenClaw poderá tentar um caminho de reparo protegido mesmo quando `channels.matrix.password` não estiver configurado.
Se o homeserver exigir UIA baseada em senha para esse reparo, o OpenClaw registrará um aviso e manterá a inicialização não fatal em vez de abortar o bot.
Se o dispositivo atual já estiver assinado pelo proprietário, o OpenClaw preservará essa identidade em vez de redefini-la automaticamente.

Veja [migração do Matrix](/pt-BR/install/migrating-matrix) para o fluxo completo de atualização, limites, comandos de recuperação e mensagens comuns de migração.

### Avisos de verificação

O Matrix publica avisos do ciclo de vida de verificação diretamente na sala estrita de DM de verificação como mensagens `m.notice`.
Isso inclui:

- avisos de solicitação de verificação
- avisos de verificação pronta (com orientação explícita “Verificar por emoji”)
- avisos de início e conclusão da verificação
- detalhes SAS (emoji e decimal) quando disponíveis

Solicitações de verificação recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente pelo OpenClaw.
Para fluxos de autoverificação, o OpenClaw também inicia automaticamente o fluxo SAS quando a verificação por emoji fica disponível e confirma seu próprio lado.
Para solicitações de verificação de outro usuário/dispositivo Matrix, o OpenClaw aceita automaticamente a solicitação e então espera que o fluxo SAS prossiga normalmente.
Você ainda precisa comparar o SAS em emoji ou decimal no seu cliente Matrix e confirmar “They match” lá para concluir a verificação.

O OpenClaw não aceita automaticamente fluxos duplicados iniciados por ele mesmo de forma cega. A inicialização evita criar uma nova solicitação quando uma solicitação de autoverificação já está pendente.

Avisos de verificação de protocolo/sistema não são encaminhados ao pipeline de chat do agente, então não produzem `NO_REPLY`.

### Higiene de dispositivos

Dispositivos Matrix antigos gerenciados pelo OpenClaw podem se acumular na conta e tornar a confiança em salas criptografadas mais difícil de entender.
Liste-os com:

```bash
openclaw matrix devices list
```

Remova dispositivos antigos gerenciados pelo OpenClaw com:

```bash
openclaw matrix devices prune-stale
```

### Armazenamento criptográfico

O Matrix E2EE usa o caminho oficial de criptografia Rust do `matrix-js-sdk` no Node, com `fake-indexeddb` como shim de IndexedDB. O estado criptográfico é persistido em um arquivo de snapshot (`crypto-idb-snapshot.json`) e restaurado na inicialização. O arquivo de snapshot é um estado sensível de runtime armazenado com permissões restritivas de arquivo.

O estado de runtime criptografado fica em roots por conta e por hash do token do usuário em
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Esse diretório contém o armazenamento de sync (`bot-storage.json`), o armazenamento criptográfico (`crypto/`),
o arquivo de chave de recuperação (`recovery-key.json`), o snapshot do IndexedDB (`crypto-idb-snapshot.json`),
os bindings de thread (`thread-bindings.json`) e o estado de verificação de inicialização (`startup-verification.json`).
Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza o melhor
root existente para essa tupla conta/homeserver/usuário para que o estado anterior de sync, o estado criptográfico, os bindings de thread
e o estado de verificação de inicialização continuem visíveis.

## Gerenciamento de perfil

Atualize o perfil Matrix da própria conta para a conta selecionada com:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Adicione `--account <id>` quando quiser direcionar explicitamente uma conta nomeada.

O Matrix aceita URLs de avatar `mxc://` diretamente. Quando você passa uma URL de avatar `http://` ou `https://`, o OpenClaw primeiro a envia para o Matrix e armazena a URL `mxc://` resolvida de volta em `channels.matrix.avatarUrl` (ou na substituição da conta selecionada).

## Threads

O Matrix oferece suporte a threads nativas do Matrix tanto para respostas automáticas quanto para envios por ferramenta de mensagem.

- `dm.sessionScope: "per-user"` (padrão) mantém o roteamento de DM do Matrix com escopo por remetente, para que várias salas de DM possam compartilhar uma sessão quando forem resolvidas para o mesmo peer.
- `dm.sessionScope: "per-room"` isola cada sala de DM do Matrix em sua própria chave de sessão, enquanto ainda usa as verificações normais de autenticação e allowlist de DM.
- Bindings explícitos de conversa Matrix ainda prevalecem sobre `dm.sessionScope`, então salas e threads associadas mantêm sua sessão de destino escolhida.
- `threadReplies: "off"` mantém as respostas no nível superior e mantém mensagens recebidas em thread na sessão pai.
- `threadReplies: "inbound"` responde dentro de uma thread apenas quando a mensagem recebida já estava nessa thread.
- `threadReplies: "always"` mantém respostas de sala em uma thread enraizada na mensagem que acionou a resposta e roteia essa conversa pela sessão com escopo de thread correspondente desde a primeira mensagem acionadora.
- `dm.threadReplies` substitui a configuração de nível superior apenas para DMs. Por exemplo, você pode manter threads de sala isoladas enquanto mantém DMs lineares.
- Mensagens recebidas em thread incluem a mensagem raiz da thread como contexto adicional do agente.
- Envios por ferramenta de mensagem herdam automaticamente a thread Matrix atual quando o destino é a mesma sala, ou o mesmo destino de usuário de DM, a menos que um `threadId` explícito seja fornecido.
- A reutilização do mesmo destino de usuário de DM na mesma sessão só entra em ação quando os metadados da sessão atual comprovam o mesmo peer de DM na mesma conta Matrix; caso contrário, o OpenClaw recorre ao roteamento normal com escopo por usuário.
- Quando o OpenClaw vê uma sala de DM do Matrix colidir com outra sala de DM na mesma sessão compartilhada de DM do Matrix, ele publica um `m.notice` único nessa sala com a rota de escape `/focus` quando os bindings de thread estão habilitados e a dica `dm.sessionScope`.
- Bindings de thread em runtime são compatíveis com Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` com binding de thread funcionam em salas e DMs do Matrix.
- `/focus` no nível superior de sala/DM do Matrix cria uma nova thread Matrix e a associa à sessão de destino quando `threadBindings.spawnSubagentSessions=true`.
- Executar `/focus` ou `/acp spawn --thread here` dentro de uma thread Matrix existente associa essa thread atual em vez disso.

## Bindings de conversa ACP

Salas, DMs e threads Matrix existentes podem ser transformadas em espaços de trabalho ACP duráveis sem alterar a superfície de chat.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da DM, sala ou thread existente do Matrix que você quer continuar usando.
- Em uma DM ou sala Matrix de nível superior, a DM/sala atual continua sendo a superfície de chat e mensagens futuras são roteadas para a sessão ACP criada.
- Dentro de uma thread Matrix existente, `--bind here` associa essa thread atual no mesmo lugar.
- `/new` e `/reset` redefinem a mesma sessão ACP associada no mesmo lugar.
- `/acp close` fecha a sessão ACP e remove o binding.

Observações:

- `--bind here` não cria uma thread Matrix filha.
- `threadBindings.spawnAcpSessions` só é necessário para `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou associar uma thread Matrix filha.

### Configuração de binding de thread

O Matrix herda padrões globais de `session.threadBindings` e também oferece suporte a substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Sinalizadores de criação com binding de thread do Matrix são opt-in:

- Defina `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nível superior crie e associe novas threads Matrix.
- Defina `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` associe sessões ACP a threads Matrix.

## Reações

O Matrix oferece suporte a ações de reação de saída, notificações de reação de entrada e reações de confirmação de entrada.

- O ferramental de reação de saída é controlado por `channels["matrix"].actions.reactions`.
- `react` adiciona uma reação a um evento Matrix específico.
- `reactions` lista o resumo atual de reações para um evento Matrix específico.
- `emoji=""` remove as próprias reações da conta do bot nesse evento.
- `remove: true` remove apenas a reação de emoji especificada da conta do bot.

O escopo de resolução de reação de confirmação segue a ordem padrão do OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback para o emoji de identidade do agente

O escopo de reação de confirmação é resolvido nesta ordem:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

O modo de notificação de reação é resolvido nesta ordem:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- padrão: `own`

Comportamento:

- `reactionNotifications: "own"` encaminha eventos `m.reaction` adicionados quando eles têm como alvo mensagens Matrix criadas pelo bot.
- `reactionNotifications: "off"` desabilita eventos de sistema de reação.
- Remoções de reação não são sintetizadas em eventos de sistema porque o Matrix as expõe como redações, não como remoções independentes de `m.reaction`.

## Contexto do histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala Matrix aciona o agente. Usa fallback para `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo é `0`. Defina `0` para desabilitar.
- O histórico de sala Matrix é apenas da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de sala Matrix é apenas pendente: o OpenClaw armazena em buffer mensagens da sala que ainda não acionaram uma resposta e então tira um snapshot dessa janela quando chega uma menção ou outro gatilho.
- A mensagem de gatilho atual não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada dessa rodada.
- Novas tentativas do mesmo evento Matrix reutilizam o snapshot original do histórico em vez de avançar para mensagens mais novas da sala.

## Visibilidade do contexto

O Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar de sala, como texto de resposta buscado, raízes de thread e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido como foi recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist de sala/usuário.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

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

Veja [Grupos](/pt-BR/channels/groups) para o comportamento de bloqueio por menção e allowlist.

Exemplo de emparelhamento para DMs do Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário Matrix não aprovado continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de emparelhamento pendente e pode enviar uma resposta de lembrete novamente após um curto cooldown, em vez de gerar um novo código.

Veja [Emparelhamento](/pt-BR/channels/pairing) para o fluxo compartilhado de emparelhamento de DM e o layout de armazenamento.

## Reparo de sala direta

Se o estado de mensagem direta ficar dessincronizado, o OpenClaw pode acabar com mapeamentos `m.direct` obsoletos apontando para salas individuais antigas em vez da DM ativa. Inspecione o mapeamento atual de um peer com:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repare-o com:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

O fluxo de reparo:

- prefere uma DM estrita 1:1 que já esteja mapeada em `m.direct`
- recorre a qualquer DM estrita 1:1 com esse usuário à qual já tenha entrado no momento
- cria uma nova sala direta e reescreve `m.direct` se não existir uma DM saudável

O fluxo de reparo não exclui automaticamente salas antigas. Ele apenas escolhe a DM saudável e atualiza o mapeamento para que novos envios do Matrix, avisos de verificação e outros fluxos de mensagem direta voltem a apontar para a sala correta.

## Aprovações de execução

O Matrix pode atuar como um cliente nativo de aprovação para uma conta Matrix. Os controles nativos
de roteamento de DM/canal ainda ficam sob a configuração de aprovação de execução:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; usa fallback para `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Os aprovadores devem ser IDs de usuário Matrix como `@owner:example.org`. O Matrix habilita automaticamente aprovações nativas quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador pode ser resolvido. Aprovações de execução usam `execApprovals.approvers` primeiro e podem recorrer a `channels.matrix.dm.allowFrom`. Aprovações de plugin autorizam por meio de `channels.matrix.dm.allowFrom`. Defina `enabled: false` para desabilitar explicitamente o Matrix como cliente nativo de aprovação. Caso contrário, solicitações de aprovação recorrem a outras rotas de aprovação configuradas ou à política de fallback de aprovação.

O roteamento nativo do Matrix oferece suporte a ambos os tipos de aprovação:

- `channels.matrix.execApprovals.*` controla o modo nativo de distribuição para DM/canal dos prompts de aprovação do Matrix.
- Aprovações de execução usam o conjunto de aprovadores de execução de `execApprovals.approvers` ou `channels.matrix.dm.allowFrom`.
- Aprovações de plugin usam a allowlist de DM do Matrix em `channels.matrix.dm.allowFrom`.
- Atalhos por reação do Matrix e atualizações de mensagem se aplicam tanto a aprovações de execução quanto de plugin.

Regras de entrega:

- `target: "dm"` envia prompts de aprovação para as DMs dos aprovadores
- `target: "channel"` envia o prompt de volta para a sala ou DM Matrix de origem
- `target: "both"` envia para as DMs dos aprovadores e para a sala ou DM Matrix de origem

Os prompts de aprovação do Matrix inicializam atalhos por reação na mensagem principal de aprovação:

- `✅` = permitir uma vez
- `❌` = negar
- `♾️` = permitir sempre quando essa decisão for permitida pela política efetiva de execução

Os aprovadores podem reagir nessa mensagem ou usar os comandos slash de fallback: `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. Para aprovações de execução, a entrega em canal inclui o texto do comando, então só habilite `channel` ou `both` em salas confiáveis.

Substituição por conta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentação relacionada: [Aprovações de execução](/pt-BR/tools/exec-approvals)

## Comandos slash

Comandos slash do Matrix (por exemplo `/new`, `/reset`, `/model`) funcionam diretamente em DMs. Em salas, o OpenClaw também reconhece comandos slash com o prefixo da própria menção Matrix do bot, então `@bot:server /new` aciona o caminho de comando sem precisar de uma regex de menção personalizada. Isso mantém o bot responsivo a postagens em salas no estilo `@mention /command` que o Element e clientes semelhantes emitem quando um usuário completa com tab o nome do bot antes de digitar o comando.

As regras de autorização continuam valendo: remetentes de comandos devem satisfazer políticas de allowlist/proprietário de DM ou sala exatamente como mensagens comuns.

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
Entradas sem `account` continuam compartilhadas entre todas as contas Matrix, e entradas com `account: "default"` ainda funcionam quando a conta padrão é configurada diretamente em `channels.matrix.*` de nível superior.
Padrões compartilhados parciais de autenticação não criam, por si só, uma conta padrão implícita separada. O OpenClaw só sintetiza a conta `default` de nível superior quando esse padrão tem autenticação nova (`homeserver` mais `accessToken`, ou `homeserver` mais `userId` e `password`); contas nomeadas ainda podem continuar detectáveis a partir de `homeserver` mais `userId` quando credenciais em cache satisfizerem a autenticação depois.
Se o Matrix já tiver exatamente uma conta nomeada, ou se `defaultAccount` apontar para uma chave de conta nomeada existente, a promoção de reparo/configuração de conta única para múltiplas contas preserva essa conta em vez de criar uma nova entrada `accounts.default`. Apenas chaves de autenticação/bootstrap do Matrix são movidas para essa conta promovida; chaves compartilhadas de política de entrega permanecem no nível superior.
Defina `defaultAccount` quando quiser que o OpenClaw prefira uma conta Matrix nomeada para roteamento implícito, sondagem e operações da CLI.
Se várias contas Matrix estiverem configuradas e um ID de conta for `default`, o OpenClaw usará essa conta implicitamente mesmo quando `defaultAccount` não estiver definido.
Se você configurar várias contas nomeadas, defina `defaultAccount` ou passe `--account <id>` para comandos CLI que dependem de seleção implícita de conta.
Passe `--account <id>` para `openclaw matrix verify ...` e `openclaw matrix devices ...` quando quiser substituir essa seleção implícita em um comando específico.

Veja [Referência de configuração](/pt-BR/gateway/configuration-reference#multi-account-all-channels) para o padrão compartilhado de múltiplas contas.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers Matrix privados/internos para proteção contra SSRF, a menos que você
faça opt-in explicitamente por conta.

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

Exemplo de configuração pela CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esse opt-in permite apenas destinos privados/internos confiáveis. Homeservers públicos em texto simples como
`http://matrix.example.org:8008` continuam bloqueados. Prefira `https://` sempre que possível.

## Uso de proxy para tráfego Matrix

Se sua implantação Matrix precisar de um proxy HTTP(S) de saída explícito, defina `channels.matrix.proxy`:

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
O OpenClaw usa a mesma configuração de proxy para tráfego Matrix em runtime e para sondas de status da conta.

## Resolução de destino

O Matrix aceita estes formatos de destino em qualquer lugar em que o OpenClaw peça um destino de sala ou usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

A busca ativa no diretório usa a conta Matrix autenticada:

- Buscas de usuário consultam o diretório de usuários Matrix nesse homeserver.
- Buscas de sala aceitam diretamente IDs e aliases explícitos de sala e depois recorrem à busca de nomes de salas associadas a essa conta.
- A busca por nome de sala associada é best-effort. Se um nome de sala não puder ser resolvido para um ID ou alias, ele será ignorado pela resolução de allowlist em runtime.

## Referência de configuração

- `enabled`: habilita ou desabilita o canal.
- `name`: rótulo opcional para a conta.
- `defaultAccount`: ID de conta preferido quando várias contas Matrix estão configuradas.
- `homeserver`: URL do homeserver, por exemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta Matrix se conecte a homeservers privados/internos. Habilite isso quando o homeserver for resolvido para `localhost`, um IP de LAN/Tailscale ou um host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para tráfego Matrix. Contas nomeadas podem substituir o padrão de nível superior com seu próprio `proxy`.
- `userId`: ID completo do usuário Matrix, por exemplo `@bot:example.org`.
- `accessToken`: access token para autenticação baseada em token. Valores em texto simples e valores SecretRef são compatíveis para `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` em provedores env/file/exec. Veja [Gerenciamento de segredos](/pt-BR/gateway/secrets).
- `password`: senha para login baseado em senha. Valores em texto simples e valores SecretRef são compatíveis.
- `deviceId`: ID explícito de dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo para login por senha.
- `avatarUrl`: URL armazenada do avatar da própria conta para sincronização de perfil e atualizações de `profile set`.
- `initialSyncLimit`: número máximo de eventos buscados durante a sincronização de inicialização.
- `encryption`: habilita E2EE.
- `allowlistOnly`: quando `true`, atualiza a política de sala `open` para `allowlist` e força todas as políticas de DM ativas, exceto `disabled` (incluindo `pairing` e `open`), para `allowlist`. Não afeta políticas `disabled`.
- `allowBots`: permite mensagens de outras contas Matrix configuradas do OpenClaw (`true` ou `"mentions"`).
- `groupPolicy`: `open`, `allowlist` ou `disabled`.
- `contextVisibility`: modo de visibilidade de contexto suplementar de sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist de IDs de usuário para tráfego de sala. IDs completos de usuário Matrix são mais seguros; correspondências exatas de diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `historyLimit`: máximo de mensagens de sala a incluir como contexto de histórico de grupo. Usa fallback para `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo é `0`. Defina `0` para desabilitar.
- `replyToMode`: `off`, `first`, `all` ou `batched`.
- `markdown`: configuração opcional de renderização Markdown para texto Matrix de saída.
- `streaming`: `off` (padrão), `"partial"`, `"quiet"`, `true` ou `false`. `"partial"` e `true` habilitam atualizações de rascunho com pré-visualização primeiro usando mensagens de texto normais do Matrix. `"quiet"` usa avisos silenciosos de pré-visualização para configurações auto-hospedadas com regras de push. `false` é equivalente a `"off"`.
- `blockStreaming`: `true` habilita mensagens de progresso separadas para blocos concluídos do assistente enquanto o streaming de rascunho com pré-visualização está ativo.
- `threadReplies`: `off`, `inbound` ou `always`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessão com binding de thread.
- `startupVerification`: modo automático de solicitação de autoverificação na inicialização (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown antes de tentar novamente solicitações automáticas de verificação na inicialização.
- `textChunkLimit`: tamanho de bloco da mensagem de saída em caracteres (aplica-se quando `chunkMode` é `length`).
- `chunkMode`: `length` divide mensagens por contagem de caracteres; `newline` divide em limites de linha.
- `responsePrefix`: string opcional prefixada a todas as respostas de saída deste canal.
- `ackReaction`: substituição opcional de reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição opcional de escopo de reação de confirmação (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificação de reação de entrada (`own`, `off`).
- `mediaMaxMb`: limite de tamanho de mídia em MB para envios de saída e processamento de mídia de entrada.
- `autoJoin`: política de entrada automática por convite (`always`, `allowlist`, `off`). Padrão: `off`. Aplica-se a todos os convites Matrix, incluindo convites no estilo DM.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `allowlist`. Entradas de alias são resolvidas para IDs de sala durante o tratamento do convite; o OpenClaw não confia no estado de alias declarado pela sala convidada.
- `dm`: bloco de política de DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla o acesso à DM depois que o OpenClaw entrou na sala e a classificou como DM. Não altera se um convite é aceito automaticamente.
- `dm.allowFrom`: allowlist de IDs de usuário para tráfego de DM. IDs completos de usuário Matrix são mais seguros; correspondências exatas de diretório são resolvidas na inicialização e quando a allowlist muda enquanto o monitor está em execução. Nomes não resolvidos são ignorados.
- `dm.sessionScope`: `per-user` (padrão) ou `per-room`. Use `per-room` quando quiser que cada sala de DM do Matrix mantenha contexto separado mesmo se o peer for o mesmo.
- `dm.threadReplies`: substituição de política de thread apenas para DM (`off`, `inbound`, `always`). Ela substitui a configuração de nível superior `threadReplies` tanto para posicionamento da resposta quanto para isolamento de sessão em DMs.
- `execApprovals`: entrega nativa de aprovação de execução do Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuário Matrix autorizados a aprovar solicitações de execução. Opcional quando `dm.allowFrom` já identifica os aprovadores.
- `execApprovals.target`: `dm | channel | both` (padrão: `dm`).
- `accounts`: substituições nomeadas por conta. Valores de nível superior em `channels.matrix` atuam como padrões para essas entradas.
- `groups`: mapa de política por sala. Prefira IDs ou aliases de sala; nomes de sala não resolvidos são ignorados em runtime. A identidade de sessão/grupo usa o ID estável da sala após a resolução.
- `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta Matrix específica em configurações com múltiplas contas.
- `groups.<room>.allowBots`: substituição no nível da sala para remetentes de bots configurados (`true` ou `"mentions"`).
- `groups.<room>.users`: allowlist de remetentes por sala.
- `groups.<room>.tools`: substituições por sala para permitir/negar ferramentas.
- `groups.<room>.autoReply`: substituição no nível da sala para bloqueio por menção. `true` desabilita a exigência de menção para essa sala; `false` a força de volta.
- `groups.<room>.skills`: filtro opcional de Skills por sala.
- `groups.<room>.systemPrompt`: trecho opcional de prompt do sistema por sala.
- `rooms`: alias legado para `groups`.
- `actions`: controle por ação de ferramentas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
