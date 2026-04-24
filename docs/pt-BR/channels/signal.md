---
read_when:
    - Configurar o suporte ao Signal
    - Depurar envio/recebimento do Signal
summary: Suporte ao Signal via signal-cli (JSON-RPC + SSE), caminhos de configuração e modelo de número
title: Signal
x-i18n:
    generated_at: "2026-04-24T05:42:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Status: integração externa com CLI. O Gateway se comunica com `signal-cli` por HTTP JSON-RPC + SSE.

## Pré-requisitos

- OpenClaw instalado no seu servidor (o fluxo Linux abaixo foi testado no Ubuntu 24).
- `signal-cli` disponível no host em que o gateway é executado.
- Um número de telefone que possa receber um SMS de verificação (para o caminho de registro por SMS).
- Acesso ao navegador para o captcha do Signal (`signalcaptchas.org`) durante o registro.

## Configuração rápida (iniciante)

1. Use um **número separado do Signal** para o bot (recomendado).
2. Instale `signal-cli` (Java é necessário se você usar a build JVM).
3. Escolha um caminho de configuração:
   - **Caminho A (vínculo por QR):** `signal-cli link -n "OpenClaw"` e escaneie com o Signal.
   - **Caminho B (registro por SMS):** registre um número dedicado com captcha + verificação por SMS.
4. Configure o OpenClaw e reinicie o gateway.
5. Envie a primeira DM e aprove o pareamento (`openclaw pairing approve signal <CODE>`).

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

Referência dos campos:

| Campo       | Descrição                                               |
| ----------- | ------------------------------------------------------- |
| `account`   | Número de telefone do bot no formato E.164 (`+15551234567`) |
| `cliPath`   | Caminho para `signal-cli` (`signal-cli` se estiver no `PATH`) |
| `dmPolicy`  | Política de acesso para DM (`pairing` recomendado)      |
| `allowFrom` | Números de telefone ou valores `uuid:<id>` autorizados para DM |

## O que é

- Canal do Signal via `signal-cli` (não `libsignal` incorporado).
- Roteamento determinístico: as respostas sempre voltam para o Signal.
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

- O gateway se conecta a um **dispositivo Signal** (a conta do `signal-cli`).
- Se você executar o bot na **sua conta pessoal do Signal**, ele ignorará suas próprias mensagens (proteção contra loop).
- Para “eu mando mensagem para o bot e ele responde”, use um **número de bot separado**.

## Caminho de configuração A: vincular uma conta Signal existente (QR)

1. Instale `signal-cli` (build JVM ou nativa).
2. Vincule uma conta de bot:
   - `signal-cli link -n "OpenClaw"` e depois escaneie o QR no Signal.
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

## Caminho de configuração B: registrar um número dedicado para o bot (SMS, Linux)

Use isto quando você quiser um número dedicado para o bot em vez de vincular uma conta existente do app Signal.

1. Obtenha um número que possa receber SMS (ou verificação por voz para linhas fixas).
   - Use um número dedicado para o bot para evitar conflitos de conta/sessão.
2. Instale `signal-cli` no host do gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se você usar a build JVM (`signal-cli-${VERSION}.tar.gz`), instale JRE 25+ antes.
Mantenha `signal-cli` atualizado; o upstream observa que versões antigas podem falhar à medida que as APIs do servidor do Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se captcha for exigido:

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Complete o captcha e copie o destino do link `signalcaptcha://...` em “Open Signal”.
3. Execute a partir do mesmo IP externo da sessão do navegador quando possível.
4. Execute o registro novamente imediatamente (tokens de captcha expiram rápido):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configure o OpenClaw, reinicie o gateway e verifique o canal:

```bash
# Se você executa o gateway como um serviço systemd de usuário:
systemctl --user restart openclaw-gateway.service

# Depois verifique:
openclaw doctor
openclaw channels status --probe
```

5. Faça o pareamento do remetente da sua DM:
   - Envie qualquer mensagem para o número do bot.
   - Aprove o código no servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salve o número do bot como contato no seu telefone para evitar “Unknown contact”.

Importante: registrar uma conta de número de telefone com `signal-cli` pode desautenticar a sessão principal do app Signal para esse número. Prefira um número dedicado para o bot, ou use o modo de vínculo por QR se você precisar manter a configuração existente do app no telefone.

Referências upstream:

- README do `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vínculo: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo daemon externo (`httpUrl`)

Se você quiser gerenciar `signal-cli` por conta própria (cold starts lentos da JVM, init de contêiner ou CPUs compartilhadas), execute o daemon separadamente e aponte o OpenClaw para ele:

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

Isso ignora o auto-spawn e a espera de inicialização dentro do OpenClaw. Para inicializações lentas com auto-spawn, defina `channels.signal.startupTimeoutMs`.

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até aprovação (os códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pareamento é a troca de token padrão para DMs do Signal. Detalhes: [Pareamento](/pt-BR/channels/pairing)
- Remetentes somente com UUID (de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.
- `channels.signal.groups["<group-id>" | "*"]` pode sobrescrever o comportamento do grupo com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para sobrescritas por conta em configurações com múltiplas contas.
- Observação de runtime: se `channels.signal` estiver completamente ausente, o runtime recua para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

## Como funciona (comportamento)

- `signal-cli` é executado como daemon; o gateway lê eventos via SSE.
- Mensagens de entrada são normalizadas no envelope compartilhado de canal.
- As respostas sempre voltam para o mesmo número ou grupo.

## Mídia + limites

- O texto de saída é dividido em blocos conforme `channels.signal.textChunkLimit` (padrão 4000).
- Divisão opcional por nova linha: defina `channels.signal.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- Anexos compatíveis (base64 obtido do `signal-cli`).
- Limite padrão de mídia: `channels.signal.mediaMaxMb` (padrão 8).
- Use `channels.signal.ignoreAttachments` para ignorar o download de mídia.
- O contexto do histórico de grupo usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), com fallback para `messages.groupChat.historyLimit`. Defina `0` para desativar (padrão 50).

## Digitação + confirmações de leitura

- **Indicadores de digitação**: o OpenClaw envia sinais de digitação via `signal-cli sendTyping` e os atualiza enquanto uma resposta está em execução.
- **Confirmações de leitura**: quando `channels.signal.sendReadReceipts` é verdadeiro, o OpenClaw encaminha confirmações de leitura para DMs permitidas.
- O signal-cli não expõe confirmações de leitura para grupos.

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=signal`.
- Alvos: E.164 do remetente ou UUID (use `uuid:<id>` da saída de pareamento; UUID sem prefixo também funciona).
- `messageId` é o timestamp do Signal da mensagem à qual você está reagindo.
- Reações em grupo exigem `targetAuthor` ou `targetAuthorUuid`.

Exemplos:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuração:

- `channels.signal.actions.reactions`: ativa/desativa ações de reação (padrão true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desativa reações do agente (a ferramenta de mensagem `react` retornará erro).
  - `minimal`/`extensive` ativa reações do agente e define o nível de orientação.
- Sobrescritas por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Alvos de entrega (CLI/Cron)

- DMs: `signal:+15551234567` (ou E.164 simples).
- DMs por UUID: `uuid:<id>` (ou UUID sem prefixo).
- Grupos: `signal:group:<groupId>`.
- Nomes de usuário: `username:<name>` (se compatível com sua conta Signal).

## Solução de problemas

Execute esta sequência primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Depois confirme o estado do pareamento de DM, se necessário:

```bash
openclaw pairing list signal
```

Falhas comuns:

- Daemon acessível, mas sem respostas: verifique as configurações de conta/daemon (`httpUrl`, `account`) e o modo de recebimento.
- DMs ignoradas: o remetente está com aprovação de pareamento pendente.
- Mensagens de grupo ignoradas: o remetente do grupo/bloqueio por menção está bloqueando a entrega.
- Erros de validação de configuração após edições: execute `openclaw doctor --fix`.
- Signal ausente no diagnóstico: confirme `channels.signal.enabled: true`.

Verificações extras:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para o fluxo de triagem: [/channels/troubleshooting](/pt-BR/channels/troubleshooting).

## Observações de segurança

- `signal-cli` armazena chaves de conta localmente (geralmente em `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta Signal antes de migrar ou reconstruir o servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"` a menos que você queira explicitamente um acesso mais amplo por DM.
- A verificação por SMS só é necessária para fluxos de registro ou recuperação, mas perder o controle do número/conta pode complicar um novo registro.

## Referência de configuração (Signal)

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: ativa/desativa a inicialização do canal.
- `channels.signal.account`: E.164 da conta do bot.
- `channels.signal.cliPath`: caminho para `signal-cli`.
- `channels.signal.httpUrl`: URL completa do daemon (sobrescreve host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind do daemon (padrão 127.0.0.1:8080).
- `channels.signal.autoStart`: inicia o daemon automaticamente (padrão true se `httpUrl` não estiver definido).
- `channels.signal.startupTimeoutMs`: tempo limite de espera da inicialização em ms (limite máximo de 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ignora downloads de anexos.
- `channels.signal.ignoreStories`: ignora stories do daemon.
- `channels.signal.sendReadReceipts`: encaminha confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.signal.allowFrom`: allowlist de DM (E.164 ou `uuid:<id>`). `open` exige `"*"`. O Signal não tem nomes de usuário; use IDs de telefone/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist).
- `channels.signal.groupAllowFrom`: allowlist de remetentes de grupo.
- `channels.signal.groups`: sobrescritas por grupo, indexadas pelo ID do grupo do Signal (ou `"*"`). Campos compatíveis: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão por conta de `channels.signal.groups` para configurações com múltiplas contas.
- `channels.signal.historyLimit`: máximo de mensagens de grupo a incluir como contexto (0 desativa).
- `channels.signal.dmHistoryLimit`: limite de histórico de DM em turnos do usuário. Sobrescritas por usuário: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho do bloco de saída (caracteres).
- `channels.signal.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.signal.mediaMaxMb`: limite de mídia de entrada/saída (MB).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o Signal não oferece suporte a menções nativas).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
