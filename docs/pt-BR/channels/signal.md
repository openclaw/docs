---
read_when:
    - Configurando o suporte ao Signal
    - Depuração do envio/recebimento no Signal
summary: Suporte ao Signal via signal-cli (daemon nativo ou contêiner bbernhard), caminhos de configuração e modelo de numeração
title: Signal
x-i18n:
    generated_at: "2026-07-11T23:45:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal é um plugin de canal disponível para download (`@openclaw/signal`). O Gateway se comunica com o `signal-cli` por HTTP: seja pelo daemon nativo (JSON-RPC + SSE), seja pelo contêiner [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). O OpenClaw não incorpora a libsignal.

## O modelo de números (leia isto primeiro)

- O Gateway se conecta a um **dispositivo Signal**: a conta do `signal-cli`.
- Executar o bot na **sua conta pessoal do Signal** faz com que ele ignore suas próprias mensagens (proteção contra loops).
- Para "eu envio uma mensagem ao bot e ele responde", use um **número separado para o bot**.

## Instalação

```bash
openclaw plugins install @openclaw/signal
```

Especificações de plugin sem prefixo tentam primeiro o ClawHub e, depois, usam o npm como alternativa. Force uma origem com `openclaw plugins install clawhub:@openclaw/signal` ou `npm:@openclaw/signal`. `plugins install` registra e ativa o plugin; nenhuma etapa separada de `enable` é necessária. Consulte [Plugins](/pt-BR/tools/plugin) para ver as regras gerais de instalação.

## Configuração rápida

<Steps>
  <Step title="Escolha um número">
    Use um **número separado do Signal** para o bot (recomendado).
  </Step>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Execute a configuração guiada">
    ```bash
    openclaw channels add
    ```
    O assistente detecta se o `signal-cli` está no `PATH` e, quando não está, oferece a instalação: baixa a compilação nativa oficial do GraalVM no Linux x86-64 ou instala via Homebrew no macOS e em outras arquiteturas. Em seguida, solicita o número do bot e o caminho do `signal-cli`.
  </Step>
  <Step title="Vincule ou registre a conta">
    - **Vinculação por QR (mais rápida):** `signal-cli link -n "OpenClaw"` e, em seguida, escaneie com o Signal. Consulte o [Caminho A](#setup-path-a-link-existing-signal-account-qr).
    - **Registro por SMS:** número dedicado com captcha + verificação por SMS. Consulte o [Caminho B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Verifique e faça o pareamento">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Envie uma primeira mensagem direta e aprove o pareamento: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

Configuração mínima:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| Campo        | Descrição                                                      |
| ------------ | -------------------------------------------------------------- |
| `account`    | Número de telefone do bot no formato E.164 (`+15551234567`)     |
| `cliPath`    | Caminho para o `signal-cli` (`signal-cli` se estiver no `PATH`) |
| `configPath` | Diretório de configuração do signal-cli passado como `--config` |
| `dmPolicy`   | Política de acesso a mensagens diretas (`pairing` recomendado) |
| `allowFrom`  | Números de telefone ou valores `uuid:<id>` autorizados a enviar mensagens diretas |

Compatibilidade com várias contas: use `channels.signal.accounts` com configuração por conta e `name` opcional. Consulte [Canais com várias contas](/pt-BR/gateway/config-channels#multi-account-all-channels) para ver o padrão compartilhado.

## O que é

- Roteamento determinístico: as respostas sempre retornam ao Signal.
- As mensagens diretas compartilham a sessão principal do agente; os grupos são isolados (`agent:<agentId>:signal:group:<groupId>`).
- Por padrão, o Signal pode gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`). Desative com `channels.signal.configWrites: false`.

## Caminho de configuração A: vincular uma conta existente do Signal (QR)

1. Instale o `signal-cli` (compilação JVM ou nativa) ou deixe que `openclaw channels add` faça a instalação.
2. Vincule uma conta de bot: `signal-cli link -n "OpenClaw"` e, em seguida, escaneie o QR no Signal.
3. Configure o Signal e inicie o Gateway.

## Caminho de configuração B: registrar um número dedicado para o bot (SMS, Linux)

Use esta opção para um número dedicado ao bot, em vez de vincular uma conta existente do aplicativo Signal. O fluxo abaixo foi testado no Ubuntu 24.

1. Obtenha um número que possa receber SMS (ou verificação por voz, no caso de telefones fixos). Um número dedicado ao bot evita conflitos de conta ou sessão.
2. Instale o `signal-cli` no host do Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se você usar a compilação JVM (`signal-cli-${VERSION}.tar.gz`), instale primeiro um JRE. Mantenha o `signal-cli` atualizado; o projeto upstream informa que versões antigas podem deixar de funcionar conforme as APIs do servidor do Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se um captcha for necessário (é preciso acesso a um navegador para concluir esta etapa):

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Conclua o captcha e copie o destino do link `signalcaptcha://...` de "Open Signal".
3. Execute a partir do mesmo IP externo da sessão do navegador quando possível (os tokens de captcha expiram rapidamente).
4. Registre e verifique imediatamente:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configure o OpenClaw, reinicie o Gateway e verifique o canal:

```bash
# Se você executar o Gateway como um serviço systemd de usuário:
systemctl --user restart openclaw-gateway.service

# Em seguida, verifique:
openclaw doctor
openclaw channels status --probe
```

5. Faça o pareamento do remetente das suas mensagens diretas:
   - Envie qualquer mensagem para o número do bot.
   - Aprove no servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salve o número do bot como contato no seu telefone para evitar "Unknown contact".

<Warning>
Registrar uma conta de número de telefone com o `signal-cli` pode desautenticar a sessão principal do aplicativo Signal para esse número. Prefira um número dedicado ao bot ou use o modo de vinculação por QR para manter a configuração atual do aplicativo no telefone.
</Warning>

Referências upstream:

- README do `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vinculação: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Para gerenciar o `signal-cli` por conta própria (inicializações a frio lentas da JVM, inicialização de contêiner, CPUs compartilhadas), execute o daemon separadamente e aponte o OpenClaw para ele:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Isso ignora a inicialização automática e a espera de inicialização do OpenClaw. Para inicializações automáticas lentas, defina `channels.signal.startupTimeoutMs`.

## Modo de contêiner (bbernhard/signal-cli-rest-api)

Em vez de executar o `signal-cli` nativamente, use o contêiner Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), que disponibiliza o `signal-cli` por meio de uma interface REST + WebSocket.

Requisitos:

- O contêiner **deve** ser executado com `MODE=json-rpc` para receber mensagens em tempo real.
- Registre ou vincule sua conta do Signal dentro do contêiner antes de conectar o OpenClaw.

Exemplo de serviço em `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Configuração do OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // ou "auto" para detectar automaticamente
    },
  },
}
```

`apiMode` controla qual protocolo o OpenClaw usa:

| Valor         | Comportamento                                                                            |
| ------------- | ---------------------------------------------------------------------------------------- |
| `"auto"`      | (Padrão) Sonda ambos os transportes; o streaming valida o recebimento por WebSocket do contêiner |
| `"native"`    | Força o signal-cli nativo (JSON-RPC em `/api/v1/rpc`, SSE em `/api/v1/events`)           |
| `"container"` | Força o contêiner bbernhard (REST em `/v2/send`, WebSocket em `/v1/receive/{account}`)    |

Quando `apiMode` é `"auto"`, o OpenClaw armazena em cache o modo detectado por 30 segundos para cada URL de daemon, evitando sondagens repetidas (o modo nativo tem prioridade quando ambos os transportes estão íntegros). O recebimento pelo contêiner só é selecionado para streaming depois que `/v1/receive/{account}` é atualizado para WebSocket, o que requer `MODE=json-rpc`.

O modo de contêiner é compatível com as mesmas operações do Signal que o modo nativo quando o contêiner expõe APIs correspondentes: envio, recebimento, anexos, indicadores de digitação, confirmações de leitura/visualização, reações, grupos e texto estilizado. O OpenClaw converte chamadas RPC nativas do Signal em cargas REST do contêiner, incluindo IDs de grupo `group.{base64(internal_id)}` e `text_mode: "styled"` para texto formatado.

Observações operacionais:

- Use `autoStart: false` com o modo de contêiner; o OpenClaw não deve iniciar um daemon nativo quando `apiMode: "container"` estiver selecionado.
- Use `MODE=json-rpc` para recebimento. `MODE=normal` pode fazer `/v1/about` parecer íntegro, mas `/v1/receive/{account}` não será atualizado para WebSocket; portanto, o OpenClaw não selecionará o streaming de recebimento do contêiner no modo `auto`.
- Defina `apiMode: "container"` quando `httpUrl` apontar para a API REST do bbernhard, `"native"` quando apontar para o JSON-RPC/SSE nativo do `signal-cli` e `"auto"` quando a implantação puder variar.
- Os downloads de anexos do contêiner respeitam os mesmos limites de bytes de mídia do modo nativo. Respostas grandes demais são rejeitadas antes de serem totalmente armazenadas em buffer quando o servidor envia `Content-Length` e, nos demais casos, durante o streaming.

## Controle de acesso (mensagens diretas + grupos)

Mensagens diretas:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até a aprovação (os códigos expiram após 1 hora).
- Aprove por meio de `openclaw pairing list signal` e `openclaw pairing approve signal <CODE>`.
- O pareamento é a troca de tokens padrão para mensagens diretas do Signal. Detalhes: [Pareamento](/pt-BR/channels/pairing)
- Remetentes identificados somente por UUID (proveniente de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quais grupos ou remetentes podem acionar respostas em grupo quando `allowlist` está definido; as entradas podem ser IDs de grupo do Signal (brutos, `group:<id>` ou `signal:group:<id>`), números de telefone de remetentes, valores `uuid:<id>` ou `*`.
- `channels.signal.groups["<group-id>" | "*"]` pode substituir o comportamento do grupo com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para substituições por conta em configurações com várias contas.
- Incluir um grupo na lista de permissões por meio de `groupAllowFrom` não desativa, por si só, a exigência de menção. Uma entrada `channels.signal.groups["<group-id>"]` configurada especificamente processa todas as mensagens do grupo, a menos que `requireMention: true` seja definido explicitamente.
- Observação de execução: se `channels.signal` estiver completamente ausente, a execução usa `groupPolicy="allowlist"` como alternativa para verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

## Como funciona (comportamento)

- Modo nativo: o `signal-cli` é executado como um daemon; o Gateway lê os eventos via SSE.
- Modo de contêiner: o Gateway envia pela API REST e recebe via WebSocket.
- As mensagens recebidas são normalizadas no envelope de canal compartilhado.
- As respostas sempre são roteadas de volta ao mesmo número ou grupo.
- As respostas a mensagens recebidas incluem metadados nativos de citação do Signal quando o backend aceita o autor e o carimbo de data e hora da mensagem recebida; se os metadados de citação estiverem ausentes ou forem rejeitados, o OpenClaw envia a resposta como uma mensagem normal.
- Configure o uso de citações nativas com `channels.signal.replyToMode = off | first | all | batched` ou `channels.signal.replyToModeByChatType.direct/group` para substituições por tipo de conversa. Os valores no nível da conta em `channels.signal.accounts.<id>` têm precedência.

## Mídia + limites

- O texto de saída é dividido em partes conforme `channels.signal.textChunkLimit` (padrão: 4000).
- Divisão opcional por novas linhas: defina `channels.signal.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafos) antes da divisão por comprimento.
- Há suporte para anexos (base64 obtido do `signal-cli`).
- Anexos de mensagens de voz usam o nome de arquivo do `signal-cli` como alternativa para o tipo MIME quando `contentType` está ausente, permitindo que a transcrição de áudio ainda classifique memorandos de voz AAC.
- Limite de mídia padrão: `channels.signal.mediaMaxMb` (padrão: 8).
- Use `channels.signal.ignoreAttachments` para ignorar o download de mídia.
- O contexto do histórico de grupos usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), recorrendo a `messages.groupChat.historyLimit`. Defina como `0` para desativar (padrão: 50).

## Indicadores de digitação + confirmações de leitura

- **Indicadores de digitação**: o OpenClaw envia sinais de digitação por meio de `signal-cli sendTyping` e os atualiza enquanto uma resposta está sendo gerada.
- **Confirmações de leitura**: quando `channels.signal.sendReadReceipts` é verdadeiro, o OpenClaw encaminha confirmações de leitura para mensagens diretas permitidas.
- O `signal-cli` não disponibiliza confirmações de leitura para grupos.

## Reações de status do ciclo de vida

Defina `messages.statusReactions.enabled: true` para permitir que o Signal mostre o ciclo de vida compartilhado de reações de enfileiramento/raciocínio/ferramenta/Compaction/conclusão/erro nas interações recebidas. O Signal usa o carimbo de data/hora da mensagem recebida como alvo da reação; as reações em grupo são enviadas com o ID do grupo do Signal e o remetente original como autor-alvo.

As reações de status também exigem uma reação de confirmação e um `messages.ackReactionScope` correspondente (`direct`, `group-all`, `group-mentions` ou `all`). Defina `channels.signal.reactionLevel: "off"` para desativar as reações de status do Signal.

`messages.removeAckAfterReply: true` remove a reação de status final após o tempo de permanência configurado. Caso contrário, o Signal restaura a reação de confirmação inicial após o estado final de conclusão/erro.

## Reações (ferramenta de mensagens)

Use `message action=react` com `channel=signal`.

- Alvos: E.164 ou UUID do remetente (use `uuid:<id>` da saída do pareamento; um UUID sem prefixo também funciona).
- `messageId` é o carimbo de data/hora do Signal referente à mensagem à qual você está reagindo.
- Reações em grupo exigem `targetAuthor` ou `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuração:

- `channels.signal.actions.reactions`: ativa/desativa ações de reação (padrão: verdadeiro).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`).
  - `off`/`ack` desativa as reações do agente (a ação `react` da ferramenta de mensagens retorna erro).
  - `minimal`/`extensive` ativa as reações do agente e define o nível de orientação.
- Substituições por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reações de aprovação

As solicitações de aprovação de execução e de Plugin do Signal usam os blocos de roteamento de nível superior `approvals.exec` e `approvals.plugin`. O Signal não tem um bloco `channels.signal.execApprovals`.

- `👍` aprova uma vez.
- `👎` nega.
- Use `/approve <id> allow-always` quando uma solicitação oferecer aprovação persistente.

A resolução de reações de aprovação exige aprovadores explícitos do Signal em `channels.signal.allowFrom`, `channels.signal.defaultTo` ou nos campos correspondentes no nível da conta. Solicitações de aprovação de execução diretas no mesmo chat ainda podem suprimir a alternativa local duplicada `/approve` sem aprovadores explícitos; aprovações em grupo sem aprovadores mantêm a alternativa local visível.

## Destinos de entrega (CLI/cron)

- Mensagens diretas: `signal:+15551234567` (ou E.164 simples).
- Mensagens diretas por UUID: `uuid:<id>` (ou UUID simples).
- Grupos: `signal:group:<groupId>`.
- Nomes de usuário: `username:<name>` (se compatível com sua conta do Signal).

## Aliases

Configure aliases para usar nomes estáveis em destinos recorrentes do Signal. Os aliases são apenas configurações do lado do OpenClaw; eles não criam nem editam contatos do Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Use aliases em qualquer lugar que aceite destinos de entrega do Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Os aliases por conta herdam os aliases de nível superior e podem adicionar ou substituir nomes:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` e `openclaw directory groups list --channel signal` listam os aliases configurados. O diretório do Signal é baseado em configuração; ele não consulta em tempo real os contatos do Signal nem modifica a conta do Signal.

## Solução de problemas

Execute primeiro esta sequência:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Em seguida, confirme o estado do pareamento de mensagens diretas, se necessário:

```bash
openclaw pairing list signal
```

Falhas comuns:

- Daemon acessível, mas sem respostas: verifique as configurações da conta/do daemon (`httpUrl`, `account`) e o modo de recebimento.
- Mensagens diretas ignoradas: o remetente está aguardando aprovação de pareamento.
- Mensagens de grupo ignoradas: as restrições de remetente/menção do grupo bloqueiam a entrega.
- Erros de validação da configuração após edições: execute `openclaw doctor --fix`.
- Signal ausente dos diagnósticos: confirme `channels.signal.enabled: true`.

Verificações adicionais:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para o fluxo de triagem: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

## Observações de segurança

- O `signal-cli` armazena as chaves da conta localmente (normalmente em `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta do Signal antes de uma migração ou reconstrução do servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"`, a menos que você queira explicitamente um acesso mais amplo às mensagens diretas.
- A verificação por SMS só é necessária para fluxos de registro ou recuperação, mas perder o controle do número/da conta pode dificultar um novo registro.

## Referência de configuração (Signal)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: ativa/desativa a inicialização do canal.
- `channels.signal.apiMode`: `auto | native | container` (padrão: auto). Consulte [Modo de contêiner](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 da conta do bot.
- `channels.signal.cliPath`: caminho para o `signal-cli`.
- `channels.signal.configPath`: diretório opcional de `signal-cli --config`.
- `channels.signal.httpUrl`: URL completa do daemon (substitui host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: endereço de escuta do daemon (padrão: `127.0.0.1:8080`).
- `channels.signal.autoStart`: inicia automaticamente o daemon (padrão: verdadeiro se `httpUrl` não estiver definido).
- `channels.signal.startupTimeoutMs`: tempo limite de espera da inicialização em ms (mínimo de 1000, limite de 120000; padrão: 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ignora downloads de anexos.
- `channels.signal.ignoreStories`: ignora stories provenientes do daemon.
- `channels.signal.sendReadReceipts`: encaminha confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.signal.allowFrom`: lista de permissões de mensagens diretas (E.164 ou `uuid:<id>`). `open` exige `"*"`. O Signal não tem nomes de usuário; use IDs de telefone/UUID.
- `channels.signal.aliases`: aliases do lado do OpenClaw para destinos de entrega de mensagens diretas ou em grupo.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.signal.groupAllowFrom`: lista de permissões de grupos; aceita IDs de grupos do Signal (simples, `group:<id>` ou `signal:group:<id>`), números E.164 dos remetentes ou valores `uuid:<id>`.
- `channels.signal.groups`: substituições por grupo, indexadas pelo ID do grupo do Signal (ou `"*"`). Campos compatíveis: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão de `channels.signal.groups` por conta para configurações com várias contas.
- `channels.signal.accounts.<id>.aliases`: aliases por conta, mesclados com os aliases de nível superior.
- `channels.signal.replyToMode`: modo nativo de citação de resposta, `off | first | all | batched` (padrão: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: substituições da citação de resposta nativa por tipo de chat.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: substituições da citação de resposta por conta.
- `channels.signal.historyLimit`: número máximo de mensagens de grupo a incluir como contexto (0 desativa).
- `channels.signal.dmHistoryLimit`: limite do histórico de mensagens diretas em interações do usuário. Substituições por usuário: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho das partes de saída em caracteres (padrão: 4000).
- `channels.signal.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafos) antes da divisão por comprimento.
- `channels.signal.mediaMaxMb`: limite de mídia recebida/enviada em MB (padrão: 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`). Consulte [Reações](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (padrão: `own`) — define quando o agente é notificado sobre reações recebidas de outras pessoas.
- `channels.signal.reactionAllowlist`: remetentes cujas reações notificam o agente quando `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: controles de streaming no modo de blocos compartilhados entre canais. Consulte [Streaming](/pt-BR/concepts/streaming).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o Signal não oferece suporte a menções nativas).
- `messages.groupChat.mentionPatterns` (alternativa global).
- `messages.responsePrefix`.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento do chat em grupo e restrições de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
