---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa configurar as credenciais do QQ Bot
    - Você quer suporte a chats em grupo ou privados do QQ Bot
summary: Configuração inicial, configuração e uso do QQ Bot
title: bot do QQ
x-i18n:
    generated_at: "2026-05-04T02:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se conecta ao OpenClaw pela API oficial do QQ Bot (Gateway WebSocket). O
plugin oferece suporte a chat privado C2C, mensagens de grupo com @menções e mensagens
em canais de guilda com mídia avançada (imagens, voz, vídeo, arquivos).

Status: plugin baixável. Mensagens diretas, chats em grupo, canais de guilda e
mídia têm suporte. Reações e threads não têm suporte.

## Instalação

Instale o QQ Bot antes da configuração:

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuração inicial

1. Acesse a [QQ Open Platform](https://q.qq.com/) e escaneie o código QR com o QQ
   do seu telefone para registrar-se / fazer login.
2. Clique em **Create Bot** para criar um novo bot do QQ.
3. Encontre **AppID** e **AppSecret** na página de configurações do bot e copie-os.

> O AppSecret não é armazenado em texto simples — se você sair da página sem salvá-lo,
> terá que gerar um novo.

4. Adicione o canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicie o Gateway.

Caminhos de configuração interativa:

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurar

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

Variáveis de ambiente da conta padrão:

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

AppSecret SecretRef por ambiente:

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

Notas:

- O fallback por ambiente se aplica apenas à conta padrão do QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` fornece apenas o
  AppSecret; o AppID já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` também aceita entrada SecretRef, não apenas uma string em texto simples.
- Strings de marcador `secretref:/...` legadas não são valores `clientSecret` válidos;
  use objetos SecretRef estruturados como no exemplo acima.

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

Cada conta inicia sua própria conexão WebSocket e mantém um cache de token
independente (isolado por `appId`).

Adicione um segundo bot pela CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats em grupo

O suporte do QQ Bot a chats em grupo usa OpenIDs de grupos do QQ, não nomes de exibição. Adicione o bot
a um grupo e então mencione-o ou configure o grupo para executar sem menção.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` define os padrões para todos os grupos, e uma entrada concreta
`groups.GROUP_OPENID` substitui esses padrões para um grupo. As configurações de grupo
incluem:

- `requireMention`: exige uma @menção antes de o bot responder. Padrão: `true`.
- `ignoreOtherMentions`: descarta mensagens que mencionam outra pessoa, mas não o bot.
- `historyLimit`: mantém mensagens recentes de grupo sem menção como contexto para a próxima rodada mencionada. Defina `0` para desativar.
- `toolPolicy`: `full`, `restricted` ou `none` para ferramentas com escopo de grupo.
- `name`: rótulo amigável usado em logs e no contexto do grupo.
- `prompt`: prompt de comportamento por grupo anexado ao contexto do agente.

Os modos de ativação são `mention` e `always`. `requireMention: true` mapeia para
`mention`; `requireMention: false` mapeia para `always`. Uma substituição de ativação
em nível de sessão, quando presente, prevalece sobre a configuração.

A fila de entrada é por par. Pares de grupo recebem um limite de fila maior, mantêm mensagens
humanas à frente de conversas originadas por bot quando cheia e mesclam rajadas de mensagens
normais de grupo em uma única rodada atribuída. Comandos de barra ainda são executados um por um.

### Voz (STT / TTS)

O suporte a STT e TTS usa configuração em dois níveis com fallback por prioridade:

| Configuração | Específica do plugin                                      | Fallback do framework         |
| ------------ | --------------------------------------------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
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

Defina `enabled: false` em qualquer um deles para desativar.
Substituições de TTS em nível de conta usam o mesmo formato que `messages.tts` e fazem mesclagem profunda
sobre a configuração de TTS do canal/global.

Anexos de voz recebidos pelo QQ são expostos aos agentes como metadados de mídia de áudio, enquanto
mantêm arquivos de voz brutos fora de `MediaPaths` genéricos. Respostas em texto simples
`[[audio_as_voice]]` sintetizam TTS e enviam uma mensagem de voz nativa do QQ quando o TTS está
configurado.

O comportamento de upload/transcodificação de áudio de saída também pode ser ajustado com
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descrição           |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Chat privado (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat em grupo       |
| `qqbot:channel:CHANNEL_ID` | Canal de guilda     |

> Cada bot tem seu próprio conjunto de OpenIDs de usuário. Um OpenID recebido pelo Bot A **não pode**
> ser usado para enviar mensagens pelo Bot B.

## Comandos de barra

Comandos integrados interceptados antes da fila de IA:

| Comando        | Descrição                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Teste de latência                                                                                              |
| `/bot-version` | Mostra a versão do framework OpenClaw                                                                          |
| `/bot-help`    | Lista todos os comandos                                                                                        |
| `/bot-me`      | Mostra o ID de usuário QQ do remetente (openid) para configuração de `allowFrom`/`groupAllowFrom`              |
| `/bot-upgrade` | Mostra o link do guia de upgrade do QQBot                                                                      |
| `/bot-logs`    | Exporta logs recentes do gateway como um arquivo                                                               |
| `/bot-approve` | Aprova uma ação pendente do QQ Bot (por exemplo, confirmar um upload C2C ou de grupo) pelo fluxo nativo.       |

Anexe `?` a qualquer comando para ver ajuda de uso (por exemplo, `/bot-upgrade ?`).

Comandos administrativos (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) são exclusivos para mensagens diretas e exigem que o openid do remetente esteja em uma lista `allowFrom` explícita e sem curinga. Um curinga `allowFrom: ["*"]` permite chat, mas não concede acesso a comandos administrativos. Mensagens de grupo são comparadas primeiro com `groupAllowFrom` e fazem fallback para `allowFrom`. Executar um comando administrativo em um grupo retorna uma dica em vez de descartá-lo silenciosamente.

## Arquitetura do mecanismo

O QQ Bot é distribuído como um mecanismo autônomo dentro do plugin:

- Cada conta possui uma pilha de recursos isolada (conexão WebSocket, cliente de API, cache de token, raiz de armazenamento de mídia) identificada por `appId`. Contas nunca compartilham estado de entrada/saída.
- O logger para várias contas marca as linhas de log com a conta proprietária para manter os diagnósticos separáveis quando você executa vários bots em um gateway.
- Os caminhos de entrada, saída e ponte do gateway compartilham uma única raiz de payload de mídia em `~/.openclaw/media`, para que uploads, downloads e caches de transcodificação fiquem em um diretório protegido em vez de uma árvore por subsistema.
- A entrega de mídia avançada passa por um único caminho `sendMedia` para destinos C2C e de grupo. Arquivos locais e buffers acima do limite de arquivos grandes usam os endpoints de upload em partes do QQ, enquanto payloads menores usam a API de mídia em uma única chamada.
- Credenciais podem ser incluídas em backup e restauradas como parte dos snapshots padrão de credenciais do OpenClaw; o mecanismo reconecta a pilha de recursos de cada conta na restauração sem exigir um novo pareamento por código QR.

## Integração por código QR

Como alternativa a colar `AppID:AppSecret` manualmente, o mecanismo oferece suporte a um fluxo de integração por código QR para vincular um QQ Bot ao OpenClaw:

1. Execute o caminho de configuração do QQ Bot (por exemplo, `openclaw channels add --channel qqbot`) e escolha o fluxo por código QR quando solicitado.
2. Escaneie o código QR gerado com o aplicativo de telefone vinculado ao QQ Bot de destino.
3. Aprove o pareamento no telefone. O OpenClaw persiste as credenciais retornadas em `credentials/` no escopo correto da conta.

Prompts de aprovação gerados pelo próprio bot (por exemplo, fluxos "permitir esta ação?" expostos pela API do QQ Bot) aparecem como prompts nativos do OpenClaw que você pode aceitar com `/bot-approve` em vez de responder pelo cliente QQ bruto.

## Solução de problemas

- **O bot responde "gone to Mars":** credenciais não configuradas ou Gateway não iniciado.
- **Sem mensagens de entrada:** verifique se `appId` e `clientSecret` estão corretos, e se o
  bot está habilitado na QQ Open Platform.
- **Autorrespostas repetidas:** o OpenClaw registra índices de referência de saída do QQ como
  originados pelo bot e ignora eventos de entrada cujo `msgIdx` atual corresponde a essa
  mesma conta de bot. Isso evita loops de eco da plataforma, enquanto ainda permite que usuários
  citem ou respondam a mensagens anteriores do bot.
- **Configuração com `--token-file` ainda aparece como não configurada:** `--token-file` define apenas
  o AppSecret. Você ainda precisa de `appId` na configuração ou em `QQBOT_APP_ID`.
- **Mensagens proativas não chegam:** o QQ pode interceptar mensagens iniciadas pelo bot se
  o usuário não interagiu recentemente.
- **Voz não transcrita:** garanta que STT esteja configurado e que o provedor esteja acessível.

## Relacionados

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
