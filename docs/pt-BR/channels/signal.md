---
read_when:
    - Configurando o suporte ao Signal
    - Depuração do envio/recebimento no Signal
summary: Suporte ao Signal via signal-cli (daemon nativo ou contêiner bbernhard), caminhos de configuração e modelo de numeração
title: Signal
x-i18n:
    generated_at: "2026-07-16T12:12:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal é um plugin de canal para download (`@openclaw/signal`). O Gateway se comunica com `signal-cli` por HTTP: seja pelo daemon nativo (JSON-RPC + SSE) ou pelo contêiner [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). O OpenClaw não incorpora a libsignal.

## O modelo de número (leia isto primeiro)

- O Gateway se conecta a um **dispositivo Signal**: a conta `signal-cli`.
- Executar o bot na **sua conta pessoal do Signal** faz com que ele ignore suas próprias mensagens (proteção contra loops).
- Para "eu envio uma mensagem ao bot e ele responde", use um **número separado para o bot**.

## Instalação

```bash
openclaw plugins install @openclaw/signal
```

Especificações de plugin sem qualificação tentam primeiro o ClawHub e, depois, recorrem ao npm. Force uma origem com `openclaw plugins install clawhub:@openclaw/signal` ou `npm:@openclaw/signal`. `plugins install` registra e ativa o plugin; nenhuma etapa separada de `enable` é necessária. Consulte [Plugins](/pt-BR/tools/plugin) para ver as regras gerais de instalação.

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
    O assistente detecta se `signal-cli` está em `PATH` e, quando ausente, oferece a instalação: baixa a compilação nativa oficial do GraalVM no Linux x86-64 ou instala via Homebrew no macOS e em outras arquiteturas. Em seguida, solicita o número do bot e o caminho de `signal-cli`.

    Para configuração não interativa, `openclaw channels add --channel signal` também aceita `--signal-number <e164>` para o número de telefone do bot, além de `--http-host <host>` e `--http-port <port>` para o endpoint do daemon do Signal (padrão: `127.0.0.1:8080`).

  </Step>
  <Step title="Vincule ou registre a conta">
    - **Vinculação por QR (mais rápida):** `signal-cli link -n "OpenClaw"`; depois, escaneie com o Signal. Consulte o [Caminho A](#setup-path-a-link-existing-signal-account-qr).
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

| Campo        | Descrição                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Número de telefone do bot no formato E.164 (`+15551234567`) |
| `cliPath`    | Caminho para `signal-cli` (`signal-cli` se estiver em `PATH`)  |
| `configPath` | Diretório de configuração do signal-cli passado como `--config`        |
| `dmPolicy`   | Política de acesso a mensagens diretas (`pairing` recomendado)          |
| `allowFrom`  | Números de telefone ou valores de `uuid:<id>` autorizados a enviar mensagens diretas |

Compatibilidade com várias contas: use `channels.signal.accounts` com configuração por conta e `name` opcional. Consulte [Canais com várias contas](/pt-BR/gateway/config-channels#multi-account-all-channels) para ver o padrão compartilhado.

## O que é

- Roteamento determinístico: as respostas sempre retornam ao Signal.
- As mensagens diretas compartilham a sessão principal do agente; os grupos são isolados (`agent:<agentId>:signal:group:<groupId>`).
- Por padrão, o Signal pode gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`). Desative com `channels.signal.configWrites: false`.

## Caminho de configuração A: vincular uma conta existente do Signal (QR)

1. Instale `signal-cli` (compilação JVM ou nativa) ou permita que `openclaw channels add` faça a instalação.
2. Vincule uma conta de bot: `signal-cli link -n "OpenClaw"`; depois, escaneie o código QR no Signal.
3. Configure o Signal e inicie o Gateway.

## Caminho de configuração B: registrar um número dedicado para o bot (SMS, Linux)

Use esta opção para um número dedicado ao bot, em vez de vincular uma conta existente do aplicativo Signal. O fluxo abaixo foi testado no Ubuntu 24.

1. Obtenha um número que possa receber SMS (ou verificação por voz, no caso de telefones fixos). Um número dedicado ao bot evita conflitos de conta/sessão.
2. Instale `signal-cli` no host do Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Se usar a compilação JVM (`signal-cli-${VERSION}.tar.gz`), instale primeiro um JRE. Mantenha `signal-cli` atualizado; o projeto upstream observa que versões antigas podem deixar de funcionar à medida que as APIs do servidor do Signal mudam.

3. Registre e verifique o número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Se for necessário um captcha (é preciso ter acesso a um navegador para concluir esta etapa):

1. Abra `https://signalcaptchas.org/registration/generate.html`.
2. Conclua o captcha e copie o destino do link `signalcaptcha://...` de "Open Signal".
3. Quando possível, execute a partir do mesmo IP externo da sessão do navegador (os tokens de captcha expiram rapidamente).
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

5. Faça o pareamento do remetente da sua mensagem direta:
   - Envie qualquer mensagem ao número do bot.
   - Aprove no servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Salve o número do bot como contato no telefone para evitar "Unknown contact".

<Warning>
Registrar uma conta de número de telefone com `signal-cli` pode remover a autenticação da sessão principal do aplicativo Signal para esse número. Prefira um número dedicado para o bot ou use o modo de vinculação por QR para manter a configuração existente do aplicativo no telefone.
</Warning>

Referências upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Fluxo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Fluxo de vinculação: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Para gerenciar `signal-cli` por conta própria (inicializações a frio lentas da JVM, inicialização do contêiner, CPUs compartilhadas), execute o daemon separadamente e aponte o OpenClaw para ele:

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

Em vez de executar `signal-cli` nativamente, use o contêiner Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), que disponibiliza `signal-cli` por meio de uma interface REST + WebSocket.

Requisitos:

- O contêiner **deve** ser executado com `MODE=json-rpc` para receber mensagens em tempo real.
- Registre ou vincule sua conta do Signal dentro do contêiner antes de conectar o OpenClaw.

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
      apiMode: "container", // ou "auto" para detectar automaticamente
    },
  },
}
```

`apiMode` controla qual protocolo o OpenClaw usa:

| Valor         | Comportamento                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Padrão) Sonda ambos os transportes; o streaming valida o recebimento por WebSocket do contêiner    |
| `"native"`    | Força o signal-cli nativo (JSON-RPC em `/api/v1/rpc`, SSE em `/api/v1/events`)         |
| `"container"` | Força o contêiner bbernhard (REST em `/v2/send`, WebSocket em `/v1/receive/{account}`) |

Quando `apiMode` é `"auto"`, o OpenClaw armazena em cache o modo detectado por 30 segundos para cada URL de daemon, a fim de evitar sondagens repetidas (o modo nativo prevalece quando ambos os transportes estão íntegros). O recebimento pelo contêiner só é selecionado para streaming depois que `/v1/receive/{account}` faz upgrade para WebSocket, o que requer `MODE=json-rpc`.

O modo de contêiner é compatível com as mesmas operações do Signal que o modo nativo quando o contêiner expõe APIs correspondentes: envio, recebimento, anexos, indicadores de digitação, confirmações de leitura/visualização, reações, grupos e texto estilizado. O OpenClaw converte chamadas RPC nativas do Signal nas cargas REST do contêiner, incluindo IDs de grupo `group.{base64(internal_id)}` e `text_mode: "styled"` para texto formatado.

Observações operacionais:

- Use `autoStart: false` com o modo de contêiner; o OpenClaw não deve iniciar um daemon nativo quando `apiMode: "container"` estiver selecionado.
- Use `MODE=json-rpc` para recebimento. `MODE=normal` pode fazer `/v1/about` parecer íntegro, mas `/v1/receive/{account}` não fará upgrade para WebSocket; portanto, o OpenClaw não selecionará o streaming de recebimento pelo contêiner no modo `auto`.
- Defina `apiMode: "container"` quando `httpUrl` apontar para a API REST do bbernhard, `"native"` quando apontar para o JSON-RPC/SSE nativo de `signal-cli` e `"auto"` quando a implantação puder variar.
- Os downloads de anexos no contêiner respeitam os mesmos limites de bytes de mídia do modo nativo. Respostas grandes demais são rejeitadas antes de serem totalmente armazenadas em buffer quando o servidor envia `Content-Length` e, nos demais casos, durante o streaming.

## Controle de acesso (mensagens diretas + grupos)

Mensagens diretas:

- Padrão: `channels.signal.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até a aprovação (os códigos expiram após 1 hora).
- Aprove por meio de `openclaw pairing list signal` e `openclaw pairing approve signal <CODE>`.
- O pareamento é a troca de tokens padrão para mensagens diretas do Signal. Detalhes: [Pareamento](/pt-BR/channels/pairing)
- Remetentes apenas com UUID (de `sourceUuid`) são armazenados como `uuid:<id>` em `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quais grupos ou remetentes podem acionar respostas em grupos quando `allowlist` está definido; as entradas podem ser IDs de grupo do Signal (brutos, `group:<id>` ou `signal:group:<id>`), números de telefone de remetentes, valores de `uuid:<id>` ou `*`.
- `channels.signal.groups["<group-id>" | "*"]` pode substituir o comportamento de grupos com `requireMention`, `tools` e `toolsBySender`.
- Use `channels.signal.accounts.<id>.groups` para substituições por conta em configurações com várias contas.
- Adicionar um grupo do Signal à lista de permissões por meio de `groupAllowFrom` não desativa, por si só, a exigência de menção. Uma entrada `channels.signal.groups["<group-id>"]` configurada especificamente processa todas as mensagens do grupo, a menos que `requireMention=true` esteja definido.
- Com `requireMention=true`, as @menções nativas do Signal são comparadas, usando metadados estruturados de menção, com o telefone ou `accountUuid` da conta do bot. Os `mentionPatterns` configurados continuam sendo uma alternativa baseada em texto simples.
- Observação sobre o runtime: se `channels.signal` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de grupos (mesmo que `channels.defaults.groupPolicy` esteja definido).

Grupo com exigência de menção e contexto limitado:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

As mensagens permitidas do grupo que não mencionam o bot permanecem sem resposta e são mantidas apenas na janela limitada de histórico pendente. Quando uma @menção nativa posterior ou uma menção textual de contingência aciona o bot, o OpenClaw inclui esse contexto recente e responde ao mesmo grupo. Os corpos dos anexos ignorados não são baixados; eles podem aparecer apenas como marcadores compactos de mídia no contexto pendente.

## Como funciona (comportamento)

- Modo nativo: `signal-cli` é executado como daemon; o Gateway lê os eventos via SSE.
- Modo de contêiner: o Gateway envia via API REST e recebe via WebSocket.
- As mensagens recebidas são normalizadas no envelope compartilhado do canal.
- As respostas são sempre encaminhadas de volta ao mesmo número ou grupo.
- As respostas a mensagens recebidas incluem metadados nativos de citação do Signal quando o backend aceita o carimbo de data/hora e o autor da mensagem recebida; se os metadados da citação estiverem ausentes ou forem rejeitados, o OpenClaw enviará a resposta como uma mensagem normal.
- Configure o uso de citações nativas com `channels.signal.replyToMode = off | first | all | batched` ou `channels.signal.replyToModeByChatType.direct/group` para substituições por tipo de conversa. Os valores no nível da conta em `channels.signal.accounts.<id>` têm precedência.

## Mídia + limites

- O texto enviado é dividido em partes de acordo com `channels.signal.textChunkLimit` (padrão: 4000).
- Divisão opcional por nova linha: defina `channels.signal.streaming.chunkMode="newline"` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- Há suporte a anexos (base64 obtido de `signal-cli`).
- Os anexos de notas de voz usam o nome de arquivo `signal-cli` como alternativa para o MIME quando `contentType` está ausente, para que a transcrição de áudio ainda possa classificar memorandos de voz AAC.
- Limite padrão de mídia: `channels.signal.mediaMaxMb` (padrão: 8).
- Use `channels.signal.ignoreAttachments` para ignorar o download de mídia.
- O contexto do histórico do grupo usa `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), com contingência para `messages.groupChat.historyLimit`. Defina `0` para desativá-lo (padrão: 50).

## Indicadores de digitação + confirmações de leitura

- **Indicadores de digitação**: o OpenClaw envia sinais de digitação via `signal-cli sendTyping` e os atualiza enquanto uma resposta está em execução.
- **Confirmações de leitura**: quando `channels.signal.sendReadReceipts` é verdadeiro, o OpenClaw encaminha confirmações de leitura para mensagens diretas permitidas.
- `signal-cli` não disponibiliza confirmações de leitura para grupos.

## Reações de status do ciclo de vida

Defina `messages.statusReactions.enabled: true` para permitir que o Signal mostre o ciclo compartilhado de reações de enfileiramento/raciocínio/ferramenta/Compaction/conclusão/erro nas interações recebidas. O Signal usa o carimbo de data/hora da mensagem recebida como alvo da reação; as reações em grupos são enviadas com o ID do grupo do Signal e o remetente original como autor-alvo.

As reações de status também exigem uma reação de confirmação e um `messages.ackReactionScope` correspondente (`direct`, `group-all`, `group-mentions` ou `all`). Defina `channels.signal.reactionLevel: "off"` para desativar as reações de status do Signal.

`messages.removeAckAfterReply: true` remove a reação de status final após o tempo de retenção configurado. Caso contrário, o Signal restaura a reação de confirmação inicial após o estado final de conclusão/erro.

## Reações (ferramenta de mensagens)

Use `message action=react` com `channel=signal`.

- Alvos: E.164 ou UUID do remetente (use `uuid:<id>` da saída do pareamento; um UUID sem prefixo também funciona).
- `messageId` é o carimbo de data/hora do Signal referente à mensagem à qual você está reagindo.
- As reações em grupos exigem `targetAuthor` ou `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuração:

- `channels.signal.actions.reactions`: ativa/desativa ações de reação (padrão: verdadeiro).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`).
  - `off`/`ack` desativa as reações do agente (a ferramenta de mensagens `react` retorna erros).
  - `minimal`/`extensive` ativa as reações do agente e define o nível de orientação.
- Substituições por conta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reações de aprovação

As solicitações de aprovação de execução e de Plugin no Signal usam os blocos de roteamento de nível superior `approvals.exec` e `approvals.plugin`. O Signal não possui um bloco `channels.signal.execApprovals`.

- `👍` aprova uma vez.
- `👎` nega.
- Use `/approve <id> allow-always` quando uma solicitação oferecer aprovação persistente.

A resolução de reações de aprovação exige aprovadores explícitos do Signal provenientes de `channels.signal.allowFrom`, `channels.signal.defaultTo` ou dos campos correspondentes no nível da conta. As solicitações diretas de aprovação de execução na mesma conversa ainda podem suprimir a contingência local duplicada `/approve` sem aprovadores explícitos; aprovações em grupo sem aprovadores mantêm a contingência local visível.

## Alvos de entrega (CLI/Cron)

- Mensagens diretas: `signal:+15551234567` (ou E.164 sem prefixo).
- Mensagens diretas por UUID: `uuid:<id>` (ou UUID sem prefixo).
- Grupos: `signal:group:<groupId>`.
- Nomes de usuário: `username:<name>` (se forem compatíveis com sua conta do Signal).

## Aliases

Configure aliases para nomes estáveis em alvos recorrentes do Signal. Os aliases são apenas configurações do lado do OpenClaw; eles não criam nem editam contatos do Signal.

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

Use aliases em qualquer lugar que aceite alvos de entrega do Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "A implantação foi concluída"
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

`openclaw directory peers list --channel signal` e `openclaw directory groups list --channel signal` listam os aliases configurados. O diretório do Signal é baseado na configuração; ele não consulta os contatos do Signal em tempo real nem modifica a conta do Signal.

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
- Mensagens diretas ignoradas: o remetente aguarda aprovação de pareamento.
- Mensagens de grupo ignoradas: os controles de remetente/menção do grupo bloqueiam a entrega.
- Erros de validação da configuração após edições: execute `openclaw doctor --fix`.
- Signal ausente dos diagnósticos: confirme `channels.signal.enabled: true`.

Verificações adicionais:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para o fluxo de triagem: [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

## Notas de segurança

- `signal-cli` armazena as chaves da conta localmente (normalmente em `~/.local/share/signal-cli/data/`).
- Faça backup do estado da conta do Signal antes de migrar ou reconstruir o servidor.
- Mantenha `channels.signal.dmPolicy: "pairing"`, a menos que queira explicitamente um acesso mais amplo às mensagens diretas.
- A verificação por SMS é necessária apenas para fluxos de registro ou recuperação, mas perder o controle do número/da conta pode complicar um novo registro.

## Referência de configuração (Signal)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.signal.enabled`: ativa/desativa a inicialização do canal.
- `channels.signal.apiMode`: `auto | native | container` (padrão: automático). Consulte [Modo de contêiner](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 da conta do bot.
- `channels.signal.accountUuid`: UUID opcional da conta do bot para detecção nativa de @menções e proteção contra loops.
- `channels.signal.cliPath`: caminho para `signal-cli`.
- `channels.signal.configPath`: diretório `signal-cli --config` opcional.
- `channels.signal.httpUrl`: URL completa do daemon (substitui host/porta).
- `channels.signal.httpHost`, `channels.signal.httpPort`: endereço de associação do daemon (padrão: `127.0.0.1:8080`).
- `channels.signal.autoStart`: inicia o daemon automaticamente (padrão: verdadeiro se `httpUrl` não estiver definido).
- `channels.signal.startupTimeoutMs`: tempo limite de espera da inicialização em ms (mín. 1000, limite 120000; padrão: 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ignora downloads de anexos.
- `channels.signal.ignoreStories`: ignora stories do daemon.
- `channels.signal.sendReadReceipts`: encaminha confirmações de leitura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pareamento).
- `channels.signal.allowFrom`: lista de permissões de mensagens diretas (E.164 ou `uuid:<id>`). `open` exige `"*"`. O Signal não possui nomes de usuário; use IDs de telefone/UUID.
- `channels.signal.aliases`: aliases do lado do OpenClaw para alvos de entrega de mensagens diretas ou grupos.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (padrão: lista de permissões).
- `channels.signal.groupAllowFrom`: lista de permissões de grupos; aceita IDs de grupo do Signal (brutos, `group:<id>` ou `signal:group:<id>`), números E.164 de remetentes ou valores `uuid:<id>`.
- `channels.signal.groups`: substituições por grupo indexadas pelo ID do grupo do Signal (ou `"*"`). Campos compatíveis: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versão por conta de `channels.signal.groups` para configurações com várias contas.
- `channels.signal.accounts.<id>.aliases`: aliases por conta, combinados com os aliases de nível superior.
- `channels.signal.replyToMode`: modo nativo de citação de resposta, `off | first | all | batched` (padrão: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: substituições de citação de resposta nativa por tipo de conversa.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: substituições de citação de resposta por conta.
- `channels.signal.historyLimit`: número máximo de mensagens do grupo a incluir como contexto (0 desativa).
- `channels.signal.dmHistoryLimit`: limite do histórico de mensagens diretas em interações do usuário. Substituições por usuário: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamanho das partes enviadas em caracteres (padrão: 4000).
- `channels.signal.streaming.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.signal.mediaMaxMb`: limite de mídia recebida/enviada em MB (padrão: 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (padrão: `minimal`). Consulte [Reações](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (padrão: `own`) — quando o agente é notificado sobre reações recebidas de outras pessoas.
- `channels.signal.reactionAllowlist`: remetentes cujas reações notificam o agente quando `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: controles de streaming em modo de blocos compartilhados entre canais. Consulte [Streaming](/pt-BR/concepts/streaming).

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (fallback em texto simples; as @menções nativas do Signal são detectadas nos metadados estruturados quando a identidade da conta do bot está configurada).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por mensagem direta e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento dos chats em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
