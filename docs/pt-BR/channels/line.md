---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa da configuração do Webhook e das credenciais do LINE
    - Você quer opções de mensagem específicas do LINE
summary: Configuração, configuração e uso do plugin da LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-22T04:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

O LINE se conecta ao OpenClaw por meio da LINE Messaging API. O plugin é executado como um receptor de Webhook
no Gateway e usa seu token de acesso do canal + segredo do canal para
autenticação.

Status: plugin incluído. Mensagens diretas, chats em grupo, mídia, localizações, mensagens Flex,
mensagens de modelo e respostas rápidas são compatíveis. Reações e threads
não são compatíveis.

## Plugin incluído

O LINE vem como um plugin incluído nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

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
2. Crie (ou escolha) um Provider e adicione um canal de **Messaging API**.
3. Copie o **Token de acesso do canal** e o **Segredo do canal** das configurações do canal.
4. Ative **Use webhook** nas configurações da Messaging API.
5. Defina a URL do Webhook para o endpoint do seu Gateway (HTTPS obrigatório):

```
https://gateway-host/line/webhook
```

O Gateway responde à verificação de Webhook do LINE (GET) e aos eventos de entrada (POST).
Se você precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL de acordo.

Observação de segurança:

- A verificação de assinatura do LINE depende do corpo da requisição (HMAC sobre o corpo bruto), portanto o OpenClaw aplica limites rígidos de corpo antes da autenticação e timeout antes da verificação.
- O OpenClaw processa eventos de Webhook a partir dos bytes brutos da requisição verificada. Valores de `req.body` transformados por middleware upstream são ignorados por segurança de integridade da assinatura.

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

Mensagens diretas usam pairing por padrão. Remetentes desconhecidos recebem um código de pairing e suas
mensagens são ignoradas até serem aprovadas.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissões e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuário do LINE permitidos para mensagens diretas
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuário do LINE permitidos para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Observação de runtime: se `channels.line` estiver completamente ausente, o runtime usa `groupPolicy="allowlist"` como fallback para verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

Os IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos se parecem com:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento das mensagens

- O texto é dividido em blocos de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em cartões Flex
  quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe blocos completos com uma animação de carregamento
  enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão: 10).

## Dados do canal (mensagens avançadas)

Use `channelData.line` para enviar respostas rápidas, localizações, cartões Flex ou mensagens
de modelo.

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

O plugin do LINE também inclui um comando `/card` para predefinições de mensagens Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Suporte a ACP

O LINE oferece suporte a vínculos de conversa do ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat atual do LINE a uma sessão ACP sem criar uma thread filha.
- Vínculos ACP configurados e sessões ACP ativas vinculadas à conversa funcionam no LINE como em outros canais de conversa.

Consulte [agentes ACP](/pt-BR/tools/acp-agents) para mais detalhes.

## Mídia de saída

O plugin do LINE oferece suporte ao envio de arquivos de imagem, vídeo e áudio por meio da ferramenta de mensagem do agente. A mídia é enviada pelo caminho de entrega específico do LINE com tratamento apropriado de visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem do LINE com geração automática de visualização.
- **Vídeos**: enviados com visualização explícita e tratamento de tipo de conteúdo.
- **Áudio**: enviado como mensagens de áudio do LINE.

As URLs de mídia de saída devem ser URLs HTTPS públicas. O OpenClaw valida o nome do host de destino antes de entregar a URL ao LINE e rejeita destinos de loopback, link-local e rede privada.

Envios de mídia genéricos usam como fallback a rota existente somente para imagens quando um caminho específico do LINE não está disponível.

## Solução de problemas

- **A verificação do Webhook falha:** verifique se a URL do Webhook usa HTTPS e se o
  `channelSecret` corresponde ao console do LINE.
- **Nenhum evento de entrada:** confirme se o caminho do Webhook corresponde a `channels.line.webhookPath`
  e se o Gateway está acessível a partir do LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o
  limite padrão.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
