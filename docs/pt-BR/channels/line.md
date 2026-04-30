---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar o Webhook e as credenciais do LINE
    - Você quer opções de mensagem específicas do LINE
summary: Instalação, configuração e uso do Plugin da LINE Messaging API
title: LINHA
x-i18n:
    generated_at: "2026-04-30T09:36:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta ao OpenClaw pela LINE Messaging API. O Plugin é executado como um receptor de Webhook
no Gateway e usa seu token de acesso do canal + segredo do canal para
autenticação.

Status: Plugin incluído. Mensagens diretas, chats em grupo, mídia, localizações, mensagens Flex,
mensagens de modelo e respostas rápidas são compatíveis. Reações e threads
não são compatíveis.

## Plugin incluído

O LINE é distribuído como um Plugin incluído nas versões atuais do OpenClaw, então builds
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui o LINE, instale um
pacote npm atual quando um for publicado:

```bash
openclaw plugins install @openclaw/line
```

Se o npm informar que o pacote de propriedade do OpenClaw está obsoleto ou ausente, use uma
build empacotada atual do OpenClaw ou um checkout local até que a esteira de pacotes npm
alcance.

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuração

1. Crie uma conta do LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou escolha) um Provider e adicione um canal **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** das configurações do canal.
4. Habilite **Use webhook** nas configurações da Messaging API.
5. Defina a URL do Webhook para o endpoint do seu Gateway (HTTPS obrigatório):

```
https://gateway-host/line/webhook
```

O Gateway responde à verificação de Webhook do LINE (GET) e a eventos de entrada (POST).
Se precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL de acordo.

Nota de segurança:

- A verificação de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), então o OpenClaw aplica limites rígidos de corpo pré-autenticação e timeout antes da verificação.
- O OpenClaw processa eventos de Webhook a partir dos bytes brutos verificados da requisição. Valores `req.body` transformados por middleware upstream são ignorados para segurança da integridade da assinatura.

## Configurar

Configuração mínima:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Variáveis de ambiente (somente conta padrão):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Arquivos de token/segredo:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` e `secretFile` devem apontar para arquivos regulares. Symlinks são rejeitados.

Múltiplas contas:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Controle de acesso

Mensagens diretas usam pareamento por padrão. Remetentes desconhecidos recebem um código de pareamento e suas
mensagens são ignoradas até serem aprovadas.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissões e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuário LINE permitidos para DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuário LINE permitidos para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de runtime: se `channels.line` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos se parecem com:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento de mensagens

- O texto é dividido em partes de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em cartões Flex
  quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe partes completas com uma animação
  de carregamento enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).
- Mídia de entrada é salva em `~/.openclaw/media/inbound/` antes de ser passada
  para o agente, correspondendo ao armazenamento de mídia compartilhado usado por outros Plugins de canal
  incluídos.

## Dados do canal (mensagens ricas)

Use `channelData.line` para enviar respostas rápidas, localizações, cartões Flex ou mensagens de modelo.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

O Plugin do LINE também inclui um comando `/card` para predefinições de mensagens Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Suporte a ACP

O LINE oferece suporte a vinculações de conversa ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat LINE atual a uma sessão ACP sem criar uma thread filha.
- Vinculações ACP configuradas e sessões ACP ativas vinculadas a conversas funcionam no LINE como em outros canais de conversa.

Consulte [agentes ACP](/pt-BR/tools/acp-agents) para obter detalhes.

## Mídia de saída

O Plugin do LINE oferece suporte ao envio de imagens, vídeos e arquivos de áudio pela ferramenta de mensagens do agente. A mídia é enviada pelo caminho de entrega específico do LINE com tratamento adequado de pré-visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem do LINE com geração automática de pré-visualização.
- **Vídeos**: enviados com tratamento explícito de pré-visualização e tipo de conteúdo.
- **Áudio**: enviado como mensagens de áudio do LINE.

URLs de mídia de saída devem ser URLs HTTPS públicas. O OpenClaw valida o hostname de destino antes de entregar a URL ao LINE e rejeita destinos local loopback, link-local e de rede privada.

Envios genéricos de mídia recorrem à rota existente somente de imagem quando um caminho específico do LINE não está disponível.

## Solução de problemas

- **A verificação do Webhook falha:** confirme que a URL do Webhook é HTTPS e que o
  `channelSecret` corresponde ao console do LINE.
- **Sem eventos de entrada:** confirme que o caminho do Webhook corresponde a `channels.line.webhookPath`
  e que o Gateway está acessível pelo LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o
  limite padrão.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
