---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa da configuração das credenciais do bot QQ
    - Você quer suporte do bot QQ para grupo ou chat privado
summary: Configuração, configuração e uso do bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-22T04:20:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# Bot QQ

O bot QQ se conecta ao OpenClaw por meio da API oficial do bot QQ (Gateway WebSocket). O
plugin oferece suporte a chat privado C2C, @mensagens em grupo e mensagens em canais de guilda com
mídia avançada (imagens, voz, vídeo, arquivos).

Status: plugin incluído. Mensagens diretas, chats em grupo, canais de guilda e
mídia são compatíveis. Reações e threads não são compatíveis.

## Plugin incluído

As versões atuais do OpenClaw incluem o bot QQ, então compilações empacotadas normais não precisam
de uma etapa separada de `openclaw plugins install`.

## Configuração

1. Acesse a [QQ Open Platform](https://q.qq.com/) e escaneie o código QR com o
   QQ do seu telefone para se registrar / fazer login.
2. Clique em **Create Bot** para criar um novo bot QQ.
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

AppSecret por arquivo:

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

- O fallback por variável de ambiente se aplica somente à conta padrão do bot QQ.
- `openclaw channels add --channel qqbot --token-file ...` fornece apenas o
  AppSecret; o AppID já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` também aceita entrada SecretRef, não apenas uma string em texto simples.

### Configuração com múltiplas contas

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

Cada conta inicia sua própria conexão WebSocket e mantém um cache de token
independente (isolado por `appId`).

Adicione um segundo bot pela CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voz (STT / TTS)

O suporte a STT e TTS usa configuração em dois níveis com fallback por prioridade:

| Configuração | Específica do plugin | Fallback do framework         |
| ------------ | -------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts` | `messages.tts`                |

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
    },
  },
}
```

Defina `enabled: false` em qualquer um deles para desabilitar.

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
> ser usado para enviar mensagens pelo Bot B.

## Comandos slash

Comandos integrados interceptados antes da fila da IA:

| Comando        | Descrição                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Teste de latência                                                                                            |
| `/bot-version` | Mostra a versão do framework OpenClaw                                                                        |
| `/bot-help`    | Lista todos os comandos                                                                                      |
| `/bot-upgrade` | Mostra o link do guia de atualização do QQBot                                                                |
| `/bot-logs`    | Exporta logs recentes do Gateway como arquivo                                                                |
| `/bot-approve` | Aprova uma ação pendente do bot QQ (por exemplo, confirmar um upload C2C ou de grupo) pelo fluxo nativo. |

Acrescente `?` a qualquer comando para ajuda de uso (por exemplo `/bot-upgrade ?`).

## Arquitetura do mecanismo

O bot QQ vem como um mecanismo autônomo dentro do plugin:

- Cada conta possui uma pilha de recursos isolada (conexão WebSocket, cliente de API, cache de token, raiz de armazenamento de mídia) indexada por `appId`. As contas nunca compartilham estado de entrada/saída.
- O logger de múltiplas contas marca as linhas de log com a conta proprietária para que os diagnósticos permaneçam separados quando você executa vários bots em um único Gateway.
- Os caminhos de entrada, saída e ponte do Gateway compartilham uma única raiz de payload de mídia em `~/.openclaw/media`, então uploads, downloads e caches de transcodificação ficam em um único diretório protegido em vez de uma árvore por subsistema.
- As credenciais podem passar por backup e restauração como parte dos snapshots padrão de credenciais do OpenClaw; o mecanismo reconecta a pilha de recursos de cada conta na restauração sem exigir um novo pareamento por código QR.

## Onboarding por código QR

Como alternativa a colar `AppID:AppSecret` manualmente, o mecanismo oferece suporte a um fluxo de onboarding por código QR para vincular um bot QQ ao OpenClaw:

1. Execute o caminho de configuração do bot QQ (por exemplo `openclaw channels add --channel qqbot`) e escolha o fluxo por código QR quando solicitado.
2. Escaneie o código QR gerado com o aplicativo do telefone vinculado ao bot QQ de destino.
3. Aprove o pareamento no telefone. O OpenClaw persiste as credenciais retornadas em `credentials/` no escopo correto da conta.

As solicitações de aprovação geradas pelo próprio bot (por exemplo, fluxos "permitir esta ação?" expostos pela API do bot QQ) aparecem como prompts nativos do OpenClaw que você pode aceitar com `/bot-approve` em vez de responder pelo cliente QQ bruto.

## Solução de problemas

- **O bot responde "gone to Mars":** credenciais não configuradas ou Gateway não iniciado.
- **Nenhuma mensagem de entrada:** verifique se `appId` e `clientSecret` estão corretos e se o
  bot está habilitado na QQ Open Platform.
- **A configuração com `--token-file` ainda aparece como não configurada:** `--token-file` define apenas
  o AppSecret. Você ainda precisa de `appId` na configuração ou de `QQBOT_APP_ID`.
- **Mensagens proativas não chegam:** o QQ pode interceptar mensagens iniciadas pelo bot se
  o usuário não tiver interagido recentemente.
- **A voz não é transcrita:** verifique se o STT está configurado e se o provedor está acessível.
