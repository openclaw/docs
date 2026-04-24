---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar o Webhook e as credenciais do LINE
    - Você quer opções de mensagem específicas do LINE
summary: Configuração, configuração e uso do Plugin da LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-24T05:41:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

O LINE se conecta ao OpenClaw por meio da LINE Messaging API. O Plugin é executado como um receptor de Webhook
no gateway e usa seu token de acesso do canal + segredo do canal para
autenticação.

Status: Plugin incluído. Mensagens diretas, chats em grupo, mídia, localizações, mensagens Flex,
mensagens de template e respostas rápidas são compatíveis. Reações e threads
não são compatíveis.

## Plugin incluído

O LINE é fornecido como um Plugin incluído nas versões atuais do OpenClaw, então
compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o LINE, instale-o
manualmente:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuração

1. Crie uma conta no LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou escolha) um Provider e adicione um canal da **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** das configurações do canal.
4. Ative **Use webhook** nas configurações da Messaging API.
5. Defina a URL do Webhook para o endpoint do seu gateway (HTTPS obrigatório):

```
https://gateway-host/line/webhook
```

O gateway responde à verificação de Webhook do LINE (GET) e a eventos de entrada (POST).
Se você precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL adequadamente.

Observação de segurança:

- A verificação de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), então o OpenClaw aplica limites rígidos de corpo pré-autenticação e timeout antes da verificação.
- O OpenClaw processa eventos de Webhook a partir dos bytes brutos da solicitação verificada. Valores de `req.body` transformados por middleware upstream são ignorados por segurança de integridade da assinatura.

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

Mensagens diretas usam pairing por padrão. Remetentes desconhecidos recebem um
código de pairing, e suas mensagens são ignoradas até serem aprovadas.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissão e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuário do LINE permitidos para DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuário do LINE permitidos para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Observação de runtime: se `channels.line` estiver completamente ausente, o runtime usa `groupPolicy="allowlist"` como fallback para verificações de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

Os IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos têm esta aparência:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento das mensagens

- O texto é dividido em blocos de até 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em
  cartões Flex quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe blocos completos com uma animação
  de carregamento enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).

## Dados do canal (mensagens avançadas)

Use `channelData.line` para enviar respostas rápidas, localizações, cartões Flex ou mensagens
de template.

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

O LINE oferece suporte a vínculos de conversa do ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat atual do LINE a uma sessão do ACP sem criar uma thread filha.
- Vínculos de ACP configurados e sessões do ACP ativas vinculadas à conversa funcionam no LINE como em outros canais de conversa.

Consulte [agentes ACP](/pt-BR/tools/acp-agents) para mais detalhes.

## Mídia de saída

O Plugin do LINE oferece suporte ao envio de arquivos de imagem, vídeo e áudio pela ferramenta de mensagens do agente. A mídia é enviada pelo caminho de entrega específico do LINE com tratamento apropriado de pré-visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem do LINE com geração automática de pré-visualização.
- **Vídeos**: enviados com tratamento explícito de pré-visualização e content-type.
- **Áudio**: enviado como mensagens de áudio do LINE.

As URLs de mídia de saída devem ser URLs HTTPS públicas. O OpenClaw valida o nome de host de destino antes de entregar a URL ao LINE e rejeita destinos de loopback, link-local e rede privada.

Envios de mídia genéricos recorrem à rota existente apenas para imagens quando um caminho específico do LINE não está disponível.

## Solução de problemas

- **A verificação do Webhook falha:** verifique se a URL do Webhook usa HTTPS e se o
  `channelSecret` corresponde ao do console do LINE.
- **Nenhum evento de entrada:** confirme se o caminho do Webhook corresponde a `channels.line.webhookPath`
  e se o gateway está acessível a partir do LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o
  limite padrão.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
