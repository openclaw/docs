---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa configurar as credenciais do QQ Bot
    - Você quer suporte a conversas em grupo ou privadas do QQ Bot
summary: Instalação, configuração e uso do QQ Bot
title: bot do QQ
x-i18n:
    generated_at: "2026-04-30T09:38:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot conecta-se ao OpenClaw via a API oficial do QQ Bot (Gateway WebSocket). O
plugin oferece suporte a chat privado C2C, @mensagens em grupo e mensagens de canal de guilda com
mídia avançada (imagens, voz, vídeo, arquivos).

Status: plugin incluído. Mensagens diretas, chats em grupo, canais de guilda e
mídia são compatíveis. Reações e threads não são compatíveis.

## Plugin incluído

As versões atuais do OpenClaw incluem o QQ Bot, portanto builds empacotados normais não precisam de
uma etapa separada `openclaw plugins install`.

## Configuração

1. Acesse a [QQ Open Platform](https://q.qq.com/) e escaneie o código QR com o QQ do seu
   telefone para se registrar / fazer login.
2. Clique em **Create Bot** para criar um novo bot do QQ.
3. Encontre **AppID** e **AppSecret** na página de configurações do bot e copie-os.

> AppSecret não é armazenado em texto simples — se você sair da página sem salvá-lo,
> precisará gerar um novo.

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

Observações:

- O fallback de ambiente se aplica apenas à conta padrão do QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` fornece apenas o
  AppSecret; o AppID já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` também aceita entrada SecretRef, não apenas uma string em texto simples.

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

Cada conta inicia sua própria conexão WebSocket e mantém um cache de token independente
(isolado por `appId`).

Adicione um segundo bot via CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats em grupo

O suporte do QQ Bot a chats em grupo usa OpenIDs de grupo do QQ, não nomes de exibição. Adicione o bot
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

`groups["*"]` define padrões para todos os grupos, e uma entrada concreta
`groups.GROUP_OPENID` substitui esses padrões para um grupo. As configurações de grupo
incluem:

- `requireMention`: exige uma @menção antes de o bot responder. Padrão: `true`.
- `ignoreOtherMentions`: descarta mensagens que mencionam outra pessoa, mas não o bot.
- `historyLimit`: mantém mensagens recentes de grupo sem menção como contexto para o próximo turno mencionado. Defina `0` para desativar.
- `toolPolicy`: `full`, `restricted` ou `none` para ferramentas com escopo de grupo.
- `name`: rótulo amigável usado em logs e no contexto do grupo.
- `prompt`: prompt de comportamento por grupo anexado ao contexto do agente.

Os modos de ativação são `mention` e `always`. `requireMention: true` mapeia para
`mention`; `requireMention: false` mapeia para `always`. Uma substituição de ativação
no nível da sessão, quando presente, tem precedência sobre a configuração.

A fila de entrada é por par. Pares de grupo recebem um limite de fila maior, mantêm mensagens
humanas à frente de conversas geradas por bot quando cheias e mesclam rajadas de mensagens normais
de grupo em um único turno atribuído. Comandos de barra ainda são executados um por um.

### Voz (STT / TTS)

O suporte a STT e TTS usa configuração em dois níveis com fallback por prioridade:

| Configuração | Específica do Plugin                                    | Fallback do framework         |
| ------------ | -------------------------------------------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
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
        qq-main: {
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
Substituições de TTS no nível da conta usam o mesmo formato de `messages.tts` e fazem deep-merge
sobre a configuração de TTS do canal/global.

Anexos de voz recebidos pelo QQ são expostos aos agentes como metadados de mídia de áudio enquanto
mantêm arquivos de voz brutos fora de `MediaPaths` genéricos. Respostas em texto simples
`[[audio_as_voice]]` sintetizam TTS e enviam uma mensagem de voz nativa do QQ quando TTS está
configurado.

O comportamento de upload/transcodificação de áudio de saída também pode ser ajustado com
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descrição          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat em grupo      |
| `qqbot:channel:CHANNEL_ID` | Canal de guilda    |

> Cada bot tem seu próprio conjunto de OpenIDs de usuário. Um OpenID recebido pelo Bot A **não pode**
> ser usado para enviar mensagens via Bot B.

## Comandos de barra

Comandos integrados interceptados antes da fila de IA:

| Comando        | Descrição                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Teste de latência                                                                                       |
| `/bot-version` | Mostra a versão do framework OpenClaw                                                                    |
| `/bot-help`    | Lista todos os comandos                                                                                 |
| `/bot-me`      | Mostra o ID de usuário QQ (openid) do remetente para configuração de `allowFrom`/`groupAllowFrom`        |
| `/bot-upgrade` | Mostra o link do guia de upgrade do QQBot                                                               |
| `/bot-logs`    | Exporta logs recentes do Gateway como arquivo                                                           |
| `/bot-approve` | Aprova uma ação pendente do QQ Bot (por exemplo, confirmar um upload C2C ou de grupo) pelo fluxo nativo. |

Acrescente `?` a qualquer comando para obter ajuda de uso (por exemplo, `/bot-upgrade ?`).

Comandos de administrador (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) funcionam apenas por mensagem direta e exigem o openid do remetente em uma lista explícita `allowFrom` sem curinga. Um curinga `allowFrom: ["*"]` permite chat, mas não concede acesso a comandos de administrador. Mensagens de grupo são comparadas primeiro com `groupAllowFrom` e recorrem a `allowFrom` como fallback. Executar um comando de administrador em um grupo retorna uma dica em vez de descartá-lo silenciosamente.

## Arquitetura do mecanismo

O QQ Bot é enviado como um mecanismo autocontido dentro do plugin:

- Cada conta possui uma pilha de recursos isolada (conexão WebSocket, cliente de API, cache de token, raiz de armazenamento de mídia) identificada por `appId`. As contas nunca compartilham estado de entrada/saída.
- O logger de várias contas marca linhas de log com a conta proprietária para que os diagnósticos permaneçam separáveis quando você executa vários bots em um Gateway.
- Os caminhos de entrada, saída e ponte do Gateway compartilham uma única raiz de payload de mídia em `~/.openclaw/media`, para que uploads, downloads e caches de transcodificação fiquem em um único diretório protegido em vez de uma árvore por subsistema.
- A entrega de mídia avançada passa por um único caminho `sendMedia` para destinos C2C e de grupo. Arquivos locais e buffers acima do limite de arquivo grande usam os endpoints de upload em partes do QQ, enquanto payloads menores usam a API de mídia de envio único.
- Credenciais podem ser incluídas em backup e restauradas como parte dos snapshots de credenciais padrão do OpenClaw; o mecanismo reanexa a pilha de recursos de cada conta na restauração sem exigir um novo par por código QR.

## Integração por código QR

Como alternativa a colar `AppID:AppSecret` manualmente, o mecanismo oferece suporte a um fluxo de integração por código QR para vincular um QQ Bot ao OpenClaw:

1. Execute o caminho de configuração do QQ Bot (por exemplo, `openclaw channels add --channel qqbot`) e escolha o fluxo de código QR quando solicitado.
2. Escaneie o código QR gerado com o aplicativo de telefone vinculado ao QQ Bot de destino.
3. Aprove o pareamento no telefone. O OpenClaw persiste as credenciais retornadas em `credentials/` no escopo correto da conta.

Prompts de aprovação gerados pelo próprio bot (por exemplo, fluxos "permitir esta ação?" expostos pela API do QQ Bot) aparecem como prompts nativos do OpenClaw que você pode aceitar com `/bot-approve` em vez de responder pelo cliente QQ bruto.

## Solução de problemas

- **O bot responde "gone to Mars":** credenciais não configuradas ou Gateway não iniciado.
- **Nenhuma mensagem de entrada:** verifique se `appId` e `clientSecret` estão corretos e se o
  bot está habilitado na QQ Open Platform.
- **Autorrespostas repetidas:** o OpenClaw registra índices de referência de saída do QQ como
  gerados pelo bot e ignora eventos de entrada cujo `msgIdx` atual corresponde à mesma
  conta do bot. Isso evita loops de eco da plataforma enquanto ainda permite que usuários
  citem ou respondam a mensagens anteriores do bot.
- **Configuração com `--token-file` ainda aparece como não configurada:** `--token-file` define apenas
  o AppSecret. Você ainda precisa de `appId` na configuração ou em `QQBOT_APP_ID`.
- **Mensagens proativas não chegam:** o QQ pode interceptar mensagens iniciadas pelo bot se
  o usuário não tiver interagido recentemente.
- **Voz não transcrita:** verifique se STT está configurado e se o provedor está acessível.

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
