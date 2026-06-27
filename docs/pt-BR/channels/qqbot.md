---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa configurar as credenciais do QQ Bot
    - Você quer suporte a chats em grupo ou privados do QQ Bot
summary: Configuração, configuração e uso do bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-06-27T17:12:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot conecta-se ao OpenClaw por meio da API oficial do QQ Bot (Gateway WebSocket). O
plugin oferece suporte a chat privado C2C, @mensagens em grupos e mensagens em canais de guilda com
mídia avançada (imagens, voz, vídeo, arquivos).

Status: plugin baixável. Mensagens diretas, chats em grupo, canais de guilda e
mídia são compatíveis. Reações e threads não são compatíveis.

## Instalação

Instale o QQ Bot antes da configuração:

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuração

1. Acesse a [QQ Open Platform](https://q.qq.com/) e escaneie o código QR com seu
   QQ no celular para registrar-se / fazer login.
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

AppSecret Env SecretRef:

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

- O fallback de ambiente se aplica somente à conta padrão do QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` fornece somente o
  AppSecret; o AppID já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` também aceita entrada SecretRef, não apenas uma string em texto simples.
- Strings de marcador legadas `secretref:/...` não são valores `clientSecret` válidos;
  use objetos SecretRef estruturados como no exemplo acima.

### Configuração de múltiplas contas

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

Adicione um segundo bot via CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats em grupo

O suporte do QQ Bot a chats em grupo usa OpenIDs de grupos do QQ, não nomes de exibição. Adicione o bot
a um grupo e então mencione-o ou configure o grupo para ser executado sem menção.

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

`groups["*"]` define padrões para todos os grupos, e uma entrada concreta
`groups.GROUP_OPENID` substitui esses padrões para um grupo. As configurações de grupo
incluem:

- `requireMention`: exige uma @menção antes que o bot responda. Padrão: `true`.
- `commandLevel`: controla quais comandos slash integrados podem ser executados em grupos.
  Padrão: `all`, que preserva o comportamento de grupo QQBot preexistente quando a
  configuração é omitida.
- `ignoreOtherMentions`: descarta mensagens que mencionam outra pessoa, mas não o bot.
- `historyLimit`: mantém mensagens recentes de grupo sem menção como contexto para o próximo turno mencionado. Defina como `0` para desativar.
- `tools`: permite/nega ferramentas para o grupo inteiro.
- `toolsBySender`: substituições de ferramentas de grupo por remetente; consulte [Grupos](/pt-BR/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: rótulo amigável usado em logs e no contexto do grupo.
- `prompt`: prompt de comportamento por grupo anexado ao contexto do agente.

`commandLevel` aceita:

- `all`: mantém os comandos integrados reconhecidos disponíveis como antes. Alguns comandos podem
  permanecer ocultos nos menus, mas usuários autorizados ainda podem executá-los no grupo.
- `safety`: permite comandos comuns de colaboração, como `/help`, `/btw` e
  `/stop`; peça aos usuários para executar comandos sensíveis, como `/config`, `/tools` e
  `/bash`, em chat privado.
- `strict`: permite somente os controles de sessão de grupo necessários para a operação
  estrita do grupo. `/stop` ainda permanece urgente para que um remetente autorizado possa interromper uma
  execução ativa.

Entradas `toolPolicy` antigas do QQBot foram desativadas. Execute `openclaw doctor --fix` para migrá-las para `tools`.

Os modos de ativação são `mention` e `always`. `requireMention: true` mapeia para
`mention`; `requireMention: false` mapeia para `always`. Uma substituição de ativação
no nível da sessão, quando presente, prevalece sobre a configuração.

A fila de entrada é por par. Pares de grupo recebem um limite de fila maior, mantêm mensagens
humanas à frente de conversas geradas pelo bot quando cheias e mesclam rajadas de mensagens normais
de grupo em um único turno atribuído. Comandos slash ainda são executados um por um.

### Voz (STT / TTS)

O suporte a STT e TTS usa configuração de dois níveis com fallback por prioridade:

| Configuração | Específica do plugin                                      | Fallback do framework         |
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

Defina `enabled: false` em qualquer um deles para desativar.
Substituições de TTS no nível da conta usam o mesmo formato de `messages.tts` e fazem deep-merge
sobre a configuração de TTS do canal/global.

Anexos de voz recebidos do QQ são expostos aos agentes como metadados de mídia de áudio, enquanto
mantêm arquivos de voz brutos fora de `MediaPaths` genéricos. Respostas de texto simples `[[audio_as_voice]]`
sintetizam TTS e enviam uma mensagem de voz nativa do QQ quando TTS está
configurado.

O comportamento de upload/transcodificação de áudio enviado também pode ser ajustado com
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

## Comandos slash

Comandos integrados interceptados antes da fila de IA:

| Comando        | Descrição                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Teste de latência                                                                                          |
| `/bot-version` | Mostra a versão do framework OpenClaw                                                                       |
| `/bot-help`    | Lista todos os comandos                                                                                     |
| `/bot-me`      | Mostra o ID de usuário do QQ do remetente (openid) para configuração de `allowFrom`/`groupAllowFrom`        |
| `/bot-upgrade` | Mostra o link do guia de upgrade do QQBot                                                                   |
| `/bot-logs`    | Exporta logs recentes do gateway como um arquivo                                                            |
| `/bot-approve` | Aprova uma ação pendente do QQ Bot (por exemplo, confirmar um upload C2C ou de grupo) pelo fluxo nativo.    |

Acrescente `?` a qualquer comando para ajuda de uso (por exemplo, `/bot-upgrade ?`).

Comandos de administrador (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) são permitidos apenas em mensagens diretas e exigem o openid do remetente em uma lista `allowFrom` explícita e sem curinga. Um curinga `allowFrom: ["*"]` permite o chat, mas não concede acesso a comandos de administrador. Mensagens de grupo são comparadas primeiro com `groupAllowFrom` e fazem fallback para `allowFrom`. Executar um comando de administrador em um grupo retorna uma dica em vez de descartá-lo silenciosamente.

Quando aprovações de exec do QQ Bot usam o fallback padrão do mesmo chat, cliques em botões
nativos de aprovação seguem a mesma allowlist explícita de comandos sem curinga. Para conceder
acesso somente para aprovação sem acesso mais amplo a comandos, configure
`channels.qqbot.execApprovals.approvers`.

## Arquitetura do mecanismo

QQ Bot é distribuído como um mecanismo autônomo dentro do plugin:

- Cada conta possui uma pilha de recursos isolada (conexão WebSocket, cliente de API, cache de token, raiz de armazenamento de mídia) chaveada por `appId`. Contas nunca compartilham estado de entrada/saída.
- O logger de múltiplas contas marca linhas de log com a conta proprietária para que os diagnósticos permaneçam separáveis quando você executa vários bots em um gateway.
- Caminhos de entrada, saída e ponte do gateway compartilham uma única raiz de payload de mídia em `~/.openclaw/media`, para que uploads, downloads e caches de transcodificação fiquem sob um único diretório protegido em vez de uma árvore por subsistema.
- A entrega de mídia avançada passa por um único caminho `sendMedia` para destinos C2C e de grupo. Arquivos locais e buffers acima do limite de arquivo grande usam os endpoints de upload em partes do QQ, enquanto payloads menores usam a API de mídia de chamada única.
- Credenciais podem ser incluídas em backup e restauradas como parte dos snapshots de credenciais padrão do OpenClaw; o mecanismo reconecta a pilha de recursos de cada conta na restauração sem exigir um novo par de código QR.

## Integração por código QR

Como alternativa a colar `AppID:AppSecret` manualmente, o mecanismo oferece suporte a um fluxo de integração por código QR para vincular um QQ Bot ao OpenClaw:

1. Execute o caminho de configuração do QQ Bot (por exemplo, `openclaw channels add --channel qqbot`) e escolha o fluxo de código QR quando solicitado.
2. Escaneie o código QR gerado com o app de celular vinculado ao QQ Bot de destino.
3. Aprove o pareamento no celular. O OpenClaw persiste as credenciais retornadas em `credentials/` sob o escopo da conta correto.

Prompts de aprovação gerados pelo próprio bot (por exemplo, fluxos "permitir esta ação?" expostos pela API do QQ Bot) aparecem como prompts nativos do OpenClaw que você pode aceitar com `/bot-approve` em vez de responder pelo cliente QQ bruto.

## Solução de problemas

- **Bot responde "gone to Mars":** credenciais não configuradas ou Gateway não iniciado.
- **Nenhuma mensagem de entrada:** verifique se `appId` e `clientSecret` estão corretos e se o
  bot está habilitado na QQ Open Platform.
- **Autorespostas repetidas:** o OpenClaw registra índices de referência de saída do QQ como
  de autoria do bot e ignora eventos de entrada cujo `msgIdx` atual corresponde a essa
  mesma conta do bot. Isso evita loops de eco da plataforma e ainda permite que usuários
  citem ou respondam a mensagens anteriores do bot.
- **A configuração com `--token-file` ainda aparece como não configurada:** `--token-file` define apenas
  o AppSecret. Você ainda precisa de `appId` na configuração ou `QQBOT_APP_ID`.
- **Mensagens proativas não chegam:** o QQ pode interceptar mensagens iniciadas pelo bot se
  o usuário não tiver interagido recentemente.
- **Voz não transcrita:** certifique-se de que o STT esteja configurado e que o provedor esteja acessível.

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
