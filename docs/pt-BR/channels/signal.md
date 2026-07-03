---
read_when:
    - Configurando o suporte ao Signal
    - Depuração de envio/recebimento do Signal
summary: Suporte ao Signal via signal-cli (daemon nativo ou contêiner bbernhard), caminhos de configuração e modelo de número
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Status: integração externa com CLI. O Gateway se comunica com `signal-cli` por HTTP — seja daemon nativo (JSON-RPC + SSE) ou contêiner bbernhard/signal-cli-rest-api (REST + WebSocket).

## Pré-requisitos

- OpenClaw instalado no seu servidor (fluxo Linux abaixo testado no Ubuntu 24).
- Um dos seguintes:
  - `signal-cli` disponível no host (modo nativo), **ou**
  - contêiner Docker `bbernhard/signal-cli-rest-api` (modo contêiner).
- Um número de telefone que possa receber um SMS de verificação (para o caminho de registro por SMS).
- Acesso ao navegador para captcha do Signal (`signalcaptchas.org`) durante o registro.

## Configuração rápida (iniciante)

1. Use um **número Signal separado** para o bot (recomendado).
2. Instale o plugin do OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Instale `signal-cli` (Java é necessário se você usar a build JVM).
4. Escolha um caminho de configuração:
   - **Caminho A (vínculo por QR):** `signal-cli link -n "OpenClaw"` e escaneie com o Signal.
   - **Caminho B (registro por SMS):** registre um número dedicado com captcha + verificação por SMS.
5. Configure o OpenClaw e reinicie o gateway.
6. Envie uma primeira DM e aprove o pareamento (`openclaw pairing approve signal <CODE>`).

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

Referência de campos:

| Campo        | Descrição                                            |
| ------------ | ---------------------------------------------------- |
| `account`    | Número de telefone do bot no formato E.164 (`+15551234567`) |
| `cliPath`    | Caminho para `signal-cli` (`signal-cli` se estiver no `PATH`) |
| `configPath` | Diretório de config do signal-cli passado como `--config` |
| `dmPolicy`   | Política de acesso por DM (`pairing` recomendado)    |
| `allowFrom`  | Números de telefone ou valores `uuid:<id>` permitidos para enviar DM |

## O que é

- Canal Signal via `signal-cli` (não libsignal incorporado).
- Roteamento determinístico: respostas sempre voltam para o Signal.
- DMs compartilham a sessão principal do agente; grupos são isolados (`agent:<agentId>:signal:group:<groupId>`).

## Escritas de configuração

Por padrão, o Signal tem permissão para gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desative com:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## O modelo de número (importante)

- O gateway se conecta a um **dispositivo Signal** (a conta `signal-cli`).
- Se você executar o bot na **sua conta Signal pessoal**, ele ignorará suas próprias mensagens (proteção contra loop).
- Para "eu mando mensagem para o bot e ele responde", use um **número de bot separado**.

## Caminho de configuração A: vincular conta Signal existente (QR)

1. Instale `signal-cli` (build JVM ou nativa).
2. Vincule uma conta de bot:
   - `signal-cli link -n "OpenClaw"` e então escaneie o QR no Signal.
3. Configure o Signal e inicie o gateway.

Exemplo:

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

Suporte a múltiplas contas: use `channels.signal.accounts` com configuração por conta e `name` opcional. Consulte [`gateway/configuration`](/pt-BR/gateway/config-channels#multi-account-all-channels) para o padrão compartilhado.

## Caminho de configuração B: registrar número de bot dedicado (SMS, Linux)

Use isto quando quiser um número de bot dedicado em vez de vincular uma conta existente do app Signal.

1. Obtenha um número que possa receber SMS (ou verificação por voz para telefones fixos).
   - Use um número de bot dedicado para evitar conflitos de conta/sessão.
2. Instale `signal-cli` no host do gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se você usar a build JVM (`signal-cli-${VERSION}.tar.gz`), instale o JRE 25+ primeiro.
Mantenha `signal-cli` atualizado; o upstream observa que versões antigas podem quebrar conforme as APIs do servidor Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se captcha for necessário:

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Conclua o captcha, copie o destino do link `signalcaptcha://...` de "Open Signal".
3. Execute a partir do mesmo IP externo da sessão do navegador quando possível.
4. Execute o registro novamente imediatamente (tokens de captcha expiram rapidamente):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configure o OpenClaw, reinicie o Gateway, verifique o canal:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Pareie seu remetente de DM:
   - Envie qualquer mensagem para o número do bot.
   - Aprove o código no servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salve o número do bot como contato no seu telefone para evitar "Unknown contact".

<Warning>
Registrar uma conta de número de telefone com `signal-cli` pode desautenticar a sessão principal do aplicativo Signal para esse número. Prefira um número dedicado para bot ou use o modo de vinculação por QR se precisar manter a configuração existente do aplicativo no telefone.
</Warning>

Referências upstream:

- README do `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vinculação: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Se você quiser gerenciar o `signal-cli` por conta própria (inicializações frias lentas da JVM, inicialização de contêiner ou CPUs compartilhadas), execute o daemon separadamente e aponte o OpenClaw para ele:

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

Isso ignora a geração automática de processo e a espera de inicialização dentro do OpenClaw. Para inicializações lentas ao gerar automaticamente, defina `channels.signal.startupTimeoutMs`.

## Modo de contêiner (bbernhard/signal-cli-rest-api)

Em vez de executar o `signal-cli` nativamente, você pode usar o contêiner Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Ele envolve o `signal-cli` por trás de uma API REST e uma interface WebSocket.

Requisitos:

- O contêiner **deve** ser executado com `MODE=json-rpc` para recebimento de mensagens em tempo real.
- Registre ou vincule sua conta Signal dentro do contêiner antes de conectar o OpenClaw.

Exemplo de serviço `docker-compose.yml`:

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

O campo `apiMode` controla qual protocolo o OpenClaw usa:

| Valor         | Comportamento                                                                        |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Padrão) Sonda ambos os transportes; o streaming valida o recebimento por WebSocket do contêiner |
| `"native"`    | Força o signal-cli nativo (JSON-RPC em `/api/v1/rpc`, SSE em `/api/v1/events`)       |
| `"container"` | Força o contêiner bbernhard (REST em `/v2/send`, WebSocket em `/v1/receive/{account}`) |

Quando `apiMode` é `"auto"`, o OpenClaw armazena em cache o modo detectado por 30 segundos para evitar sondagens repetidas. O recebimento do contêiner só é selecionado para streaming depois que `/v1/receive/{account}` faz upgrade para WebSocket, o que requer `MODE=json-rpc`.

O modo de contêiner oferece suporte às mesmas operações do canal Signal que o modo nativo quando o contêiner expõe APIs correspondentes: envios, recebimentos, anexos, indicadores de digitação, confirmações de leitura/visualização, reações, grupos e texto estilizado. O OpenClaw traduz suas chamadas RPC nativas do Signal para os payloads REST do contêiner, incluindo IDs de grupo `group.{base64(internal_id)}` e `text_mode: "styled"` para texto formatado.

Notas operacionais:

- Use `autoStart: false` com o modo de contêiner. O OpenClaw não deve gerar um daemon nativo quando `apiMode: "container"` está selecionado.
- Use `MODE=json-rpc` para recebimento. `MODE=normal` pode fazer `/v1/about` parecer íntegro, mas `/v1/receive/{account}` não faz upgrade para WebSocket, então o OpenClaw não selecionará o streaming de recebimento do contêiner no modo `auto`.
- Defina `apiMode: "container"` quando você souber que o `httpUrl` aponta para a API REST da bbernhard. Defina `apiMode: "native"` quando você souber que ele aponta para JSON-RPC/SSE do `signal-cli` nativo. Use `"auto"` quando a implantação puder variar.
- Downloads de anexos do contêiner respeitam os mesmos limites de bytes de mídia do modo nativo. Respostas grandes demais são rejeitadas antes de serem totalmente armazenadas em buffer quando o servidor envia `Content-Length`, e durante o streaming nos demais casos.

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até serem aprovadas (os códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- O pareamento é a troca de token padrão para DMs do Signal. Detalhes: [Pareamento](/pt-BR/channels/pairing)
- Remetentes somente UUID (de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quais grupos ou remetentes podem acionar respostas de grupo quando `allowlist` está definido; as entradas podem ser IDs de grupo do Signal (brutos, `group:<id>` ou `signal:group:<id>`), números de telefone de remetentes, valores `uuid:<id>` ou `*`.
- `channels.signal.groups["<group-id>" | "*"]` pode substituir o comportamento de grupo com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para substituições por conta em configurações com várias contas.
- Colocar um grupo do Signal na lista de permissões por meio de `groupAllowFrom` não desativa por si só o gating por menção. Uma entrada `channels.signal.groups["<group-id>"]` configurada especificamente processa todas as mensagens do grupo, a menos que `requireMention=true` esteja definido.
- Nota de runtime: se `channels.signal` estiver completamente ausente, o runtime volta para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

## Como funciona (comportamento)

- Modo nativo: `signal-cli` é executado como daemon; o Gateway lê eventos via SSE.
- Modo de contêiner: o Gateway envia via API REST e recebe via WebSocket.
- Mensagens recebidas são normalizadas no envelope de canal compartilhado.
- As respostas sempre são roteadas de volta para o mesmo número ou grupo.

## Mídia + limites

- Texto de saída é dividido em partes até `channels.signal.textChunkLimit` (padrão 4000).
- Divisão opcional por nova linha: defina `channels.signal.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- Anexos compatíveis (base64 obtido do `signal-cli`).
- Anexos de nota de voz usam o nome de arquivo do `signal-cli` como fallback de MIME quando `contentType` está ausente, para que a transcrição de áudio ainda consiga classificar memorandos de voz AAC.
- Limite padrão de mídia: `channels.signal.mediaMaxMb` (padrão 8).
- Use `channels.signal.ignoreAttachments` para ignorar o download de mídia.
- O contexto de histórico de grupo usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), com fallback para `messages.groupChat.historyLimit`. Defina `0` para desativar (padrão 50).

## Digitação + confirmações de leitura

- **Indicadores de digitação**: o OpenClaw envia sinais de digitação via `signal-cli sendTyping` e os atualiza enquanto uma resposta está em execução.
- **Confirmações de leitura**: quando `channels.signal.sendReadReceipts` é true, o OpenClaw encaminha confirmações de leitura para DMs permitidas.
- O signal-cli não expõe confirmações de leitura para grupos.

## Reações de status do ciclo de vida

Defina `messages.statusReactions.enabled: true` para permitir que o Signal mostre o ciclo de vida compartilhado de reações
queued/thinking/tool/compaction/done/error em turnos de entrada.
O Signal usa o timestamp da mensagem de entrada como alvo da reação; reações em grupo
são enviadas com o id do grupo do Signal mais o remetente original como
autor alvo.

As reações de status também exigem uma reação de confirmação e um
`messages.ackReactionScope` correspondente (`direct`, `group-all`, `group-mentions` ou `all`).
Defina `channels.signal.reactionLevel: "off"` para desabilitar as reações de status do Signal.
A ação `react` da ferramenta de mensagens permanece mais restrita: ela exige
`reactionLevel: "minimal"` ou `"extensive"`.

`messages.removeAckAfterReply: true` limpa a reação de status final após o
tempo de retenção configurado. Caso contrário, o Signal restaura a reação de confirmação inicial após
o estado final done/error.

## Reações (ferramenta de mensagens)

- Use `message action=react` com `channel=signal`.
- Alvos: E.164 ou UUID do remetente (use `uuid:<id>` da saída de pareamento; UUID sem prefixo também funciona).
- `messageId` é o timestamp do Signal para a mensagem à qual você está reagindo.
- Reações em grupo exigem `targetAuthor` ou `targetAuthorUuid`.

Exemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuração:

- `channels.signal.actions.reactions`: habilita/desabilita ações de reação (padrão true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desabilita reações do agente (a ferramenta de mensagens `react` retornará erro).
  - `minimal`/`extensive` habilita reações do agente e define o nível de orientação.
- Substituições por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reações de aprovação

Prompts de aprovação de exec e Plugin do Signal usam os blocos de roteamento de nível superior `approvals.exec` e
`approvals.plugin`. O Signal não tem um bloco
`channels.signal.execApprovals`.

- `👍` aprova uma vez.
- `👎` nega.
- Use `/approve <id> allow-always` quando uma solicitação oferecer aprovação persistente.

A resolução de reação de aprovação exige aprovadores explícitos do Signal de
`channels.signal.allowFrom`, `channels.signal.defaultTo` ou dos campos correspondentes no nível da conta.
Prompts de aprovação de exec diretos no mesmo chat ainda podem suprimir o fallback local `/approve` duplicado
sem aprovadores explícitos; aprovações em grupo sem aprovador mantêm o fallback local visível.

## Alvos de entrega (CLI/cron)

- DMs: `signal:+15551234567` (ou E.164 simples).
- DMs por UUID: `uuid:<id>` (ou UUID sem prefixo).
- Grupos: `signal:group:<groupId>`.
- Nomes de usuário: `username:<name>` (se compatível com sua conta do Signal).

## Aliases

Configure aliases quando quiser nomes estáveis para alvos recorrentes do Signal.
Aliases são apenas configuração do lado do OpenClaw; eles não criam nem editam contatos do Signal.

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

Use aliases em qualquer lugar onde alvos de entrega do Signal sejam aceitos:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Aliases por conta herdam os aliases de nível superior e podem adicionar ou substituir nomes:

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

`openclaw directory peers list --channel signal` e
`openclaw directory groups list --channel signal` listam aliases configurados. O
diretório do Signal é baseado em configuração; ele não consulta contatos do Signal ao vivo nem
altera a conta do Signal.

## Solução de problemas

Execute esta sequência primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Depois confirme o estado de pareamento de DM, se necessário:

```bash
openclaw pairing list signal
```

Falhas comuns:

- Daemon acessível, mas sem respostas: verifique as configurações da conta/daemon (`httpUrl`, `account`) e o modo de recebimento.
- DMs ignoradas: o remetente está com aprovação de pareamento pendente.
- Mensagens de grupo ignoradas: o bloqueio por remetente/menção do grupo impede a entrega.
- Erros de validação de configuração após edições: execute `openclaw doctor --fix`.
- Signal ausente dos diagnósticos: confirme `channels.signal.enabled: true`.

Verificações extras:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para o fluxo de triagem: [/channels/troubleshooting](/pt-BR/channels/troubleshooting).

## Notas de segurança

- `signal-cli` armazena chaves da conta localmente (geralmente em `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta do Signal antes de migrar ou reconstruir o servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"`, a menos que você queira explicitamente acesso mais amplo a DMs.
- A verificação por SMS só é necessária para fluxos de registro ou recuperação, mas perder o controle do número/conta pode complicar um novo registro.

## Referência de configuração (Signal)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: habilita/desabilita a inicialização do canal.
- `channels.signal.apiMode`: `auto | native | container` (padrão: auto). Veja [Modo container](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 da conta do bot.
- `channels.signal.cliPath`: caminho para `signal-cli`.
- `channels.signal.configPath`: diretório opcional de `signal-cli --config`.
- `channels.signal.httpUrl`: URL completa do daemon (substitui host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind do daemon (padrão 127.0.0.1:8080).
- `channels.signal.autoStart`: inicia o daemon automaticamente (padrão true se `httpUrl` não estiver definido).
- `channels.signal.startupTimeoutMs`: tempo limite de espera de inicialização em ms (limite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ignora downloads de anexos.
- `channels.signal.ignoreStories`: ignora stories do daemon.
- `channels.signal.sendReadReceipts`: encaminha confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.signal.allowFrom`: allowlist de DM (E.164 ou `uuid:<id>`). `open` exige `"*"`. Signal não tem nomes de usuário; use ids de telefone/UUID.
- `channels.signal.aliases`: aliases do lado do OpenClaw para alvos de entrega de DM ou grupo.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.signal.groupAllowFrom`: allowlist de grupo; aceita IDs de grupo do Signal (brutos, `group:<id>` ou `signal:group:<id>`), números E.164 do remetente ou valores `uuid:<id>`.
- `channels.signal.groups`: substituições por grupo indexadas pelo id do grupo do Signal (ou `"*"`). Campos compatíveis: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão por conta de `channels.signal.groups` para configurações com várias contas.
- `channels.signal.accounts.<id>.aliases`: aliases por conta, mesclados com aliases de nível superior.
- `channels.signal.historyLimit`: máximo de mensagens de grupo a incluir como contexto (0 desabilita).
- `channels.signal.dmHistoryLimit`: limite de histórico de DM em turnos do usuário. Substituições por usuário: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho de fragmento de saída (caracteres).
- `channels.signal.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da fragmentação por comprimento.
- `channels.signal.mediaMaxMb`: limite de mídia de entrada/saída (MB).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal não oferece suporte a menções nativas).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
