---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar LINE Webhook + credenciais
    - Você quer opções de mensagem específicas do LINE
summary: Setup, configuração e uso do Plugin da LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE se conecta ao OpenClaw por meio da LINE Messaging API. O Plugin é executado como receptor de Webhook
no Gateway e usa seu channel access token + channel secret para autenticação.

Status: Plugin baixável. Há suporte a mensagens diretas, conversas em grupo, mídia, locais, Flex
messages, template messages e quick replies. Reactions e threads
não são compatíveis.

## Instalar

Instale LINE antes de configurar o canal:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuração

1. Crie uma conta LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou selecione) um Provider e adicione um channel de **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** nas configurações do channel.
4. Ative **Use webhook** nas configurações da Messaging API.
5. Defina o Webhook URL para o endpoint do seu Gateway (HTTPS é obrigatório):

```
https://gateway-host/line/webhook
```

O Gateway responde à verificação de Webhook (GET) do LINE e aceita eventos
inbound assinados (POST) imediatamente após a validação de assinatura e payload; o processamento do agent
continua de forma assíncrona.
Se você precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL de acordo.

Observação de segurança:

- A verificação de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), então o OpenClaw aplica limites estritos de corpo pré-autenticação e timeout antes da verificação.
- O OpenClaw processa eventos de Webhook a partir dos bytes brutos verificados da requisição. Para segurança da integridade da assinatura, valores de `req.body` transformados por middleware upstream são ignorados.

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

Configuração de DM pública:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Variáveis de ambiente (somente conta padrão):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Arquivos de token/secret:

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

Várias contas:

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

Mensagens diretas usam pairing por padrão. Remetentes desconhecidos recebem um código de pairing e suas
mensagens são ignoradas até serem aprovadas.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuário LINE permitidos para DMs; `["*"]` é obrigatório para `dmPolicy: "open"`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuário LINE permitidos para groups
- Substituições por group: `channels.line.groups.<groupId>.allowFrom`
- Grupos estáticos de acesso de remetente podem ser referenciados por `allowFrom`, `groupAllowFrom` e `allowFrom` por group com `accessGroup:<name>`.
- Observação de runtime: se `channels.line` estiver totalmente ausente, o runtime usa fallback para `groupPolicy="allowlist"` nas verificações de group (mesmo que `channels.defaults.groupPolicy` esteja definido).

IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos têm este formato:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento de mensagens

- Textos são divididos em partes de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em Flex
  cards quando possível.
- Respostas em streaming são armazenadas em buffer; enquanto o agent trabalha, o LINE recebe partes completas
  com animação de carregamento.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).
- Mídia inbound é salva em `~/.openclaw/media/inbound/` antes de ser passada ao agent,
  correspondendo ao armazenamento de mídia compartilhado usado por outros plugins de canal
  bundled.

## Dados do canal (mensagens ricas)

Use `channelData.line` para enviar quick replies, locais, Flex cards ou template
messages.

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

O LINE Plugin também disponibiliza o comando `/card` para presets de Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Suporte a ACP

LINE oferece suporte a bindings de conversas ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat LINE atual a uma sessão ACP sem criar uma child thread.
- Bindings ACP configurados e sessões ACP ativas vinculadas a conversas funcionam no LINE como outros canais de conversa.

Consulte [agents ACP](/pt-BR/tools/acp-agents) para detalhes.

## Mídia outbound

O LINE Plugin oferece suporte ao envio de imagens, vídeos e arquivos de áudio por meio da ferramenta de mensagens do agent. A mídia é enviada pelo caminho de entrega específico do LINE com preview apropriado e tratamento de rastreamento:

- **Imagens**: enviadas como mensagens de imagem do LINE com geração automática de preview.
- **Vídeos**: enviados com preview explícito e tratamento de content-type.
- **Áudio**: enviado como mensagens de áudio do LINE.

URLs de mídia outbound devem ser URLs HTTPS públicas. O OpenClaw valida o hostname de destino antes de entregar a URL ao LINE e rejeita destinos loopback, link-local e de rede privada.

Envios genéricos de mídia usam fallback para a rota existente somente de imagem quando o caminho específico do LINE não está disponível.

## Solução de problemas

- **Falha na verificação do Webhook:** verifique se o Webhook URL usa HTTPS e
  se `channelSecret` corresponde ao console LINE.
- **Nenhum evento inbound:** confirme que o caminho do Webhook corresponde a `channels.line.webhookPath`
  e que o Gateway está acessível pelo LINE.
- **Erros de download de mídia:** se a mídia exceder o limite padrão, aumente `channels.line.mediaMaxMb`.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de conversa em grupo e gating de menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
