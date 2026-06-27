---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar o Webhook + as credenciais do LINE
    - Você quer opções de mensagem específicas do LINE
summary: Configuração, ajustes e uso do Plugin da LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta ao OpenClaw pela LINE Messaging API. O Plugin roda como um receptor de Webhook
no Gateway e usa seu token de acesso do canal + segredo do canal para
autenticação.

Status: Plugin baixável. Há suporte para mensagens diretas, chats em grupo, mídia, locais, mensagens Flex,
mensagens de modelo e respostas rápidas. Não há suporte para reações e threads.

## Instalação

Instale o LINE antes de configurar o canal:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuração inicial

1. Crie uma conta LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou escolha) um Provider e adicione um canal **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** nas configurações do canal.
4. Ative **Use webhook** nas configurações da Messaging API.
5. Defina a URL do Webhook para o endpoint do seu Gateway (HTTPS obrigatório):

```
https://gateway-host/line/webhook
```

O Gateway responde à verificação de Webhook do LINE (GET) e confirma eventos
de entrada assinados (POST) imediatamente após a validação da assinatura e do payload; o processamento
do agente continua de forma assíncrona.
Se você precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL adequadamente.

Observação de segurança:

- A verificação de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), então o OpenClaw aplica limites rígidos de corpo pré-autenticação e timeout antes da verificação.
- O OpenClaw processa eventos de Webhook a partir dos bytes brutos verificados da solicitação. Valores de `req.body` transformados por middleware upstream são ignorados para segurança da integridade da assinatura.

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

`tokenFile` e `secretFile` devem apontar para arquivos regulares. Links simbólicos são rejeitados.

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
mensagens são ignoradas até serem aprovados.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissões e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuário do LINE na lista de permissões para mensagens diretas; `dmPolicy: "open"` exige `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuário do LINE na lista de permissões para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Grupos estáticos de acesso de remetente podem ser referenciados de `allowFrom`, `groupAllowFrom` e `allowFrom` por grupo com `accessGroup:<name>`.
- Observação de tempo de execução: se `channels.line` estiver completamente ausente, o tempo de execução volta para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos têm este formato:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento de mensagens

- O texto é dividido em blocos de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em cartões Flex
  quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe blocos completos com uma animação
  de carregamento enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).
- Mídia recebida é salva em `~/.openclaw/media/inbound/` antes de ser passada
  ao agente, correspondendo ao armazenamento de mídia compartilhado usado por outros plugins de canal
  incluídos.

## Dados do canal (mensagens ricas)

Use `channelData.line` para enviar respostas rápidas, locais, cartões Flex ou mensagens de
modelo.

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

O LINE oferece suporte a vinculações de conversa do ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat atual do LINE a uma sessão ACP sem criar uma thread filha.
- Vinculações ACP configuradas e sessões ACP ativas vinculadas a conversas funcionam no LINE como em outros canais de conversa.

Consulte [agentes ACP](/pt-BR/tools/acp-agents) para obter detalhes.

## Mídia de saída

O Plugin do LINE oferece suporte ao envio de imagens, vídeos e arquivos de áudio pela ferramenta de mensagem do agente. A mídia é enviada pelo caminho de entrega específico do LINE, com tratamento adequado de pré-visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem do LINE, com geração automática de pré-visualização.
- **Vídeos**: enviados com tratamento explícito de pré-visualização e tipo de conteúdo.
- **Áudio**: enviado como mensagens de áudio do LINE.

URLs de mídia de saída devem ser URLs HTTPS públicas. O OpenClaw valida o nome de host de destino antes de entregar a URL ao LINE e rejeita destinos de loopback, link-local e redes privadas.

Envios genéricos de mídia retornam à rota existente somente para imagens quando um caminho específico do LINE não está disponível.

## Solução de problemas

- **A verificação de Webhook falha:** garanta que a URL do Webhook seja HTTPS e que o
  `channelSecret` corresponda ao console do LINE.
- **Nenhum evento recebido:** confirme que o caminho do Webhook corresponde a `channels.line.webhookPath`
  e que o Gateway está acessível a partir do LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o
  limite padrão.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
