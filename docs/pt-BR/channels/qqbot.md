---
read_when:
    - Você quer conectar o OpenClaw ao QQ
    - Você precisa configurar as credenciais do QQ Bot
    - Você quer suporte a chats em grupo ou privados do QQ Bot
summary: Configuração e uso do QQ Bot
title: Bot do QQ
x-i18n:
    generated_at: "2026-07-12T14:58:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

O QQ Bot se conecta ao OpenClaw por meio da API oficial do QQ Bot (Gateway WebSocket).
Chat privado C2C e menções com `@` em grupos são os principais tipos de chat, com
mídia avançada (imagens, voz, vídeo e arquivos). Mensagens em canais de guilda são compatíveis
apenas com texto e imagens por URL remota; voz, vídeo, uploads de arquivos e imagens
locais/Base64 não estão disponíveis em canais de guilda. Reações e threads não são
compatíveis em nenhum contexto.

Status: plugin oficial disponível para download.

## Instalação

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuração inicial

1. Acesse a [Plataforma Aberta do QQ](https://q.qq.com/) e escaneie o código QR com o QQ
   do seu celular para se cadastrar / entrar.
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

O assistente também oferece a vinculação por código QR como alternativa à digitação manual
de AppID/AppSecret: escaneie o código com o aplicativo do celular associado ao QQ Bot de destino
para concluir a vinculação. O OpenClaw persiste as credenciais retornadas no escopo de
configuração da conta.

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

- `openclaw channels add --channel qqbot --token-file ...` define somente o AppSecret;
  `appId` já deve estar definido na configuração ou em `QQBOT_APP_ID`.
- `clientSecret` aceita uma string de texto simples, um caminho de arquivo (`clientSecretFile`)
  ou um objeto SecretRef estruturado.
- Strings de marcador legadas `secretref:...` / `secretref-env:...` são rejeitadas em
  `clientSecret`; use um objeto SecretRef estruturado.

### Política de acesso

- `allowFrom` / `groupAllowFrom` controlam quem pode conversar com o bot em contextos
  C2C / de grupo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controlam o modo de aplicação. `dmPolicy` usa `allowlist` por padrão quando
  `allowFrom` contém uma entrada concreta (sem curinga); caso contrário, usa `open`.
  `groupPolicy` usa `allowlist` por padrão quando `groupAllowFrom` ou
  `allowFrom` contém uma entrada concreta; caso contrário, usa `open`.
- Comandos de barra com "Autorização: lista de permissões" exigem uma entrada explícita sem curinga em
  `allowFrom` (ou em `groupAllowFrom` para invocações em grupo), independentemente de
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

Cada conta tem uma conexão WebSocket, um cliente de API e um cache de tokens
isolados, identificados por `appId`. As linhas de log recebem uma marcação com o id da conta
proprietária para que os diagnósticos permaneçam separados ao executar vários bots em um único Gateway.

Adicione um segundo bot pela CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats em grupo

O suporte a grupos usa OpenIDs de grupo do QQ, não nomes de exibição. Adicione o bot a um
grupo e, em seguida, mencione-o ou configure o grupo para funcionar sem uma menção.

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
          name: "Sala de lançamentos",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Mantenha as respostas curtas e operacionais.",
        },
      },
    },
  },
}
```

`groups["*"]` define os padrões para todos os grupos; uma entrada concreta
`groups.GROUP_OPENID` substitui esses padrões para um grupo. Configurações de grupo:

| Campo                 | Padrão           | Descrição                                                                                          |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Exige uma menção com `@` antes que o bot responda.                                                 |
| `commandLevel`        | `all`            | Define quais comandos de barra integrados podem ser executados no grupo (veja abaixo).             |
| `ignoreOtherMentions` | `false`          | Descarta mensagens que mencionam outra pessoa, mas não o bot.                                      |
| `historyLimit`        | `50`             | Mensagens recentes sem menção mantidas como contexto para o próximo turno com menção. `0` desativa o histórico. |
| `tools`               | —                | Permite/bloqueia ferramentas para todo o grupo.                                                    |
| `toolsBySender`       | —                | Substituições de ferramentas por remetente; consulte [Grupos](/pt-BR/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefixo do openid | Rótulo amigável usado nos logs e no contexto do grupo.                                             |
| `prompt`              | padrão integrado | Prompt de comportamento por grupo anexado ao contexto do agente.                                   |

`commandLevel` aceita:

| Nível    | Comportamento                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Os comandos integrados existentes permanecem disponíveis. Alguns continuam ocultos nos menus, mas usuários autorizados ainda podem executá-los no grupo. |
| `safety` | `/help`, `/btw`, `/stop` permanecem visíveis no grupo; comandos sensíveis (`/config`, `/tools`, `/bash` etc.) devem ser executados no chat privado. |
| `strict` | Somente os controles de sessão de grupo necessários para a operação estrita são permitidos. `/stop` ainda funciona para que um remetente autorizado possa interromper uma execução ativa. |

As entradas antigas `toolPolicy` do QQBot foram descontinuadas. Execute `openclaw doctor --fix` para migrá-las para `tools`.

Os modos de ativação são `mention` e `always`. `requireMention: true` corresponde a
`mention`; `requireMention: false` corresponde a `always`. Uma substituição de ativação
no nível da sessão, quando presente, tem precedência sobre a configuração.

A fila de entrada é individual para cada par. Pares de grupo recebem um limite de fila maior (50 contra 20
para pares diretos), removem mensagens escritas pelo bot antes das mensagens humanas quando a fila está cheia
e combinam rajadas de mensagens normais do grupo em um único turno com atribuição. Os comandos de barra
são executados um por vez, independentemente de qualquer lote combinado.

### Voz (STT / TTS)

O suporte a STT e TTS oferece configuração em dois níveis com fallback por prioridade:

| Configuração | Específica do plugin                                     | Fallback do framework         |
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

Defina `enabled: false` em qualquer um deles para desativá-lo. As substituições de TTS no nível da conta
usam o mesmo formato de `messages.tts` e são mescladas recursivamente sobre a configuração de TTS
do canal/global.

As solicitações de STT expiram após 60 segundos por padrão. O STT específico do plugin usa a
substituição `models.providers.<id>.timeoutSeconds` do modelo selecionado. O STT de áudio do framework
usa `tools.media.audio.models[0].timeoutSeconds`, depois
`tools.media.audio.timeoutSeconds` e, por fim, a substituição do provedor selecionado.

Os anexos de voz recebidos do QQ são expostos aos agentes como metadados de mídia de áudio,
mantendo os arquivos de voz brutos fora de `MediaPaths` genéricos. `[[audio_as_voice]]`
em uma resposta de texto simples sintetiza TTS e envia uma mensagem de voz nativa do QQ quando
o TTS está configurado.

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

<Note>
Cada bot tem seu próprio conjunto de OpenIDs de usuários. Um OpenID recebido pelo Bot A **não pode** ser usado para enviar mensagens por meio do Bot B.
</Note>

## Comandos de barra

Comandos integrados interceptados antes da fila de IA:

| Comando              | Autorização         | Escopo              | Descrição                                                                         |
| -------------------- | ------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `/bot-ping`          | —                   | qualquer            | Teste de latência                                                                 |
| `/bot-help`          | —                   | qualquer            | Lista todos os comandos                                                           |
| `/bot-me`            | —                   | somente privado     | Mostra o ID de usuário do QQ (openid) do remetente para configurar `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —                   | somente privado     | Mostra a versão do framework OpenClaw e a versão do plugin                        |
| `/bot-upgrade`       | —                   | somente privado     | Mostra o link do guia de atualização do QQBot                                     |
| `/bot-approve`       | lista de permissões | somente privado     | Gerencia a configuração de aprovação da execução de comandos (ativar / desativar / sempre / redefinir / status) |
| `/bot-logs`          | lista de permissões | somente privado     | Exporta logs recentes do Gateway como um arquivo                                  |
| `/bot-clear-storage` | lista de permissões | somente privado     | Exclui downloads armazenados em cache no diretório de mídia do QQBot              |
| `/bot-streaming`     | lista de permissões | somente privado     | Alterna respostas por streaming em C2C                                            |
| `/bot-group-allways` | lista de permissões | somente privado     | Alterna o modo de ativação padrão do grupo (menção obrigatória ou sempre ativo)    |

Acrescente `?` a qualquer comando para obter ajuda de uso (por exemplo, `/bot-upgrade ?`).

Os comandos com "Autorização: lista de permissões" também exigem que o openid do remetente esteja em uma
lista `allowFrom` explícita sem curinga (`groupAllowFrom` tem precedência para
comandos emitidos em grupo, com fallback para `allowFrom`). Um curinga
`allowFrom: ["*"]` permite o chat, mas não esses comandos. Executar um deles
fora do chat privado ou sem autorização retorna uma orientação, em vez de
descartar silenciosamente a mensagem.

`/bot-me`, `/bot-version` e `/bot-upgrade` são exclusivos de conversas privadas, mas não
exigem a lista de permissões — qualquer remetente C2C pode executá-los.

Quando as aprovações de execução do QQ Bot usam o fallback padrão para a mesma conversa, os cliques nos botões
nativos de aprovação seguem a mesma lista explícita de comandos permitidos, sem curingas. Para
conceder acesso somente às aprovações, sem acesso mais amplo aos comandos, configure
`channels.qqbot.execApprovals.approvers`. As aprovações nativas de execução são habilitadas por
padrão.

## Mídia e armazenamento

- As mídias de entrada, saída e da ponte do Gateway compartilham uma única raiz de payload em
  `~/.openclaw/media/qqbot` (respeitando `OPENCLAW_HOME` quando definido), para que uploads,
  downloads e caches de transcodificação permaneçam em um único diretório protegido.
- A entrega de mídia avançada para destinos C2C e de grupo passa por um único caminho `sendMedia`.
  Arquivos locais e buffers em memória de 5&nbsp;MiB ou mais usam os endpoints de
  upload em partes do QQ; payloads menores e fontes de URL remota/Base64 usam
  a API de upload em uma única operação.
- Se uma atualização a quente interromper o Gateway antes que ele termine de gravar
  `openclaw.json`, o plugin restaura o último `appId` / `clientSecret` conhecido
  dessa conta a partir de um snapshot interno na próxima inicialização (sem nunca
  sobrescrever uma alteração intencional de configuração), portanto não é
  necessário escanear novamente o código QR.

## Solução de problemas

- **O Gateway não inicia / nenhuma mensagem recebida:** verifique se `appId` e
  `clientSecret` estão corretos e se o bot está habilitado na QQ Open Platform.
  A ausência de uma credencial é exibida como "QQBot não configurado (appId ou
  clientSecret ausente)".
- **A configuração com `--token-file` ainda aparece como não configurada:** `--token-file`
  define apenas o AppSecret. `appId` ainda precisa ser definido na configuração ou em
  `QQBOT_APP_ID`.
- **Respostas em rajadas no grupo entram em conflito:** quando a fila de um par fica cheia,
  a fila de entrada descarta mensagens escritas pelo bot antes das mensagens humanas e combina
  rajadas de mensagens normais (que não são comandos) do grupo em uma única interação com
  atribuição, para que um fluxo intenso de mensagens de bots não impeça o processamento de
  mensagens humanas.
- **Mensagens proativas não chegam:** o QQ pode bloquear mensagens iniciadas pelo bot se
  o usuário não tiver interagido recentemente.
- **Áudio não transcrito:** verifique se o STT está configurado e se o provedor está
  acessível.

## Relacionados

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
