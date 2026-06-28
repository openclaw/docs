---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar o Webhook LINE e as credenciais
    - Você precisa de parâmetros de mensagem específicos do LINE
summary: Configuração, parametrização e uso do Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE se conecta ao OpenClaw pela LINE Messaging API. O Plugin funciona como receptor de webhook
no gateway e usa seu channel access token + channel secret para
autenticação.

Status: Plugin carregável. Há suporte para mensagens diretas, chats em grupo, mídia, localizações, Flex
messages, template messages e respostas rápidas. Reações e threads
não têm suporte.

## Instalação

Instale o LINE antes de configurar o canal:

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
5. Defina a URL do webhook para o endpoint do seu gateway (HTTPS é obrigatório):

```
https://gateway-host/line/webhook
```

O Gateway responde à verificação de webhook do LINE (GET) e confirma eventos
de entrada assinados (POST) logo após verificar a assinatura e o payload; o processamento
pelo agente continua de forma assíncrona.
Se precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL conforme necessário.

Observação de segurança:

- A verificação de assinatura do LINE depende do corpo da solicitação (HMAC sobre o corpo bruto), portanto o OpenClaw aplica limites rigorosos de tamanho do corpo e timeout pré-autenticação antes da verificação.
- O OpenClaw processa eventos de webhook a partir dos bytes brutos verificados da solicitação. Valores de `req.body` transformados por middleware anterior na cadeia são ignorados para preservar a integridade da assinatura.

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

Configuração de mensagens diretas abertas:

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

`tokenFile` e `secretFile` devem apontar para arquivos normais. Links simbólicos são rejeitados.

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

Mensagens diretas exigem pareamento por padrão. Remetentes desconhecidos recebem um código de pareamento, e suas
mensagens são ignoradas até a aprovação.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissões e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuários LINE permitidos para mensagens diretas; `dmPolicy: "open"` exige `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuários LINE permitidos para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Grupos de acesso estáticos de remetentes podem ser referenciados a partir de `allowFrom`, `groupAllowFrom` e `allowFrom` de grupo usando `accessGroup:<name>`.
- Observação sobre o runtime: se `channels.line` estiver totalmente ausente, o runtime volta para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

IDs LINE diferenciam maiúsculas de minúsculas. IDs válidos têm estes formatos:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento das mensagens

- O texto é dividido em fragmentos de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em Flex
  cards quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe fragmentos completos com animação de carregamento
  enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).
- Mídias recebidas são salvas em `~/.openclaw/media/inbound/` antes de serem passadas
  ao agente, alinhado ao armazenamento comum de mídia usado por outros Plugins
  de canal integrados.

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

O Plugin LINE também vem com o comando `/card` para presets de Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Suporte a ACP

LINE oferece suporte a vinculações de conversas ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat LINE atual a uma sessão ACP sem criar uma thread filha.
- Vinculações ACP configuradas e sessões ACP ativas vinculadas à conversa funcionam no LINE da mesma forma que em outros canais de conversa.

Consulte [agentes ACP](/pt-BR/tools/acp-agents) para detalhes.

## Mídia de saída

O Plugin LINE oferece suporte ao envio de imagens, vídeos e arquivos de áudio pela ferramenta de mensagens do agente. A mídia é enviada pelo caminho de entrega específico do LINE com tratamento adequado de pré-visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem do LINE com geração automática de pré-visualização.
- **Vídeos**: enviados com tratamento explícito de pré-visualização e tipo de conteúdo.
- **Áudio**: enviado como mensagens de áudio do LINE.

URLs de mídia de saída devem ser URLs HTTPS públicas. O OpenClaw valida o nome do host de destino antes de passar a URL ao LINE e rejeita destinos local loopback, link-local e de redes privadas.

Envios genéricos de mídia voltam para a rota existente somente para imagens quando o caminho específico do LINE não está disponível.

## Solução de problemas

- **A verificação de webhook falha:** confirme que a URL do webhook usa HTTPS e
  que `channelSecret` corresponde ao console LINE.
- **Nenhum evento recebido:** confirme que o caminho do webhook corresponde a `channels.line.webhookPath`
  e que o gateway está acessível pelo LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder
  o limite padrão.

## Veja também

- [Visão geral dos canais](/pt-BR/channels) — todos os canais com suporte
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e restrição por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de proteção
