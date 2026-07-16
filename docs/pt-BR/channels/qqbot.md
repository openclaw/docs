---
read_when:
    - Você deseja conectar o OpenClaw ao QQ
    - É necessário configurar as credenciais do QQ Bot
    - Você quer suporte para chats em grupo ou privados do QQ Bot
summary: Configuração, ajustes e uso do QQ Bot
title: bot do QQ
x-i18n:
    generated_at: "2026-07-16T12:14:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta ao OpenClaw pela API oficial do QQ Bot (Gateway WebSocket).
O chat privado C2C e as menções `@` em grupos são os principais tipos de chat, com mídia
avançada (imagens, voz, vídeo, arquivos). Mensagens em canais de guilda são compatíveis apenas com
texto e imagens de URL remota; voz, vídeo, uploads de arquivos e imagens locais/Base64
não estão disponíveis em canais de guilda. Reações e threads não são
compatíveis em nenhum lugar.

Status: plugin oficial disponível para download.

## Instalação

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuração inicial

1. Acesse a [Plataforma Aberta do QQ](https://q.qq.com/) e escaneie o código QR com o
   QQ do celular para se cadastrar / entrar.
2. Clique em **Create Bot** para criar um novo bot do QQ.
3. Encontre **AppID** e **AppSecret** na página de configurações do bot e copie-os.

<Note>
O AppSecret não é armazenado como texto simples. Se você sair da página sem salvá-lo, terá que gerar um novo.
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

O assistente também oferece a vinculação por código QR como alternativa à digitação manual
de AppID/AppSecret: escaneie o código com o aplicativo de celular vinculado ao QQ Bot de destino para concluir
a vinculação. O OpenClaw persiste as credenciais retornadas no escopo de configuração
da conta.

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

Variáveis de ambiente da conta padrão (somente conta de nível superior):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret baseado em arquivo:

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

AppSecret com SecretRef de ambiente:

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

- `openclaw channels add --channel qqbot --token-file ...` define apenas o AppSecret;
  `appId` já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` aceita uma string de texto simples, um caminho de arquivo (`clientSecretFile`)
  ou um objeto SecretRef estruturado.
- Strings de marcador legadas `secretref:...` / `secretref-env:...` são rejeitadas para
  `clientSecret`; use um objeto SecretRef estruturado.

### Transmissão

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // transmissão em blocos: "partial" (padrão) ou "off"
        nativeTransport: true, // usa a API stream_messages C2C oficial do QQ para mensagens diretas
      },
    },
  },
}
```

- `streaming.mode: "off"` desativa a transmissão em blocos para a conta.
- `streaming.nativeTransport: true` transmite respostas C2C (mensagens diretas) pela
  API oficial `stream_messages` do QQ; destinos de grupo/canal não são afetados.
- Valores escalares legados `streaming: true|false` e a chave `streaming.c2cStreamApi`
  migram para esse formato por meio de `openclaw doctor --fix`.
- `/bot-streaming on|off` alterna a mesma configuração a partir de uma mensagem direta.

### Política de acesso

- `allowFrom` / `groupAllowFrom` controlam quem pode conversar com o bot nos contextos C2C /
  de grupo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controlam o modo de aplicação. `dmPolicy` assume `allowlist` por padrão quando
  `allowFrom` tem uma entrada concreta (sem curinga); caso contrário, `open`.
  `groupPolicy` assume `allowlist` por padrão quando `groupAllowFrom` ou
  `allowFrom` tem uma entrada concreta; caso contrário, `open`.
- Os comandos de barra "Auth: allowlist" exigem uma entrada explícita sem curinga em
  `allowFrom` (ou `groupAllowFrom` para invocações em grupo), independentemente de
  `dmPolicy` / `groupPolicy` — consulte [Comandos de barra](#slash-commands).

### Configuração de várias contas

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
isolados, identificados por `appId`. As linhas de log são marcadas com o ID da conta proprietária para que
os diagnósticos permaneçam separados ao executar vários bots em um único Gateway.

Adicione um segundo bot pela CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats em grupo

O suporte a grupos usa OpenIDs de grupo do QQ, não nomes de exibição. Adicione o bot a um
grupo e depois mencione-o ou configure o grupo para funcionar sem menção.

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

`groups["*"]` define os padrões para todos os grupos; uma entrada concreta `groups.GROUP_OPENID`
substitui esses padrões para um grupo. Configurações de grupo:

| Campo                 | Padrão          | Descrição                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Exige uma menção `@` antes de o bot responder.                                                     |
| `commandLevel`        | `all`            | Determina quais comandos de barra integrados podem ser executados no grupo (veja a seguir).                                    |
| `ignoreOtherMentions` | `false`          | Descarta mensagens que mencionem outra pessoa, mas não o bot.                                           |
| `historyLimit`        | `50`             | Mensagens recentes sem menção mantidas como contexto para o próximo turno com menção. `0` desativa o histórico.     |
| `tools`               | —                | Permite/nega ferramentas para todo o grupo.                                                              |
| `toolsBySender`       | —                | Substituições de ferramentas por remetente; consulte [Grupos](/pt-BR/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefixo do openid    | Rótulo amigável usado nos logs e no contexto do grupo.                                                     |
| `prompt`              | padrão integrado | Prompt de comportamento por grupo anexado ao contexto do agente.                                           |

`commandLevel` aceita:

| Nível    | Comportamento                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Os comandos integrados existentes permanecem disponíveis. Alguns ficam ocultos nos menus, mas usuários autorizados ainda podem executá-los no grupo.                  |
| `safety` | `/help`, `/btw`, `/stop` permanecem visíveis no grupo; comandos confidenciais (`/config`, `/tools`, `/bash` etc.) devem ser executados em chat privado.      |
| `strict` | Somente os controles de sessão de grupo necessários para uma operação rigorosa são permitidos. `/stop` continua funcionando para que um remetente autorizado possa interromper uma execução ativa. |

As entradas antigas `toolPolicy` do QQBot foram descontinuadas. Execute `openclaw doctor --fix` para migrá-las para `tools`.

Os modos de ativação são `mention` e `always`. `requireMention: true` corresponde a
`mention`; `requireMention: false` corresponde a `always`. Uma substituição de ativação
no nível da sessão, quando presente, tem precedência sobre a configuração.

A fila de entrada é individual por par. Pares de grupo recebem um limite de fila maior (50 contra 20
para pares diretos), removem mensagens criadas pelo bot antes das mensagens humanas quando a fila está cheia
e combinam sequências de mensagens normais do grupo em um único turno atribuído. Os comandos de barra
são executados um de cada vez, independentemente de qualquer lote combinado.

### Voz (STT / TTS)

O suporte a STT e TTS oferece configuração em dois níveis com fallback por prioridade:

| Configuração | Específica do plugin                                          | Fallback do framework            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Defina `enabled: false` em qualquer um deles para desativá-lo. As substituições de TTS no nível da conta usam o
mesmo formato que `messages.tts` e são mescladas recursivamente sobre a configuração de TTS do canal/global.

As solicitações de STT atingem o tempo limite após 60 segundos por padrão. O STT específico do plugin usa a
substituição `models.providers.<id>.timeoutSeconds` selecionada. O STT de áudio do framework
usa `tools.media.audio.models[0].timeoutSeconds`, depois
`tools.media.audio.timeoutSeconds` e, por fim, a substituição do provedor selecionado.

Os anexos de voz recebidos do QQ são disponibilizados aos agentes como metadados de mídia de áudio,
enquanto os arquivos de voz brutos são mantidos fora do `MediaPaths` genérico. `[[audio_as_voice]]`
em uma resposta de texto simples sintetiza TTS e envia uma mensagem de voz nativa do QQ quando
o TTS está configurado.

O comportamento de upload/transcodificação de áudio de saída também pode ser ajustado com
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                     | Descrição        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat em grupo         |
| `qqbot:channel:CHANNEL_ID` | Canal de guilda      |

<Note>
Cada bot tem seu próprio conjunto de OpenIDs de usuário. Um OpenID recebido pelo Bot A **não pode** ser usado para enviar mensagens pelo Bot B.
</Note>

## Comandos de barra

Comandos integrados interceptados antes da fila de IA:

| Comando              | Autenticação | Escopo          | Descrição                                                                            |
| -------------------- | ------------ | --------------- | ------------------------------------------------------------------------------------ |
| `/bot-ping`          | —            | qualquer        | Teste de latência                                                                    |
| `/bot-help`          | —            | qualquer        | Lista todos os comandos                                                              |
| `/bot-me`            | —            | somente privado | Mostra o ID de usuário do QQ (openid) do remetente para configurar `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —            | somente privado | Mostra a versão do framework OpenClaw e a versão do plugin                           |
| `/bot-upgrade`       | —            | somente privado | Mostra o link do guia de atualização do QQBot                                        |
| `/bot-approve`       | lista de permissões | somente privado | Gerencia a configuração de aprovação da execução de comandos (ativada / desativada / sempre / redefinir / status) |
| `/bot-logs`          | lista de permissões | somente privado | Exporta os logs recentes do Gateway como um arquivo                                  |
| `/bot-clear-storage` | lista de permissões | somente privado | Exclui os downloads armazenados em cache no diretório de mídia do QQBot              |
| `/bot-streaming`     | lista de permissões | somente privado | Alterna as respostas por streaming em C2C                                            |
| `/bot-group-allways` | lista de permissões | somente privado | Alterna o modo padrão de ativação em grupos (menção obrigatória ou sempre ativo)      |

Acrescente `?` a qualquer comando para obter ajuda de uso (por exemplo, `/bot-upgrade ?`).

Os comandos com "Autenticação: lista de permissões" também exigem que o openid do remetente esteja em uma
lista `allowFrom` explícita e sem curinga (`groupAllowFrom` tem precedência para
comandos emitidos em grupos, com fallback para `allowFrom`). Um curinga
`allowFrom: ["*"]` permite conversar, mas não executar esses comandos. A execução de um deles
fora de uma conversa privada ou sem autorização retorna uma orientação, em vez de
descartar silenciosamente a mensagem.

`/bot-me`, `/bot-version` e `/bot-upgrade` são exclusivos de conversas privadas, mas não
exigem a lista de permissões — qualquer remetente C2C pode executá-los.

Quando as aprovações de execução do QQ Bot usam o fallback padrão para a mesma conversa, os cliques nos
botões nativos de aprovação seguem a mesma lista explícita e sem curinga de permissões de comandos. Para
conceder acesso somente a aprovações sem oferecer acesso mais amplo aos comandos, configure
`channels.qqbot.execApprovals.approvers`. As aprovações nativas de execução são habilitadas por
padrão.

## Mídia e armazenamento

- As mídias de entrada, saída e da ponte do Gateway compartilham uma única raiz de payload em
  `~/.openclaw/media/qqbot` (respeitando `OPENCLAW_HOME` quando definido), portanto uploads,
  downloads e caches de transcodificação permanecem em um único diretório protegido.
- A entrega de mídia avançada para destinos C2C e de grupo passa por um único caminho `sendMedia`.
  Arquivos locais e buffers em memória de 5&nbsp;MiB ou mais usam os endpoints
  de upload em partes do QQ; payloads menores e fontes de URL remota/Base64 usam
  a API de upload em uma única operação.
- Se uma atualização a quente interromper o Gateway antes que ele termine de gravar
  `openclaw.json`, o plugin restaurará os últimos `appId` / `clientSecret` conhecidos
  dessa conta a partir de um snapshot interno na próxima inicialização (sem nunca
  sobrescrever uma alteração intencional da configuração), portanto não será
  necessário escanear novamente o código QR.

## Solução de problemas

- **O Gateway não inicia / não há mensagens de entrada:** verifique se `appId` e
  `clientSecret` estão corretos e se o bot está habilitado na QQ Open Platform.
  A ausência de uma credencial é indicada como "QQBot não configurado (appId ou
  clientSecret ausente)".
- **A configuração com `--token-file` ainda aparece como não configurada:** `--token-file` apenas
  define o AppSecret. `appId` ainda precisa ser definido na configuração ou em `QQBOT_APP_ID`.
- **Respostas em rajadas no grupo entram em conflito:** quando a fila de um par fica cheia, a fila de entrada
  descarta mensagens criadas por bots antes das mensagens de pessoas e combina
  rajadas de mensagens normais (que não sejam comandos) do grupo em um único turno atribuído; assim,
  uma enxurrada de mensagens de bots não deve impedir o processamento das mensagens de pessoas.
- **Mensagens proativas não chegam:** o QQ pode bloquear mensagens iniciadas pelo bot se
  o usuário não tiver interagido recentemente.
- **A voz não é transcrita:** verifique se o STT está configurado e se o provedor está
  acessível.

## Relacionado

- [Emparelhamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
