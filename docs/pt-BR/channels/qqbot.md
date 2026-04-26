---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa configurar as credenciais do bot QQ
    - Você quer suporte do bot QQ para grupos ou chats privados
summary: Configuração, configuração e uso do bot QQ
title: bot QQ
x-i18n:
    generated_at: "2026-04-26T11:24:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

O bot QQ conecta o OpenClaw por meio da API oficial do QQ Bot (gateway WebSocket). O
Plugin oferece suporte a chat privado C2C, @mensagens em grupo e mensagens em canais de guild,
com mídia avançada (imagens, voz, vídeo, arquivos).

Status: Plugin incluído. Mensagens diretas, chats em grupo, canais de guild e
mídia são compatíveis. Reações e threads não são compatíveis.

## Plugin incluído

As versões atuais do OpenClaw incluem o QQ Bot, portanto builds empacotadas normais não precisam
de uma etapa separada de `openclaw plugins install`.

## Configuração

1. Acesse a [QQ Open Platform](https://q.qq.com/) e escaneie o QR code com o
   QQ do seu telefone para registrar / fazer login.
2. Clique em **Create Bot** para criar um novo bot QQ.
3. Encontre **AppID** e **AppSecret** na página de configurações do bot e copie-os.

> O AppSecret não é armazenado em texto simples — se você sair da página sem salvá-lo,
> terá de gerar um novo.

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

- O fallback por variável de ambiente se aplica somente à conta padrão do QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` fornece apenas o
  AppSecret; o AppID já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` também aceita entrada SecretRef, não apenas uma string em texto simples.

### Configuração com várias contas

Execute vários bots QQ em uma única instância do OpenClaw:

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

Adicione um segundo bot pela CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voz (STT / TTS)

O suporte a STT e TTS usa configuração em dois níveis com fallback por prioridade:

| Configuração | Específico do Plugin                                  | Fallback do framework         |
| ------------ | ----------------------------------------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`                                  | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`             |

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

Defina `enabled: false` em qualquer um dos dois para desativar.
Substituições de TTS no nível da conta usam o mesmo formato de `messages.tts` e fazem deep-merge
sobre a configuração global/de canal de TTS.

Anexos de voz recebidos do QQ são expostos aos agentes como metadados de mídia de áudio,
mantendo os arquivos de voz brutos fora de `MediaPaths` genérico. Respostas em texto simples
`[[audio_as_voice]]` sintetizam TTS e enviam uma mensagem de voz nativa do QQ quando o TTS
está configurado.

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
| `qqbot:channel:CHANNEL_ID` | Canal de guild     |

> Cada bot tem seu próprio conjunto de OpenIDs de usuário. Um OpenID recebido pelo Bot A **não pode**
> ser usado para enviar mensagens pelo Bot B.

## Comandos slash

Comandos integrados interceptados antes da fila da IA:

| Comando       | Descrição                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`   | Teste de latência                                                                                              |
| `/bot-version` | Mostra a versão do framework OpenClaw                                                                         |
| `/bot-help`   | Lista todos os comandos                                                                                        |
| `/bot-upgrade` | Mostra o link do guia de atualização do QQBot                                                                 |
| `/bot-logs`   | Exporta logs recentes do gateway como arquivo                                                                  |
| `/bot-approve` | Aprova uma ação pendente do QQ Bot (por exemplo, confirmar um upload C2C ou em grupo) por meio do fluxo nativo. |

Acrescente `?` a qualquer comando para ajuda de uso (por exemplo `/bot-upgrade ?`).

## Arquitetura do motor

O QQ Bot é distribuído como um motor autocontido dentro do Plugin:

- Cada conta possui uma pilha isolada de recursos (conexão WebSocket, cliente de API, cache de token, raiz de armazenamento de mídia) identificada por `appId`. As contas nunca compartilham estado de entrada/saída.
- O logger de várias contas marca linhas de log com a conta proprietária para que os diagnósticos permaneçam separados quando você executa vários bots em um único gateway.
- Caminhos de entrada, saída e bridge do gateway compartilham uma única raiz de payload de mídia em `~/.openclaw/media`, assim uploads, downloads e caches de transcodificação ficam em um único diretório protegido, em vez de uma árvore por subsistema.
- As credenciais podem ser salvas e restauradas como parte de snapshots padrão de credenciais do OpenClaw; o motor reconecta a pilha de recursos de cada conta na restauração sem exigir um novo pareamento por QR code.

## Onboarding por QR code

Como alternativa a colar `AppID:AppSecret` manualmente, o motor oferece um fluxo de onboarding por QR code para vincular um QQ Bot ao OpenClaw:

1. Execute o caminho de configuração do QQ Bot (por exemplo `openclaw channels add --channel qqbot`) e escolha o fluxo por QR code quando solicitado.
2. Escaneie o QR code gerado com o aplicativo do telefone vinculado ao QQ Bot de destino.
3. Aprove o pareamento no telefone. O OpenClaw persiste as credenciais retornadas em `credentials/` no escopo correto da conta.

Prompts de aprovação gerados pelo próprio bot (por exemplo, fluxos “permitir esta ação?” expostos pela API do QQ Bot) aparecem como prompts nativos do OpenClaw que você pode aceitar com `/bot-approve` em vez de responder pelo cliente QQ bruto.

## Solução de problemas

- **O bot responde "gone to Mars":** credenciais não configuradas ou Gateway não iniciado.
- **Nenhuma mensagem recebida:** verifique se `appId` e `clientSecret` estão corretos e se o
  bot está ativado na QQ Open Platform.
- **Autorrespostas repetidas:** o OpenClaw registra índices de referência de saída do QQ como
  autoria do bot e ignora eventos de entrada cujo `msgIdx` atual corresponda à mesma
  conta de bot. Isso evita loops de eco da plataforma, ao mesmo tempo que ainda permite que usuários
  citem ou respondam a mensagens anteriores do bot.
- **A configuração com `--token-file` ainda aparece como não configurada:** `--token-file` define
  apenas o AppSecret. Você ainda precisa de `appId` na configuração ou em `QQBOT_APP_ID`.
- **Mensagens proativas não chegam:** o QQ pode interceptar mensagens iniciadas pelo bot se
  o usuário não tiver interagido recentemente.
- **Voz não foi transcrita:** verifique se o STT está configurado e se o provider está acessível.

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
