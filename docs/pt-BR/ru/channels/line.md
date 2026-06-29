---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar o Webhook LINE e as credenciais
    - Você precisa de parâmetros de mensagem específicos do LINE
summary: Instalação, configuração e uso do Plugin da LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE se conecta ao OpenClaw pela LINE Messaging API. O Plugin funciona como receptor de Webhook
no Gateway e usa seu channel access token + channel secret para
autenticação.

Status: Plugin carregável. Há suporte para mensagens privadas, chats em grupo, mídia, localizações, Flex
messages, template messages e respostas rápidas. Reações e threads
não são compatíveis.

## Instalação

Instale LINE antes de configurar o canal:

```bash
openclaw plugins install @openclaw/line
```

Cópia de trabalho local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuração

1. Crie uma conta LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou selecione) um Provider e adicione um canal **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** das configurações do canal.
4. Ative **Use webhook** nas configurações da Messaging API.
5. Defina o URL do Webhook para seu endpoint do Gateway (HTTPS é obrigatório):

```
https://gateway-host/line/webhook
```

O Gateway responde à verificação de Webhook da LINE (GET) e confirma eventos
recebidos assinados (POST) imediatamente após verificar a assinatura e a carga útil; o processamento
pelo agente continua de forma assíncrona.
Se precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize o URL de acordo.

Observação de segurança:

- A verificação de assinatura da LINE depende do corpo da solicitação (HMAC sobre o corpo bruto), portanto, o OpenClaw aplica limites rígidos de tamanho do corpo e timeout antes da autenticação, antes da verificação.
- O OpenClaw processa eventos de Webhook a partir dos bytes brutos verificados da solicitação. Valores `req.body` transformados por middleware anterior na cadeia são ignorados para preservar a integridade da assinatura.

## Configuração

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

Configuração de mensagens privadas abertas:

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

`tokenFile` e `secretFile` devem apontar para arquivos comuns. Links simbólicos são rejeitados.

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

Mensagens privadas exigem pareamento por padrão. Remetentes desconhecidos recebem um código de pareamento, e suas
mensagens são ignoradas até a aprovação.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissão e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuários LINE permitidos para mensagens privadas; `dmPolicy: "open"` exige `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuários LINE permitidos para grupos
- Substituições por grupo individual: `channels.line.groups.<groupId>.allowFrom`
- Grupos estáticos de acesso de remetentes podem ser referenciados em `allowFrom`, `groupAllowFrom` e no `allowFrom` de grupo usando `accessGroup:<name>`.
- Observação sobre runtime: se `channels.line` estiver totalmente ausente, o runtime volta para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

IDs LINE diferenciam maiúsculas de minúsculas. IDs válidos têm este formato:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento das mensagens

- O texto é dividido em fragmentos de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em Flex
  cards quando possível.
- Respostas em streaming são armazenadas em buffer; LINE recebe fragmentos completos com animação de carregamento
  enquanto o agente trabalha.
- O download de mídia é limitado por `channels.line.mediaMaxMb` (padrão 10).
- Mídias recebidas são salvas em `~/.openclaw/media/inbound/` antes de serem passadas
  ao agente, correspondendo ao armazenamento comum de mídia usado por outros Plugin
  de canais integrados.

## Dados do canal (mensagens avançadas)

Use `channelData.line` para enviar respostas rápidas, localizações, Flex cards ou template
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

O Plugin LINE também inclui o comando `/card` para predefinições de Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Suporte a ACP

LINE oferece suporte a vinculações de conversas ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat LINE atual a uma sessão ACP sem criar uma thread filha.
- Vinculações ACP configuradas e sessões ACP ativas vinculadas à conversa funcionam na LINE da mesma forma que em outros canais de conversa.

Consulte [agentes ACP](/pt-BR/tools/acp-agents) para detalhes.

## Mídia de saída

O Plugin LINE oferece suporte ao envio de imagens, vídeos e arquivos de áudio pela ferramenta de mensagens do agente. A mídia é enviada por um caminho de entrega específico da LINE, com tratamento apropriado de pré-visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem LINE com geração automática de pré-visualização.
- **Vídeos**: enviados com tratamento explícito de pré-visualização e tipo de conteúdo.
- **Áudio**: enviado como mensagens de áudio LINE.

URLs de mídia de saída devem ser URLs HTTPS públicos. O OpenClaw verifica o nome do host de destino antes de passar o URL para a LINE e rejeita local loopback, link-local e destinos em redes privadas.

Envios gerais de mídia retornam à rota existente somente para imagens quando o caminho específico da LINE não está disponível.

## Solução de problemas

- **A verificação de Webhook falha:** confirme se o URL do Webhook usa HTTPS e
  se `channelSecret` corresponde ao LINE console.
- **Sem eventos recebidos:** confirme se o caminho do Webhook corresponde a `channels.line.webhookPath`
  e se o Gateway está acessível pela LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder
  o limite padrão.

## Veja também

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens privadas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e restrição por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de proteção
