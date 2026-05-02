---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - É necessário configurar o Webhook do LINE e as credenciais
    - Você quer opções de mensagem específicas do LINE
summary: Instalação, configuração e uso do Plugin da LINE Messaging API
title: LINHA
x-i18n:
    generated_at: "2026-05-02T20:41:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE se conecta ao OpenClaw por meio da LINE Messaging API. O Plugin roda como um receptor de webhook no gateway e usa seu token de acesso do canal + segredo do canal para autenticação.

Status: Plugin disponível para download. Mensagens diretas, chats em grupo, mídia, localizações, mensagens Flex, mensagens de modelo e respostas rápidas são compatíveis. Reações e threads não são compatíveis.

## Instalar

Instale o LINE antes de configurar o canal:

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
2. Crie (ou escolha) um Provedor e adicione um canal **Messaging API**.
3. Copie o **Token de acesso do canal** e o **Segredo do canal** nas configurações do canal.
4. Habilite **Usar webhook** nas configurações da Messaging API.
5. Defina a URL do webhook para o endpoint do seu gateway (HTTPS obrigatório):

```
https://gateway-host/line/webhook
```

O gateway responde à verificação de webhook do LINE (GET) e a eventos de entrada (POST).
Se você precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL adequadamente.

Observação de segurança:

- A verificação de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), então o OpenClaw aplica limites rígidos de corpo antes da autenticação e timeout antes da verificação.
- O OpenClaw processa eventos de webhook a partir dos bytes brutos verificados da solicitação. Valores de `req.body` transformados por middleware upstream são ignorados para segurança da integridade da assinatura.

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

Mensagens diretas usam emparelhamento por padrão. Remetentes desconhecidos recebem um código de emparelhamento e suas
mensagens são ignoradas até a aprovação.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissões e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuários LINE permitidos para DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuários LINE permitidos para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Observação de runtime: se `channels.line` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos têm este formato:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento de mensagens

- O texto é dividido em partes de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em cartões Flex
  quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe partes completas com uma animação de carregamento
  enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).
- Mídia de entrada é salva em `~/.openclaw/media/inbound/` antes de ser passada
  para o agente, correspondendo ao armazenamento de mídia compartilhado usado por outros plugins de canal
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

## Compatibilidade com ACP

O LINE oferece suporte a vínculos de conversas ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat LINE atual a uma sessão ACP sem criar uma thread filha.
- Vínculos ACP configurados e sessões ACP ativas vinculadas a conversas funcionam no LINE como em outros canais de conversa.

Veja [agentes ACP](/pt-BR/tools/acp-agents) para detalhes.

## Mídia de saída

O Plugin do LINE oferece suporte ao envio de imagens, vídeos e arquivos de áudio por meio da ferramenta de mensagens do agente. A mídia é enviada pelo caminho de entrega específico do LINE com tratamento adequado de pré-visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem LINE com geração automática de pré-visualização.
- **Vídeos**: enviados com tratamento explícito de pré-visualização e tipo de conteúdo.
- **Áudio**: enviado como mensagens de áudio LINE.

URLs de mídia de saída devem ser URLs HTTPS públicas. O OpenClaw valida o hostname de destino antes de entregar a URL ao LINE e rejeita destinos local loopback, link-local e de redes privadas.

Envios genéricos de mídia recorrem à rota existente somente para imagens quando um caminho específico do LINE não está disponível.

## Solução de problemas

- **A verificação do webhook falha:** garanta que a URL do webhook use HTTPS e que o
  `channelSecret` corresponda ao console do LINE.
- **Nenhum evento de entrada:** confirme que o caminho do webhook corresponde a `channels.line.webhookPath`
  e que o gateway está acessível pelo LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o
  limite padrão.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço
