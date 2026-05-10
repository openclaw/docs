---
read_when:
    - Configuração do suporte ao Signal
    - Depuração de envio/recebimento do Signal
summary: Suporte ao Signal via signal-cli (daemon nativo ou contêiner bbernhard), caminhos de configuração e modelo de número
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Status: integração de CLI externa. O Gateway conversa com `signal-cli` por HTTP — seja daemon nativo (JSON-RPC + SSE) ou contêiner bbernhard/signal-cli-rest-api (REST + WebSocket).

## Pré-requisitos

- OpenClaw instalado no seu servidor (fluxo Linux abaixo testado no Ubuntu 24).
- Um dos seguintes:
  - `signal-cli` disponível no host (modo nativo), **ou**
  - contêiner Docker `bbernhard/signal-cli-rest-api` (modo contêiner).
- Um número de telefone que possa receber um SMS de verificação (para o caminho de registro por SMS).
- Acesso ao navegador para o captcha do Signal (`signalcaptchas.org`) durante o registro.

## Configuração rápida (iniciante)

1. Use um **número separado do Signal** para o bot (recomendado).
2. Instale `signal-cli` (Java é necessário se você usar a build JVM).
3. Escolha um caminho de configuração:
   - **Caminho A (vínculo por QR):** `signal-cli link -n "OpenClaw"` e escaneie com o Signal.
   - **Caminho B (registro por SMS):** registre um número dedicado com captcha + verificação por SMS.
4. Configure o OpenClaw e reinicie o gateway.
5. Envie uma primeira DM e aprove o pareamento (`openclaw pairing approve signal <CODE>`).

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

| Campo       | Descrição                                       |
| ----------- | ------------------------------------------------- |
| `account`   | Número de telefone do bot no formato E.164 (`+15551234567`) |
| `cliPath`   | Caminho para `signal-cli` (`signal-cli` se estiver no `PATH`)  |
| `dmPolicy`  | Política de acesso a DM (`pairing` recomendado)          |
| `allowFrom` | Números de telefone ou valores `uuid:<id>` autorizados a enviar DM |

## O que é

- Canal Signal via `signal-cli` (não libsignal embutido).
- Roteamento determinístico: as respostas sempre voltam para o Signal.
- DMs compartilham a sessão principal do agente; grupos são isolados (`agent:<agentId>:signal:group:<groupId>`).

## Gravações de configuração

Por padrão, o Signal tem permissão para gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desative com:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## O modelo de número (importante)

- O gateway se conecta a um **dispositivo Signal** (a conta `signal-cli`).
- Se você executar o bot na **sua conta pessoal do Signal**, ele vai ignorar suas próprias mensagens (proteção contra loop).
- Para "eu envio mensagem para o bot e ele responde", use um **número separado para o bot**.

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

Suporte a múltiplas contas: use `channels.signal.accounts` com configuração por conta e `name` opcional. Veja [`gateway/configuration`](/pt-BR/gateway/config-channels#multi-account-all-channels) para o padrão compartilhado.

## Caminho de configuração B: registrar número de bot dedicado (SMS, Linux)

Use isto quando quiser um número dedicado para o bot em vez de vincular uma conta existente do app Signal.

1. Obtenha um número que possa receber SMS (ou verificação por voz para telefones fixos).
   - Use um número dedicado para o bot para evitar conflitos de conta/sessão.
2. Instale `signal-cli` no host do Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se você usar a build JVM (`signal-cli-${VERSION}.tar.gz`), instale primeiro o JRE 25+.
Mantenha `signal-cli` atualizado; o upstream observa que versões antigas podem quebrar conforme as APIs do servidor Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se captcha for necessário:

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Conclua o captcha, copie o destino do link `signalcaptcha://...` em "Open Signal".
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
Registrar uma conta de número de telefone com `signal-cli` pode desautenticar a sessão principal do app Signal para esse número. Prefira um número dedicado para o bot, ou use o modo de vínculo por QR se precisar manter sua configuração existente do app no telefone.
</Warning>

Referências upstream:

- README do `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vínculo: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Se quiser gerenciar `signal-cli` por conta própria (partidas frias lentas da JVM, inicialização de contêiner ou CPUs compartilhadas), execute o daemon separadamente e aponte o OpenClaw para ele:

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

Isso pula o auto-spawn e a espera de inicialização dentro do OpenClaw. Para partidas lentas ao fazer auto-spawn, defina `channels.signal.startupTimeoutMs`.

## Modo contêiner (bbernhard/signal-cli-rest-api)

Em vez de executar `signal-cli` nativamente, você pode usar o contêiner Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Ele envolve `signal-cli` por trás de uma API REST e interface WebSocket.

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

| Valor         | Comportamento                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Padrão) Sonda ambos os transportes; o streaming valida o recebimento por WebSocket do contêiner    |
| `"native"`    | Força signal-cli nativo (JSON-RPC em `/api/v1/rpc`, SSE em `/api/v1/events`)         |
| `"container"` | Força contêiner bbernhard (REST em `/v2/send`, WebSocket em `/v1/receive/{account}`) |

Quando `apiMode` é `"auto"`, o OpenClaw armazena o modo detectado em cache por 30 segundos para evitar sondagens repetidas. O recebimento por contêiner só é selecionado para streaming depois que `/v1/receive/{account}` faz upgrade para WebSocket, o que requer `MODE=json-rpc`.

O modo contêiner dá suporte às mesmas operações do canal Signal que o modo nativo quando o contêiner expõe APIs correspondentes: envios, recebimentos, anexos, indicadores de digitação, recibos de leitura/visualização, reações, grupos e texto estilizado. O OpenClaw traduz suas chamadas RPC nativas do Signal para os payloads REST do contêiner, incluindo IDs de grupo `group.{base64(internal_id)}` e `text_mode: "styled"` para texto formatado.

Notas operacionais:

- Use `autoStart: false` com o modo contêiner. O OpenClaw não deve iniciar um daemon nativo quando `apiMode: "container"` estiver selecionado.
- Use `MODE=json-rpc` para recebimento. `MODE=normal` pode fazer `/v1/about` parecer saudável, mas `/v1/receive/{account}` não faz upgrade para WebSocket, então o OpenClaw não selecionará o streaming de recebimento por contêiner no modo `auto`.
- Defina `apiMode: "container"` quando você souber que `httpUrl` aponta para a API REST da bbernhard. Defina `apiMode: "native"` quando souber que ele aponta para JSON-RPC/SSE nativo do `signal-cli`. Use `"auto"` quando a implantação puder variar.
- Downloads de anexos do contêiner respeitam os mesmos limites de bytes de mídia do modo nativo. Respostas grandes demais são rejeitadas antes de serem totalmente colocadas em buffer quando o servidor envia `Content-Length`, e durante o streaming caso contrário.

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até a aprovação (códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- O pareamento é a troca de token padrão para DMs do Signal. Detalhes: [Pareamento](/pt-BR/channels/pairing)
- Remetentes apenas com UUID (de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quais grupos ou remetentes podem acionar respostas em grupo quando `allowlist` está definido; entradas podem ser IDs de grupo Signal (brutos, `group:<id>` ou `signal:group:<id>`), números de telefone de remetentes, valores `uuid:<id>` ou `*`.
- `channels.signal.groups["<group-id>" | "*"]` pode sobrescrever o comportamento de grupo com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para substituições por conta em configurações com múltiplas contas.
- Permitir um grupo Signal por meio de `groupAllowFrom` não desativa por si só a exigência de menção. Uma entrada `channels.signal.groups["<group-id>"]` configurada especificamente processa todas as mensagens do grupo, a menos que `requireMention=true` esteja definido.
- Nota de runtime: se `channels.signal` estiver completamente ausente, o runtime volta para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

## Como funciona (comportamento)

- Modo nativo: `signal-cli` roda como um daemon; o gateway lê eventos via SSE.
- Modo contêiner: o gateway envia via API REST e recebe via WebSocket.
- Mensagens de entrada são normalizadas para o envelope de canal compartilhado.
- Respostas sempre são roteadas de volta para o mesmo número ou grupo.

## Mídia + limites

- Texto de saída é dividido em partes até `channels.signal.textChunkLimit` (padrão 4000).
- Divisão opcional por nova linha: defina `channels.signal.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- Anexos compatíveis (base64 obtido de `signal-cli`).
- Anexos de notas de voz usam o nome de arquivo de `signal-cli` como fallback de MIME quando `contentType` está ausente, para que a transcrição de áudio ainda consiga classificar memorandos de voz AAC.
- Limite padrão de mídia: `channels.signal.mediaMaxMb` (padrão 8).
- Use `channels.signal.ignoreAttachments` para pular o download de mídia.
- O contexto de histórico de grupo usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), com fallback para `messages.groupChat.historyLimit`. Defina `0` para desativar (padrão 50).

## Digitação + recibos de leitura

- **Indicadores de digitação**: o OpenClaw envia sinais de digitação via `signal-cli sendTyping` e os atualiza enquanto uma resposta está em andamento.
- **Recibos de leitura**: quando `channels.signal.sendReadReceipts` é true, o OpenClaw encaminha recibos de leitura para DMs permitidas.
- Signal-cli não expõe recibos de leitura para grupos.

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=signal`.
- Destinos: remetente E.164 ou UUID (use `uuid:<id>` da saída do emparelhamento; UUID sem prefixo também funciona).
- `messageId` é o carimbo de data/hora do Signal para a mensagem à qual você está reagindo.
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
  - `off`/`ack` desabilita reações do agente (a ferramenta de mensagem `react` retornará erro).
  - `minimal`/`extensive` habilita reações do agente e define o nível de orientação.
- Substituições por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Destinos de entrega (CLI/Cron)

- DMs: `signal:+15551234567` (ou E.164 simples).
- DMs por UUID: `uuid:<id>` (ou UUID sem prefixo).
- Grupos: `signal:group:<groupId>`.
- Nomes de usuário: `username:<name>` (se compatível com sua conta do Signal).

## Solução de problemas

Execute esta sequência primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Depois, confirme o estado de emparelhamento de DM, se necessário:

```bash
openclaw pairing list signal
```

Falhas comuns:

- Daemon acessível, mas sem respostas: verifique as configurações da conta/daemon (`httpUrl`, `account`) e o modo de recebimento.
- DMs ignoradas: o remetente está com aprovação de emparelhamento pendente.
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

## Observações de segurança

- `signal-cli` armazena chaves da conta localmente (normalmente em `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta do Signal antes de uma migração ou reconstrução do servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"` a menos que você queira explicitamente um acesso mais amplo a DMs.
- A verificação por SMS só é necessária para fluxos de registro ou recuperação, mas perder o controle do número/conta pode complicar o novo registro.

## Referência de configuração (Signal)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: habilita/desabilita a inicialização do canal.
- `channels.signal.apiMode`: `auto | native | container` (padrão: auto). Consulte [Modo container](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 para a conta do bot.
- `channels.signal.cliPath`: caminho para `signal-cli`.
- `channels.signal.httpUrl`: URL completa do daemon (substitui host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind do daemon (padrão 127.0.0.1:8080).
- `channels.signal.autoStart`: inicia o daemon automaticamente (padrão true se `httpUrl` não estiver definido).
- `channels.signal.startupTimeoutMs`: tempo limite de espera de inicialização em ms (limite 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ignora downloads de anexos.
- `channels.signal.ignoreStories`: ignora stories do daemon.
- `channels.signal.sendReadReceipts`: encaminha confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.signal.allowFrom`: allowlist de DM (E.164 ou `uuid:<id>`). `open` exige `"*"`. O Signal não tem nomes de usuário; use IDs de telefone/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.signal.groupAllowFrom`: allowlist de grupo; aceita IDs de grupo do Signal (bruto, `group:<id>` ou `signal:group:<id>`), números E.164 de remetentes ou valores `uuid:<id>`.
- `channels.signal.groups`: substituições por grupo indexadas pelo ID do grupo do Signal (ou `"*"`). Campos compatíveis: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão por conta de `channels.signal.groups` para configurações com várias contas.
- `channels.signal.historyLimit`: máximo de mensagens de grupo a incluir como contexto (0 desabilita).
- `channels.signal.dmHistoryLimit`: limite de histórico de DM em turnos do usuário. Substituições por usuário: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho do bloco de saída (caracteres).
- `channels.signal.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.signal.mediaMaxMb`: limite de mídia de entrada/saída (MB).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal não é compatível com menções nativas).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
