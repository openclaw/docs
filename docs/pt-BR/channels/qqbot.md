---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa configurar as credenciais do QQ Bot
    - Você quer suporte a chats em grupo ou privados do QQ Bot
summary: Configuração, ajustes e uso do QQ Bot
title: bot do QQ
x-i18n:
    generated_at: "2026-07-11T23:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

O QQ Bot se conecta ao OpenClaw pela API oficial do QQ Bot (Gateway WebSocket).
Os principais tipos de conversa são o chat privado C2C e as menções `@` em grupos, com
mídia avançada (imagens, voz, vídeo e arquivos). Mensagens em canais de guilda são
compatíveis apenas com texto e imagens por URL remota; voz, vídeo, uploads de arquivos
e imagens locais/Base64 não estão disponíveis em canais de guilda. Reações e threads
não são compatíveis em nenhum contexto.

Status: Plugin oficial disponível para download.

## Instalação

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuração inicial

1. Acesse a [Plataforma Aberta do QQ](https://q.qq.com/) e leia o código QR com o QQ
   no celular para se cadastrar ou entrar.
2. Clique em **Create Bot** para criar um novo bot do QQ.
3. Localize **AppID** e **AppSecret** na página de configurações do bot e copie-os.

<Note>
O AppSecret não é armazenado em texto simples. Se você sair da página sem salvá-lo, terá que gerar um novo.
</Note>

4. Adicione o canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicie o Gateway.

Configuração interativa:

```bash
openclaw channels add
```

O assistente também oferece a vinculação por código QR como alternativa à digitação
manual de AppID/AppSecret: leia o código com o aplicativo do celular associado ao QQ Bot
de destino para concluir a vinculação. O OpenClaw mantém as credenciais retornadas no
escopo de configuração da conta.

## Configuração

Configuração mínima:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variáveis de ambiente da conta padrão (somente a conta de nível superior):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret armazenado em arquivo:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

AppSecret como SecretRef de ambiente:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Observações:

- `openclaw channels add --channel qqbot --token-file ...` define somente o
  AppSecret; `appId` já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` aceita uma string de texto simples, um caminho de arquivo
  (`clientSecretFile`) ou um objeto SecretRef estruturado.
- Strings de marcador legadas `secretref:...` / `secretref-env:...` são rejeitadas
  em `clientSecret`; use um objeto SecretRef estruturado.

### Política de acesso

- `allowFrom` / `groupAllowFrom` restringem quem pode conversar com o bot em contextos
  C2C / de grupo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controlam o modo de aplicação. O padrão de `dmPolicy` passa a ser `allowlist` quando
  `allowFrom` contém uma entrada concreta (sem curinga); caso contrário, é `open`.
  O padrão de `groupPolicy` passa a ser `allowlist` quando `groupAllowFrom` ou
  `allowFrom` contém uma entrada concreta; caso contrário, é `open`.
- Comandos de barra com "Autorização: lista de permissões" exigem uma entrada explícita
  sem curinga em `allowFrom` (ou em `groupAllowFrom` para invocações em grupo),
  independentemente de `dmPolicy` / `groupPolicy` — consulte
  [Comandos de barra](#slash-commands).

### Configuração com várias contas

Execute vários bots do QQ em uma única instância do OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Cada conta possui uma conexão WebSocket, um cliente de API e um cache de tokens
isolados, identificados por `appId`. As linhas de log são marcadas com o ID da conta
proprietária para manter os diagnósticos separados quando vários bots são executados
em um único Gateway.

Adicione um segundo bot pela CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Conversas em grupo

O suporte a grupos usa OpenIDs de grupos do QQ, não nomes de exibição. Adicione o bot
a um grupo e, em seguida, mencione-o ou configure o grupo para funcionar sem menção.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` define os padrões para todos os grupos; uma entrada concreta
`groups.GROUP_OPENID` substitui esses padrões para um grupo. Configurações de grupo:

| Campo                 | Padrão           | Descrição                                                                                           |
| --------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Exige uma menção `@` antes de o bot responder.                                                      |
| `commandLevel`        | `all`            | Define quais comandos de barra integrados podem ser executados no grupo (veja a seguir).            |
| `ignoreOtherMentions` | `false`          | Descarta mensagens que mencionem outra pessoa, mas não o bot.                                       |
| `historyLimit`        | `50`             | Mensagens recentes sem menção mantidas como contexto para o próximo turno com menção. `0` desativa o histórico. |
| `tools`               | —                | Permite/bloqueia ferramentas para todo o grupo.                                                     |
| `toolsBySender`       | —                | Substituições de ferramentas por remetente; consulte [Grupos](/pt-BR/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefixo do openid | Nome amigável usado nos logs e no contexto do grupo.                                                |
| `prompt`              | padrão integrado | Prompt de comportamento específico do grupo anexado ao contexto do agente.                          |

`commandLevel` aceita:

| Nível    | Comportamento                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Os comandos integrados existentes continuam disponíveis. Alguns permanecem ocultos nos menus, mas usuários autorizados ainda podem executá-los no grupo. |
| `safety` | `/help`, `/btw`, `/stop` permanecem visíveis no grupo; comandos confidenciais (`/config`, `/tools`, `/bash` etc.) devem ser executados no chat privado. |
| `strict` | Somente os controles da sessão de grupo necessários para operação estrita são permitidos. `/stop` continua funcionando para que um remetente autorizado possa interromper uma execução ativa. |

As entradas antigas `toolPolicy` do QQBot foram descontinuadas. Execute `openclaw doctor --fix` para migrá-las para `tools`.

Os modos de ativação são `mention` e `always`. `requireMention: true` corresponde a
`mention`; `requireMention: false` corresponde a `always`. Uma substituição de ativação
no nível da sessão, quando presente, prevalece sobre a configuração.

A fila de entrada é individual por par. Pares de grupo têm um limite de fila maior
(50, em comparação com 20 para pares diretos), removem mensagens escritas pelo bot
antes das mensagens humanas quando a fila está cheia e combinam sequências de
mensagens normais do grupo em um único turno com atribuição. Comandos de barra são
executados individualmente, independentemente de qualquer lote de combinação.

### Voz (STT / TTS)

O suporte a STT e TTS oferece configuração em dois níveis com fallback por prioridade:

| Configuração | Específica do Plugin                                    | Fallback do framework         |
| ------------ | ------------------------------------------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Defina `enabled: false` em qualquer um deles para desativá-lo. As substituições de TTS
no nível da conta usam o mesmo formato de `messages.tts` e são combinadas recursivamente
sobre a configuração de TTS do canal/global.

As solicitações de STT expiram após 60 segundos por padrão. O STT específico do Plugin
usa a substituição `models.providers.<id>.timeoutSeconds` selecionada. O STT de áudio
do framework usa `tools.media.audio.models[0].timeoutSeconds`, depois
`tools.media.audio.timeoutSeconds` e, por fim, a substituição do provedor selecionado.

Os anexos de voz recebidos do QQ são expostos aos agentes como metadados de mídia de
áudio, enquanto os arquivos brutos de voz são mantidos fora de `MediaPaths` genéricos.
`[[audio_as_voice]]` em uma resposta de texto simples sintetiza TTS e envia uma
mensagem de voz nativa do QQ quando o TTS está configurado.

O comportamento de upload/transcodificação de áudio enviado também pode ser ajustado
com `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descrição          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat em grupo      |
| `qqbot:channel:CHANNEL_ID` | Canal de guilda    |

<Note>
Cada bot tem seu próprio conjunto de OpenIDs de usuários. Um OpenID recebido pelo Bot A **não pode** ser usado para enviar mensagens pelo Bot B.
</Note>

## Comandos de barra

Comandos integrados interceptados antes da fila de IA:

| Comando              | Autorização         | Escopo                | Descrição                                                                         |
| -------------------- | -------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `/bot-ping`          | —                    | qualquer              | Teste de latência                                                                 |
| `/bot-help`          | —                    | qualquer              | Lista todos os comandos                                                           |
| `/bot-me`            | —                    | somente privado       | Mostra o ID de usuário do QQ (openid) do remetente para configurar `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —                    | somente privado       | Mostra a versão do framework OpenClaw e a versão do Plugin                        |
| `/bot-upgrade`       | —                    | somente privado       | Mostra o link do guia de atualização do QQBot                                     |
| `/bot-approve`       | lista de permissões  | somente privado       | Gerencia a configuração de aprovação da execução de comandos (ativada / desativada / sempre / redefinir / status) |
| `/bot-logs`          | lista de permissões  | somente privado       | Exporta os logs recentes do Gateway como arquivo                                  |
| `/bot-clear-storage` | lista de permissões  | somente privado       | Exclui os downloads em cache no diretório de mídia do QQBot                       |
| `/bot-streaming`     | lista de permissões  | somente privado       | Ativa ou desativa respostas por streaming no C2C                                  |
| `/bot-group-allways` | lista de permissões  | somente privado       | Alterna o modo de ativação padrão do grupo (menção obrigatória ou sempre ativo)    |

Acrescente `?` a qualquer comando para obter ajuda de uso (por exemplo, `/bot-upgrade ?`).

Os comandos com "Autorização: lista de permissões" também exigem o openid do remetente
em uma lista `allowFrom` explícita e sem curinga (`groupAllowFrom` tem precedência para
comandos emitidos em grupos, com fallback para `allowFrom`). Um curinga
`allowFrom: ["*"]` permite conversar, mas não executar esses comandos. Executar um
deles fora do chat privado ou sem autorização retorna uma orientação, em vez de
descartar silenciosamente a mensagem.

`/bot-me`, `/bot-version` e `/bot-upgrade` são exclusivos de chats privados, mas não
exigem a lista de permissões — qualquer remetente C2C pode executá-los.

Quando as aprovações de execução do QQ Bot usam o fallback padrão para o mesmo chat, os
cliques nos botões nativos de aprovação seguem a mesma lista explícita de permissões de
comandos sem curingas. Para conceder acesso somente a aprovações, sem acesso mais amplo
a comandos, configure `channels.qqbot.execApprovals.approvers`. As aprovações nativas de
execução são habilitadas por padrão.

## Mídia e armazenamento

- As mídias de entrada, saída e da ponte do Gateway compartilham uma única raiz de payloads em
  `~/.openclaw/media/qqbot` (respeitando `OPENCLAW_HOME` quando definido), para que uploads,
  downloads e caches de transcodificação permaneçam em um único diretório protegido.
- A entrega de mídia avançada para destinos C2C e de grupo passa por um único caminho `sendMedia`.
  Arquivos locais e buffers em memória de 5&nbsp;MiB ou mais usam os endpoints de upload
  em partes do QQ; payloads menores e origens de URL remota/Base64 usam a API de upload
  em uma única operação.
- Se uma atualização a quente interromper o Gateway antes que ele termine de gravar
  `openclaw.json`, o Plugin restaura o último `appId` / `clientSecret` conhecido
  dessa conta a partir de um snapshot interno na próxima inicialização (sem nunca
  sobrescrever uma alteração intencional na configuração), portanto não é necessário
  escanear novamente o código QR.

## Solução de problemas

- **O Gateway não inicia / não há mensagens de entrada:** verifique se `appId` e
  `clientSecret` estão corretos e se o bot está habilitado na QQ Open Platform.
  Uma credencial ausente é indicada como "QQBot não configurado (appId ou
  clientSecret ausente)".
- **A configuração com `--token-file` ainda aparece como não configurada:** `--token-file` apenas
  define o AppSecret. `appId` ainda precisa ser definido na configuração ou em `QQBOT_APP_ID`.
- **Respostas em rajadas nos grupos entram em conflito:** quando a fila de um par fica cheia,
  a fila de entrada remove mensagens enviadas pelo bot antes das mensagens humanas e agrupa
  rajadas de mensagens normais (que não são comandos) do grupo em um único turno com atribuição,
  portanto uma enxurrada de mensagens de bots não deve impedir o processamento das mensagens humanas.
- **Mensagens proativas não chegam:** o QQ pode bloquear mensagens iniciadas pelo bot se
  o usuário não tiver interagido recentemente.
- **A voz não é transcrita:** verifique se o STT está configurado e se o provedor
  está acessível.

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
