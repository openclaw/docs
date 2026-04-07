---
read_when:
    - Configurando o Matrix no OpenClaw
    - Configurando E2EE e verificação do Matrix
summary: Status do suporte ao Matrix, configuração e exemplos de configuração
title: Matrix
x-i18n:
    generated_at: "2026-04-07T05:28:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53baa2ea5916cd00a99cae0ded3be41ffa13c9a69e8ea8461eb7baa6a99e13c
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix é o plugin de canal Matrix empacotado do OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a DMs, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Plugin empacotado

O Matrix é distribuído como um plugin empacotado nas versões atuais do OpenClaw, então compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Matrix, instale-o manualmente:

Instale pelo npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instale a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulte [Plugins](/pt-BR/tools/plugin) para o comportamento dos plugins e regras de instalação.

## Configuração

1. Verifique se o plugin Matrix está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta Matrix no seu homeserver.
3. Configure `channels.matrix` com:
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Reinicie o gateway.
5. Inicie uma DM com o bot ou convide-o para uma sala.
   - Convites Matrix novos só funcionam quando `channels.matrix.autoJoin` os permite.

Caminhos de configuração interativa:

```bash
openclaw channels add
openclaw configure --section channels
```

O que o assistente do Matrix realmente pergunta:

- URL do homeserver
- método de autenticação: token de acesso ou senha
- ID do usuário somente quando você escolhe autenticação por senha
- nome opcional do dispositivo
- se deseja ativar E2EE
- se deseja configurar o acesso a salas do Matrix agora
- se deseja configurar a entrada automática em convites do Matrix agora
- quando a entrada automática em convites está ativada, se ela deve ser `allowlist`, `always` ou `off`

Comportamento do assistente que importa:

- Se as variáveis de ambiente de autenticação do Matrix já existirem para a conta selecionada, e essa conta ainda não tiver autenticação salva na configuração, o assistente oferece um atalho de env para que a configuração mantenha a autenticação em variáveis de ambiente em vez de copiar segredos para a configuração.
- Quando você adiciona outra conta Matrix interativamente, o nome da conta informado é normalizado para o ID de conta usado na configuração e nas variáveis de ambiente. Por exemplo, `Ops Bot` vira `ops-bot`.
- Os prompts de allowlist de DM aceitam valores completos `@user:server` imediatamente. Nomes de exibição só funcionam quando a busca ao vivo no diretório encontra uma correspondência exata; caso contrário, o assistente pede para tentar novamente com um ID Matrix completo.
- Os prompts de allowlist de sala aceitam IDs e aliases de sala diretamente. Eles também podem resolver nomes de salas ingressadas ao vivo, mas nomes não resolvidos são mantidos apenas como foram digitados durante a configuração e depois são ignorados pela resolução de allowlist em tempo de execução. Prefira `!room:server` ou `#alias:server`.
- O assistente agora mostra um aviso explícito antes da etapa de entrada automática em convites porque `channels.matrix.autoJoin` tem padrão `off`; agentes não entrarão em salas convidadas nem em convites novos no estilo DM a menos que você o configure.
- No modo allowlist de entrada automática em convites, use apenas alvos de convite estáveis: `!roomId:server`, `#alias:server` ou `*`. Nomes simples de sala são rejeitados.
- A identidade de sala/sessão em tempo de execução usa o ID estável da sala Matrix. Aliases declarados na sala são usados apenas como entradas de busca, não como chave de sessão de longo prazo nem como identidade estável do grupo.
- Para resolver nomes de salas antes de salvá-los, use `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` tem padrão `off`.

Se você deixá-lo sem configuração, o bot não entrará em salas convidadas nem em convites novos no estilo DM, então ele não aparecerá em novos grupos ou DMs convidadas, a menos que você entre manualmente primeiro.

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
Quando credenciais em cache existem ali, o OpenClaw trata o Matrix como configurado para descoberta em setup, doctor e status de canal, mesmo que a autenticação atual não esteja definida diretamente na configuração.

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

O Matrix escapa pontuação nos IDs de conta para manter variáveis de ambiente com escopo livres de colisão.
Por exemplo, `-` vira `_X2D_`, então `ops-prod` mapeia para `MATRIX_OPS_X2D_PROD_*`.

O assistente interativo só oferece o atalho de variável de ambiente quando essas variáveis de autenticação já estão presentes e a conta selecionada ainda não tem autenticação Matrix salva na configuração.

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

`autoJoin` se aplica a convites Matrix em geral, não apenas a convites de sala/grupo.
Isso inclui convites novos no estilo DM. No momento do convite, o OpenClaw não sabe de forma confiável se a
sala convidada acabará sendo tratada como DM ou como grupo, então todos os convites passam primeiro pela mesma
decisão de `autoJoin`. `dm.policy` ainda se aplica depois que o bot entra e a sala é
classificada como DM, então `autoJoin` controla o comportamento de entrada enquanto `dm.policy` controla o comportamento de resposta/acesso.

## Prévias de streaming

O streaming de respostas no Matrix é opt-in.

Defina `channels.matrix.streaming` como `"partial"` quando quiser que o OpenClaw envie uma única prévia ao vivo
da resposta, edite essa prévia no mesmo lugar enquanto o modelo estiver gerando texto e depois a finalize quando a
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
- `streaming: "partial"` cria uma mensagem de prévia editável para o bloco atual do assistente usando mensagens de texto Matrix normais. Isso preserva o comportamento legado do Matrix de notificação primeiro da prévia, então clientes padrão podem notificar no primeiro texto em streaming em vez do bloco finalizado.
- `streaming: "quiet"` cria um aviso de prévia silencioso editável para o bloco atual do assistente. Use isso apenas quando você também configurar regras de push do destinatário para edições finalizadas da prévia.
- `blockStreaming: true` ativa mensagens de progresso Matrix separadas. Com streaming de prévia ativado, o Matrix mantém o rascunho ao vivo do bloco atual e preserva os blocos concluídos como mensagens separadas.
- Quando a prévia em streaming está ativada e `blockStreaming` está desativado, o Matrix edita o rascunho ao vivo no mesmo lugar e finaliza esse mesmo evento quando o bloco ou turno termina.
- Se a prévia não couber mais em um único evento Matrix, o OpenClaw interrompe o streaming da prévia e volta para a entrega final normal.
- Respostas com mídia ainda enviam anexos normalmente. Se uma prévia antiga não puder mais ser reutilizada com segurança, o OpenClaw a redige antes de enviar a resposta final com mídia.
- Edições de prévia custam chamadas extras à API do Matrix. Deixe o streaming desativado se quiser o comportamento mais conservador em relação a limite de taxa.

`blockStreaming` não ativa prévias em rascunho por si só.
Use `streaming: "partial"` ou `streaming: "quiet"` para edições de prévia; depois adicione `blockStreaming: true` apenas se também quiser que blocos concluídos do assistente permaneçam visíveis como mensagens de progresso separadas.

Se você precisa de notificações padrão do Matrix sem regras de push personalizadas, use `streaming: "partial"` para o comportamento de prévia primeiro ou deixe `streaming` desativado para entrega somente final. Com `streaming: "off"`:

- `blockStreaming: true` envia cada bloco concluído como uma mensagem Matrix notificável normal.
- `blockStreaming: false` envia apenas a resposta final concluída como uma mensagem Matrix notificável normal.

### Regras de push auto-hospedadas para prévias silenciosas finalizadas

Se você executa sua própria infraestrutura Matrix e quer que prévias silenciosas notifiquem somente quando um bloco ou
resposta final terminar, defina `streaming: "quiet"` e adicione uma regra de push por usuário para edições finalizadas de prévia.

Geralmente isso é uma configuração do usuário destinatário, não uma mudança de configuração global do homeserver:

Mapa rápido antes de começar:

- usuário destinatário = a pessoa que deve receber a notificação
- usuário bot = a conta Matrix do OpenClaw que envia a resposta
- use o token de acesso do usuário destinatário para as chamadas de API abaixo
- faça `sender` na regra de push corresponder ao MXID completo do usuário bot

1. Configure o OpenClaw para usar prévias silenciosas:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Certifique-se de que a conta do destinatário já receba notificações push Matrix normais. Regras
   de prévia silenciosa só funcionam se esse usuário já tiver pushers/dispositivos funcionando.

3. Obtenha o token de acesso do usuário destinatário.
   - Use o token do usuário que recebe, não o token do bot.
   - Reutilizar um token de sessão de cliente existente normalmente é o mais fácil.
   - Se você precisar gerar um token novo, pode fazer login pela API padrão Client-Server do Matrix:

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

4. Verifique se a conta do destinatário já possui pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se isso retornar sem pushers/dispositivos ativos, corrija primeiro as notificações Matrix normais antes de adicionar a
regra do OpenClaw abaixo.

O OpenClaw marca edições finalizadas de prévia somente de texto com:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Crie uma regra de push de override para cada conta destinatária que deve receber essas notificações:

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

- `https://matrix.example.org`: URL base do seu homeserver
- `$USER_ACCESS_TOKEN`: o token de acesso do usuário que recebe
- `openclaw-finalized-preview-botname`: um ID de regra único para este bot para este usuário que recebe
- `@bot:example.org`: o MXID do seu bot Matrix do OpenClaw, não o MXID do usuário que recebe

Importante para configurações com vários bots:

- Regras de push são indexadas por `ruleId`. Executar `PUT` novamente com o mesmo ID de regra atualiza essa mesma regra.
- Se um usuário que recebe deve notificar para várias contas de bot Matrix do OpenClaw, crie uma regra por bot com um ID de regra único para cada correspondência de remetente.
- Um padrão simples é `openclaw-finalized-preview-<botname>`, como `openclaw-finalized-preview-ops` ou `openclaw-finalized-preview-support`.

A regra é avaliada em relação ao remetente do evento:

- autentique com o token do usuário que recebe
- faça `sender` corresponder ao MXID do bot OpenClaw

6. Verifique se a regra existe:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Teste uma resposta em streaming. No modo silencioso, a sala deve mostrar uma prévia de rascunho silenciosa e a edição final
   no mesmo lugar deve notificar quando o bloco ou turno terminar.

Se precisar remover a regra depois, exclua esse mesmo ID de regra com o token do usuário que recebe:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Observações:

- Crie a regra com o token de acesso do usuário que recebe, não com o do bot.
- Novas regras `override` definidas pelo usuário são inseridas antes das regras padrão de supressão, então nenhum parâmetro extra de ordenação é necessário.
- Isso afeta apenas edições de prévia somente de texto que o OpenClaw pode finalizar com segurança no mesmo lugar. Fallbacks de mídia e fallbacks de prévia antiga ainda usam a entrega Matrix normal.
- Se `GET /_matrix/client/v3/pushers` não mostrar pushers, o usuário ainda não tem entrega push Matrix funcionando para esta conta/dispositivo.

#### Synapse

Para Synapse, a configuração acima normalmente já é suficiente por si só:

- Nenhuma alteração especial em `homeserver.yaml` é necessária para notificações de prévia finalizada do OpenClaw.
- Se sua implantação do Synapse já envia notificações push Matrix normais, o token do usuário + a chamada `pushrules` acima são a principal etapa de configuração.
- Se você executa o Synapse atrás de um proxy reverso ou workers, verifique se `/_matrix/client/.../pushrules/` chega corretamente ao Synapse.
- Se você executa workers do Synapse, verifique se os pushers estão saudáveis. A entrega push é tratada pelo processo principal ou por `synapse.app.pusher` / workers de pusher configurados.

#### Tuwunel

Para Tuwunel, use o mesmo fluxo de configuração e a mesma chamada de API `pushrules` mostrados acima:

- Nenhuma configuração específica do Tuwunel é necessária para o próprio marcador de prévia finalizada.
- Se notificações Matrix normais já funcionam para esse usuário, o token do usuário + a chamada `pushrules` acima são a principal etapa de configuração.
- Se as notificações parecerem desaparecer enquanto o usuário está ativo em outro dispositivo, verifique se `suppress_push_when_active` está ativado. O Tuwunel adicionou essa opção no Tuwunel 1.4.2 em 12 de setembro de 2025, e ela pode suprimir intencionalmente pushes para outros dispositivos enquanto um dispositivo está ativo.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem de saída usam `thumbnail_file`, então prévias de imagem são criptografadas junto com o anexo completo. Salas não criptografadas ainda usam `thumbnail_url` simples. Nenhuma configuração é necessária — o plugin detecta o estado de E2EE automaticamente.

### Salas bot para bot

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

- `allowBots: true` aceita mensagens de outras contas Matrix de bot configuradas em salas permitidas e DMs.
- `allowBots: "mentions"` aceita essas mensagens apenas quando elas mencionam visivelmente este bot em salas. DMs continuam permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário Matrix para evitar loops de auto-resposta.
- O Matrix não expõe aqui uma flag nativa de bot; o OpenClaw trata "autoria de bot" como "enviado por outra conta Matrix configurada neste gateway OpenClaw".

Use allowlists estritas de sala e exigências de menção ao ativar tráfego bot para bot em salas compartilhadas.

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

Verificar status de verificação:

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

Inicializar cross-signing e estado de verificação:

```bash
openclaw matrix verify bootstrap
```

Suporte a múltiplas contas: use `channels.matrix.accounts` com credenciais por conta e `name` opcional. Consulte [Configuration reference](/pt-BR/gateway/configuration-reference#multi-account-all-channels) para o padrão compartilhado.

Diagnósticos detalhados de bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forçar uma redefinição nova da identidade de cross-signing antes do bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verificar este dispositivo com uma chave de recuperação:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Detalhes detalhados de verificação do dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Verificar a integridade do backup da chave de sala:

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

Diagnósticos detalhados da restauração:

```bash
openclaw matrix verify backup restore --verbose
```

Excluir o backup atual do servidor e criar uma nova linha de base de backup. Se a
chave de backup armazenada não puder ser carregada corretamente, essa redefinição também poderá recriar o armazenamento de segredos para que
futuras inicializações a frio possam carregar a nova chave de backup:

```bash
openclaw matrix verify backup reset --yes
```

Todos os comandos `verify` são concisos por padrão (incluindo logging interno silencioso do SDK) e mostram diagnósticos detalhados apenas com `--verbose`.
Use `--json` para saída completa legível por máquina ao criar scripts.

Em configurações com múltiplas contas, os comandos Matrix da CLI usam a conta padrão implícita do Matrix, a menos que você passe `--account <id>`.
Se você configurar várias contas nomeadas, defina `channels.matrix.defaultAccount` primeiro ou essas operações implícitas da CLI irão parar e pedir que você escolha uma conta explicitamente.
Use `--account` sempre que quiser que operações de verificação ou dispositivo tenham uma conta nomeada explicitamente como alvo:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando a criptografia estiver desativada ou indisponível para uma conta nomeada, avisos Matrix e erros de verificação apontam para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

### O que "verified" significa

O OpenClaw trata este dispositivo Matrix como verificado apenas quando ele é verificado pela sua própria identidade de cross-signing.
Na prática, `openclaw matrix verify status --verbose` expõe três sinais de confiança:

- `Locally trusted`: este dispositivo é confiável apenas pelo cliente atual
- `Cross-signing verified`: o SDK relata o dispositivo como verificado por cross-signing
- `Signed by owner`: o dispositivo é assinado pela sua própria chave self-signing

`Verified by owner` vira `yes` apenas quando há verificação por cross-signing ou assinatura do proprietário.
Confiança local por si só não é suficiente para o OpenClaw tratar o dispositivo como totalmente verificado.

### O que o bootstrap faz

`openclaw matrix verify bootstrap` é o comando de reparo e configuração para contas Matrix criptografadas.
Ele faz tudo a seguir, nesta ordem:

- inicializa o armazenamento de segredos, reutilizando uma chave de recuperação existente quando possível
- inicializa o cross-signing e envia chaves públicas de cross-signing ausentes
- tenta marcar e fazer cross-sign do dispositivo atual
- cria um novo backup de chave de sala no servidor se ainda não existir

Se o homeserver exigir autenticação interativa para enviar chaves de cross-signing, o OpenClaw tenta o upload sem autenticação primeiro, depois com `m.login.dummy`, e depois com `m.login.password` quando `channels.matrix.password` está configurado.

Use `--force-reset-cross-signing` apenas quando quiser intencionalmente descartar a identidade atual de cross-signing e criar uma nova.

Se quiser intencionalmente descartar o backup atual de chave de sala e iniciar uma nova
linha de base de backup para mensagens futuras, use `openclaw matrix verify backup reset --yes`.
Faça isso apenas se você aceitar que o histórico criptografado antigo irrecuperável permanecerá
indisponível e que o OpenClaw pode recriar o armazenamento de segredos se o segredo de backup atual
não puder ser carregado com segurança.

### Nova linha de base de backup

Se você quiser manter futuras mensagens criptografadas funcionando e aceitar perder histórico antigo irrecuperável, execute estes comandos nesta ordem:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Adicione `--account <id>` a cada comando quando quiser direcionar explicitamente uma conta Matrix nomeada.

### Comportamento na inicialização

Quando `encryption: true`, o Matrix usa `"if-unverified"` como padrão para `startupVerification`.
Na inicialização, se este dispositivo ainda não estiver verificado, o Matrix solicitará autoverificação em outro cliente Matrix,
pulará solicitações duplicadas enquanto uma já estiver pendente e aplicará um cooldown local antes de tentar novamente após reinicializações.
Tentativas de solicitação com falha tentam novamente antes, por padrão, do que a criação bem-sucedida de solicitações.
Defina `startupVerification: "off"` para desativar solicitações automáticas na inicialização, ou ajuste `startupVerificationCooldownHours`
se quiser uma janela de nova tentativa mais curta ou mais longa.

A inicialização também executa automaticamente uma passagem conservadora de bootstrap de criptografia.
Essa passagem tenta reutilizar primeiro o armazenamento de segredos atual e a identidade atual de cross-signing, e evita redefinir o cross-signing a menos que você execute um fluxo explícito de reparo por bootstrap.

Se a inicialização encontrar um estado de bootstrap quebrado e `channels.matrix.password` estiver configurado, o OpenClaw poderá tentar um caminho de reparo mais estrito.
Se o dispositivo atual já estiver assinado pelo proprietário, o OpenClaw preservará essa identidade em vez de redefini-la automaticamente.

Atualizando a partir do plugin Matrix público anterior:

- O OpenClaw reutiliza automaticamente a mesma conta Matrix, token de acesso e identidade do dispositivo quando possível.
- Antes de qualquer alteração de migração Matrix acionável ser executada, o OpenClaw cria ou reutiliza um snapshot de recuperação em `~/Backups/openclaw-migrations/`.
- Se você usa várias contas Matrix, defina `channels.matrix.defaultAccount` antes de atualizar a partir do layout antigo de armazenamento plano para que o OpenClaw saiba qual conta deve receber esse estado legado compartilhado.
- Se o plugin anterior armazenava localmente uma chave de descriptografia de backup de chave de sala Matrix, a inicialização ou `openclaw doctor --fix` a importará automaticamente para o novo fluxo de chave de recuperação.
- Se o token de acesso Matrix mudou após a preparação da migração, a inicialização agora examina raízes de armazenamento irmãs com hash do token em busca de estado legado pendente de restauração antes de desistir da restauração automática do backup.
- Se o token de acesso Matrix mudar depois para a mesma conta, homeserver e usuário, o OpenClaw agora prefere reutilizar a raiz de armazenamento existente mais completa com hash do token em vez de começar com um diretório de estado Matrix vazio.
- Na próxima inicialização do gateway, chaves de sala com backup são restauradas automaticamente para o novo armazenamento de criptografia.
- Se o plugin antigo tinha chaves de sala apenas locais que nunca foram para backup, o OpenClaw avisará claramente. Essas chaves não podem ser exportadas automaticamente do armazenamento de criptografia rust anterior, então algum histórico criptografado antigo pode permanecer indisponível até ser recuperado manualmente.
- Consulte [Matrix migration](/pt-BR/install/migrating-matrix) para o fluxo completo de atualização, limites, comandos de recuperação e mensagens comuns de migração.

O estado criptografado em tempo de execução é organizado em raízes por conta, por usuário e por hash do token em
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Esse diretório contém o armazenamento de sincronização (`bot-storage.json`), armazenamento de criptografia (`crypto/`),
arquivo de chave de recuperação (`recovery-key.json`), snapshot do IndexedDB (`crypto-idb-snapshot.json`),
vinculações de thread (`thread-bindings.json`) e estado de verificação de inicialização (`startup-verification.json`)
quando esses recursos estão em uso.
Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor
raiz existente para essa tupla conta/homeserver/usuário, para que o estado anterior de sincronização, estado de criptografia, vinculações de thread
e estado de verificação de inicialização permaneçam visíveis.

### Modelo de armazenamento de criptografia Node

O Matrix E2EE neste plugin usa o caminho oficial de criptografia Rust do `matrix-js-sdk` no Node.
Esse caminho espera persistência baseada em IndexedDB quando você quer que o estado de criptografia sobreviva a reinicializações.

Atualmente o OpenClaw fornece isso no Node por meio de:

- uso de `fake-indexeddb` como o shim da API IndexedDB esperado pelo SDK
- restauração do conteúdo IndexedDB da criptografia Rust a partir de `crypto-idb-snapshot.json` antes de `initRustCrypto`
- persistência do conteúdo atualizado do IndexedDB de volta em `crypto-idb-snapshot.json` após a inicialização e durante o tempo de execução
- serialização da restauração e persistência do snapshot em relação a `crypto-idb-snapshot.json` com um bloqueio consultivo de arquivo para que a persistência do runtime do gateway e a manutenção da CLI não concorram sobre o mesmo arquivo de snapshot

Isso é infraestrutura de compatibilidade/armazenamento, não uma implementação de criptografia personalizada.
O arquivo de snapshot é um estado sensível de runtime e é armazenado com permissões restritivas de arquivo.
No modelo de segurança do OpenClaw, o host do gateway e o diretório de estado local do OpenClaw já estão dentro do limite de confiança do operador, então isso é principalmente uma questão operacional de durabilidade, e não um limite separado de confiança remota.

Melhoria planejada:

- adicionar suporte a SecretRef para material persistente de chave Matrix, para que chaves de recuperação e segredos relacionados de criptografia do armazenamento possam ser obtidos de provedores de segredos do OpenClaw em vez de apenas arquivos locais

## Gerenciamento de perfil

Atualize o auto-perfil Matrix para a conta selecionada com:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Adicione `--account <id>` quando quiser direcionar explicitamente uma conta Matrix nomeada.

O Matrix aceita URLs de avatar `mxc://` diretamente. Quando você passa uma URL de avatar `http://` ou `https://`, o OpenClaw primeiro faz o upload para o Matrix e armazena a URL `mxc://` resolvida de volta em `channels.matrix.avatarUrl` (ou na substituição da conta selecionada).

## Avisos automáticos de verificação

O Matrix agora publica avisos do ciclo de vida de verificação diretamente na DM estrita de verificação como mensagens `m.notice`.
Isso inclui:

- avisos de solicitação de verificação
- avisos de verificação pronta (com orientação explícita "Verify by emoji")
- avisos de início e conclusão de verificação
- detalhes SAS (emoji e decimal) quando disponíveis

Solicitações de verificação recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente pelo OpenClaw.
Para fluxos de autoverificação, o OpenClaw também inicia automaticamente o fluxo SAS quando a verificação por emoji fica disponível e confirma seu próprio lado.
Para solicitações de verificação de outro usuário/dispositivo Matrix, o OpenClaw aceita automaticamente a solicitação e então espera que o fluxo SAS prossiga normalmente.
Você ainda precisa comparar o SAS em emoji ou decimal no seu cliente Matrix e confirmar "They match" ali para concluir a verificação.

O OpenClaw não aceita automaticamente fluxos duplicados iniciados por ele mesmo de forma cega. A inicialização não cria uma nova solicitação quando uma solicitação de autoverificação já está pendente.

Avisos de sistema/protocolo de verificação não são encaminhados ao pipeline de chat do agente, então não produzem `NO_REPLY`.

### Higiene de dispositivos

Dispositivos Matrix antigos gerenciados pelo OpenClaw podem se acumular na conta e dificultar o entendimento da confiança em salas criptografadas.
Liste-os com:

```bash
openclaw matrix devices list
```

Remova dispositivos antigos gerenciados pelo OpenClaw com:

```bash
openclaw matrix devices prune-stale
```

### Reparo de Sala Direta

Se o estado de mensagem direta ficar fora de sincronia, o OpenClaw pode acabar com mapeamentos `m.direct` antigos que apontam para salas individuais antigas em vez da DM ativa. Inspecione o mapeamento atual para um par com:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repare com:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

O reparo mantém a lógica específica do Matrix dentro do plugin:

- ele prefere uma DM estrita 1:1 já mapeada em `m.direct`
- caso contrário, recorre a qualquer DM estrita 1:1 atualmente ingressada com esse usuário
- se não existir uma DM saudável, cria uma nova sala direta e reescreve `m.direct` para apontar para ela

O fluxo de reparo não exclui salas antigas automaticamente. Ele apenas escolhe a DM saudável e atualiza o mapeamento para que novos envios Matrix, avisos de verificação e outros fluxos de mensagem direta voltem a apontar para a sala correta.

## Threads

O Matrix oferece suporte a threads nativas do Matrix tanto para respostas automáticas quanto para envios da ferramenta de mensagens.

- `dm.sessionScope: "per-user"` (padrão) mantém o roteamento de DM do Matrix com escopo por remetente, então várias salas de DM podem compartilhar uma sessão quando resolvem para o mesmo par.
- `dm.sessionScope: "per-room"` isola cada sala de DM Matrix em sua própria chave de sessão, ainda usando autenticação e verificações de allowlist normais de DM.
- Vinculações explícitas de conversa Matrix ainda têm precedência sobre `dm.sessionScope`, então salas e threads vinculadas mantêm a sessão de destino escolhida.
- `threadReplies: "off"` mantém respostas no nível superior e mantém mensagens recebidas em thread na sessão pai.
- `threadReplies: "inbound"` responde dentro de uma thread apenas quando a mensagem recebida já estava nessa thread.
- `threadReplies: "always"` mantém respostas de sala em uma thread enraizada na mensagem que acionou e roteia essa conversa pela sessão com escopo de thread correspondente desde a primeira mensagem acionadora.
- `dm.threadReplies` substitui a configuração de nível superior apenas para DMs. Por exemplo, você pode manter threads de sala isoladas enquanto mantém DMs planas.
- Mensagens recebidas em thread incluem a mensagem raiz da thread como contexto extra do agente.
- Envios da ferramenta de mensagens agora herdam automaticamente a thread Matrix atual quando o destino é a mesma sala, ou o mesmo destino de usuário em DM, a menos que um `threadId` explícito seja fornecido.
- A reutilização do alvo de usuário DM na mesma sessão só entra em ação quando os metadados da sessão atual comprovam o mesmo par de DM na mesma conta Matrix; caso contrário, o OpenClaw recorre ao roteamento normal com escopo por usuário.
- Quando o OpenClaw detecta que uma sala DM Matrix colide com outra sala DM na mesma sessão DM Matrix compartilhada, ele publica um `m.notice` único nessa sala com a via de escape `/focus` quando vinculações de thread estão ativadas e com a dica `dm.sessionScope`.
- Vinculações de thread em runtime são suportadas para Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a thread agora funcionam em salas e DMs do Matrix.
- O `/focus` de sala/DM Matrix de nível superior cria uma nova thread Matrix e a vincula à sessão de destino quando `threadBindings.spawnSubagentSessions=true`.
- Executar `/focus` ou `/acp spawn --thread here` dentro de uma thread Matrix existente vincula essa thread atual.

## Vinculações de conversa ACP

Salas Matrix, DMs e threads Matrix existentes podem ser transformadas em workspaces ACP duráveis sem mudar a superfície de chat.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM Matrix, sala ou thread existente que você quer continuar usando.
- Em uma DM ou sala Matrix de nível superior, a DM/sala atual permanece como superfície de chat e mensagens futuras são roteadas para a sessão ACP criada.
- Dentro de uma thread Matrix existente, `--bind here` vincula essa thread atual no mesmo lugar.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no mesmo lugar.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Observações:

- `--bind here` não cria uma thread Matrix filha.
- `threadBindings.spawnAcpSessions` só é necessário para `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou vincular uma thread Matrix filha.

### Configuração de vinculação de thread

O Matrix herda padrões globais de `session.threadBindings` e também oferece substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flags de criação vinculada a thread no Matrix são opt-in:

- Defina `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nível superior crie e vincule novas threads Matrix.
- Defina `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sessões ACP a threads Matrix.

## Reações

O Matrix oferece suporte a ações de reação de saída, notificações de reação de entrada e reações de confirmação de entrada.

- O uso de ferramentas de reação de saída é controlado por `channels["matrix"].actions.reactions`.
- `react` adiciona uma reação a um evento Matrix específico.
- `reactions` lista o resumo atual de reações para um evento Matrix específico.
- `emoji=""` remove as reações da própria conta do bot nesse evento.
- `remove: true` remove apenas a reação do emoji especificado da conta do bot.

O escopo de reações de confirmação é resolvido nesta ordem:

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

Comportamento atual:

- `reactionNotifications: "own"` encaminha eventos `m.reaction` adicionados quando eles têm como alvo mensagens Matrix de autoria do bot.
- `reactionNotifications: "off"` desativa eventos de sistema de reação.
- Remoções de reação ainda não são sintetizadas em eventos de sistema porque o Matrix as expõe como redactions, não como remoções independentes de `m.reaction`.

## Contexto de histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala Matrix aciona o agente.
- Ele usa fallback para `messages.groupChat.historyLimit`. Se ambos não estiverem definidos, o padrão efetivo é `0`, então mensagens de sala com exigência de menção não são armazenadas em buffer. Defina `0` para desativar.
- O histórico de sala Matrix é apenas da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de sala Matrix é apenas pendente: o OpenClaw armazena em buffer mensagens de sala que ainda não acionaram uma resposta e então captura esse intervalo quando uma menção ou outro gatilho chega.
- A mensagem de gatilho atual não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada desse turno.
- Novas tentativas do mesmo evento Matrix reutilizam o snapshot original do histórico em vez de avançar para mensagens mais novas da sala.

## Visibilidade de contexto

O Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar de sala, como texto de resposta buscado, raízes de thread e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist de sala/usuário.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

Essa configuração afeta a visibilidade do contexto suplementar, não se a própria mensagem recebida pode acionar uma resposta.
A autorização de gatilho ainda vem de `groupPolicy`, `groups`, `groupAllowFrom` e das configurações de política de DM.

## Exemplo de política de DM e sala

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

Consulte [Groups](/pt-BR/channels/groups) para o comportamento de exigência de menção e allowlist.

Exemplo de pareamento para DMs Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário Matrix não aprovado continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de pareamento pendente e pode enviar uma resposta de lembrete novamente após um curto cooldown em vez de gerar um novo código.

Consulte [Pairing](/pt-BR/channels/pairing) para o fluxo compartilhado de pareamento de DM e layout de armazenamento.

## Aprovações de exec

O Matrix pode atuar como cliente de aprovação de exec para uma conta Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; usa fallback para `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Os aprovadores devem ser IDs de usuário Matrix como `@owner:example.org`. O Matrix ativa automaticamente aprovações nativas de exec quando `enabled` está sem configuração ou como `"auto"` e pelo menos um aprovador pode ser resolvido, seja de `execApprovals.approvers` ou de `channels.matrix.dm.allowFrom`. Defina `enabled: false` para desativar explicitamente o Matrix como cliente nativo de aprovação. Caso contrário, solicitações de aprovação recorrem a outras rotas de aprovação configuradas ou à política de fallback de aprovação de exec.

O roteamento nativo do Matrix hoje é apenas para exec:

- `channels.matrix.execApprovals.*` controla o roteamento nativo de DM/canal apenas para aprovações de exec.
- Aprovações de plugin ainda usam `/approve` compartilhado no mesmo chat mais qualquer encaminhamento `approvals.plugin` configurado.
- O Matrix ainda pode reutilizar `channels.matrix.dm.allowFrom` para autorização de aprovação de plugin quando puder inferir aprovadores com segurança, mas não expõe um caminho separado nativo de fanout DM/canal para aprovação de plugin.

Regras de entrega:

- `target: "dm"` envia prompts de aprovação para DMs dos aprovadores
- `target: "channel"` envia o prompt de volta para a sala ou DM Matrix de origem
- `target: "both"` envia para DMs dos aprovadores e para a sala ou DM Matrix de origem

Prompts de aprovação Matrix inicializam atalhos de reação na mensagem principal de aprovação:

- `✅` = permitir uma vez
- `❌` = negar
- `♾️` = permitir sempre quando essa decisão for permitida pela política efetiva de exec

Aprovadores podem reagir nessa mensagem ou usar os comandos com slash de fallback: `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Apenas aprovadores resolvidos podem aprovar ou negar. A entrega em canal inclui o texto do comando, então só ative `channel` ou `both` em salas confiáveis.

Prompts de aprovação Matrix reutilizam o planejador de aprovação compartilhado do núcleo. A superfície nativa específica do Matrix é apenas de transporte para aprovações de exec: roteamento de sala/DM e comportamento de enviar/atualizar/excluir mensagem.

Substituição por conta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentação relacionada: [Exec approvals](/pt-BR/tools/exec-approvals)

## Exemplo com múltiplas contas

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
Você pode dar escopo a entradas de sala herdadas para uma conta Matrix com `groups.<room>.account` (ou o legado `rooms.<room>.account`).
Entradas sem `account` permanecem compartilhadas entre todas as contas Matrix, e entradas com `account: "default"` ainda funcionam quando a conta padrão é configurada diretamente no nível superior `channels.matrix.*`.
Padrões parciais compartilhados de autenticação não criam por si só uma conta padrão implícita separada. O OpenClaw só sintetiza a conta de nível superior `default` quando esse padrão tem autenticação nova (`homeserver` mais `accessToken`, ou `homeserver` mais `userId` e `password`); contas nomeadas ainda podem permanecer detectáveis a partir de `homeserver` mais `userId` quando credenciais em cache satisfazem a autenticação depois.
Se o Matrix já tiver exatamente uma conta nomeada, ou `defaultAccount` apontar para uma chave existente de conta nomeada, a promoção de reparo/configuração de conta única para múltiplas contas preserva essa conta em vez de criar uma nova entrada `accounts.default`. Apenas chaves Matrix de autenticação/bootstrap são movidas para essa conta promovida; chaves compartilhadas de política de entrega permanecem no nível superior.
Defina `defaultAccount` quando quiser que o OpenClaw prefira uma conta Matrix nomeada para roteamento implícito, probing e operações da CLI.
Se você configurar várias contas nomeadas, defina `defaultAccount` ou passe `--account <id>` para comandos da CLI que dependem de seleção implícita de conta.
Passe `--account <id>` para `openclaw matrix verify ...` e `openclaw matrix devices ...` quando quiser substituir essa seleção implícita em um comando.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers Matrix privados/internos para proteção contra SSRF, a menos que você
faça opt-in explicitamente por conta.

Se seu homeserver estiver em localhost, um IP de LAN/Tailscale ou um hostname interno, ative
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

Esse opt-in só permite destinos privados/internos confiáveis. Homeservers públicos em texto claro, como
`http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Proxy para tráfego Matrix

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
O OpenClaw usa a mesma configuração de proxy para tráfego Matrix em runtime e sondas de status da conta.

## Resolução de destino

O Matrix aceita estes formatos de destino em qualquer lugar onde o OpenClaw pedir um destino de sala ou usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

A busca ao vivo no diretório usa a conta Matrix autenticada:

- Consultas de usuário consultam o diretório de usuários Matrix nesse homeserver.
- Consultas de sala aceitam IDs e aliases explícitos diretamente e depois recorrem à busca por nomes de salas ingressadas dessa conta.
- A busca por nome de sala ingressada é best-effort. Se um nome de sala não puder ser resolvido para um ID ou alias, ele será ignorado pela resolução de allowlist em runtime.

## Referência de configuração

- `enabled`: ativa ou desativa o canal.
- `name`: rótulo opcional para a conta.
- `defaultAccount`: ID de conta preferido quando várias contas Matrix estão configuradas.
- `homeserver`: URL do homeserver, por exemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta Matrix se conecte a homeservers privados/internos. Ative isso quando o homeserver resolver para `localhost`, um IP de LAN/Tailscale ou um host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para tráfego Matrix. Contas nomeadas podem substituir o padrão de nível superior com seu próprio `proxy`.
- `userId`: ID completo do usuário Matrix, por exemplo `@bot:example.org`.
- `accessToken`: token de acesso para autenticação baseada em token. Valores em texto simples e valores SecretRef são suportados para `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` em provedores env/file/exec. Consulte [Secrets Management](/pt-BR/gateway/secrets).
- `password`: senha para login baseado em senha. Valores em texto simples e valores SecretRef são suportados.
- `deviceId`: ID explícito do dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo para login por senha.
- `avatarUrl`: URL de auto-avatar armazenada para sincronização de perfil e atualizações `set-profile`.
- `initialSyncLimit`: limite de eventos de sincronização na inicialização.
- `encryption`: ativa E2EE.
- `allowlistOnly`: força comportamento apenas de allowlist para DMs e salas.
- `allowBots`: permite mensagens de outras contas Matrix do OpenClaw configuradas (`true` ou `"mentions"`).
- `groupPolicy`: `open`, `allowlist` ou `disabled`.
- `contextVisibility`: modo de visibilidade de contexto suplementar da sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist de IDs de usuário para tráfego de sala.
- Entradas de `groupAllowFrom` devem ser IDs completos de usuário Matrix. Nomes não resolvidos são ignorados em runtime.
- `historyLimit`: número máximo de mensagens de sala para incluir como contexto de histórico de grupo. Usa fallback para `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo é `0`. Defina `0` para desativar.
- `replyToMode`: `off`, `first`, `all` ou `batched`.
- `markdown`: configuração opcional de renderização Markdown para texto Matrix de saída.
- `streaming`: `off` (padrão), `partial`, `quiet`, `true` ou `false`. `partial` e `true` ativam atualizações de rascunho em modo prévia-primeiro com mensagens de texto Matrix normais. `quiet` usa avisos de prévia sem notificação para configurações auto-hospedadas com regra de push.
- `blockStreaming`: `true` ativa mensagens de progresso separadas para blocos concluídos do assistente enquanto o streaming de rascunho em prévia estiver ativo.
- `threadReplies`: `off`, `inbound` ou `always`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessão vinculada a thread.
- `startupVerification`: modo automático de solicitação de autoverificação na inicialização (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown antes de tentar novamente solicitações automáticas de verificação na inicialização.
- `textChunkLimit`: tamanho de chunk da mensagem de saída.
- `chunkMode`: `length` ou `newline`.
- `responsePrefix`: prefixo opcional de mensagem para respostas de saída.
- `ackReaction`: substituição opcional da reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição opcional do escopo da reação de confirmação (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificação de reação recebida (`own`, `off`).
- `mediaMaxMb`: limite de tamanho de mídia em MB para o tratamento de mídia Matrix. Aplica-se a envios de saída e ao processamento de mídia recebida.
- `autoJoin`: política de entrada automática em convites (`always`, `allowlist`, `off`). Padrão: `off`. Isso se aplica a convites Matrix em geral, incluindo convites no estilo DM, não apenas a convites de sala/grupo. O OpenClaw toma essa decisão no momento do convite, antes de conseguir classificar de forma confiável a sala ingressada como DM ou grupo.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `allowlist`. Entradas de alias são resolvidas para IDs de sala durante o tratamento do convite; o OpenClaw não confia no estado do alias declarado pela sala convidada.
- `dm`: bloco de política de DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla o acesso à DM depois que o OpenClaw entrou na sala e a classificou como DM. Não altera se um convite entra automaticamente.
- Entradas de `dm.allowFrom` devem ser IDs completos de usuário Matrix, a menos que você já as tenha resolvido por meio de busca ao vivo no diretório.
- `dm.sessionScope`: `per-user` (padrão) ou `per-room`. Use `per-room` quando quiser que cada sala de DM Matrix mantenha contexto separado, mesmo se o par for o mesmo.
- `dm.threadReplies`: substituição da política de thread apenas para DMs (`off`, `inbound`, `always`). Ela substitui a configuração de nível superior `threadReplies` tanto para posicionamento de resposta quanto para isolamento de sessão em DMs.
- `execApprovals`: entrega nativa Matrix para aprovação de exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuário Matrix autorizados a aprovar solicitações de exec. Opcional quando `dm.allowFrom` já identifica os aprovadores.
- `execApprovals.target`: `dm | channel | both` (padrão: `dm`).
- `accounts`: substituições nomeadas por conta. Valores de nível superior em `channels.matrix` atuam como padrões para essas entradas.
- `groups`: mapa de políticas por sala. Prefira IDs ou aliases de sala; nomes de sala não resolvidos são ignorados em runtime. A identidade da sessão/do grupo usa o ID estável da sala após a resolução, enquanto rótulos legíveis por humanos ainda vêm dos nomes das salas.
- `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta Matrix específica em configurações com múltiplas contas.
- `groups.<room>.allowBots`: substituição em nível de sala para remetentes de bots configurados (`true` ou `"mentions"`).
- `groups.<room>.users`: allowlist de remetentes por sala.
- `groups.<room>.tools`: substituições por sala para permitir/negar ferramentas.
- `groups.<room>.autoReply`: substituição em nível de sala para exigência de menção. `true` desativa a exigência de menção para essa sala; `false` a força de volta.
- `groups.<room>.skills`: filtro opcional de Skills por sala.
- `groups.<room>.systemPrompt`: trecho opcional de system prompt por sala.
- `rooms`: alias legado para `groups`.
- `actions`: controle de ferramentas por ação (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionados

- [Channels Overview](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Groups](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Channel Routing](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/pt-BR/gateway/security) — modelo de acesso e hardening
