---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar o Webhook e as credenciais do LINE
    - Você quer opções de mensagem específicas do LINE
summary: Configuração, definição e uso do plugin da API de Mensagens do LINE
title: LINE
x-i18n:
    generated_at: "2026-07-12T14:57:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

O LINE se conecta ao OpenClaw pela LINE Messaging API. O plugin funciona como um receptor de Webhook
no Gateway e usa o token de acesso do canal + o segredo do canal para
autenticação.

Status: plugin oficial, instalado separadamente. Há suporte a mensagens diretas, conversas em grupo, mídia,
localizações, mensagens Flex, mensagens de modelo e respostas rápidas.
Não há suporte a reações nem threads.

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

1. Crie uma conta do LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou escolha) um Provider e adicione um canal da **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** das configurações do canal.
4. Ative **Use webhook** nas configurações da Messaging API.
5. Defina a URL do Webhook como o endpoint do seu Gateway (HTTPS obrigatório):

```text
https://gateway-host/line/webhook
```

O Gateway responde à verificação de Webhook do LINE (GET) e confirma imediatamente
os eventos de entrada assinados (POST) após validar a assinatura e o payload; o processamento
pelo agente continua de forma assíncrona.
Se precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL de acordo.

Observações de segurança:

- A verificação de assinatura do LINE depende do corpo (HMAC sobre o corpo bruto), portanto, o OpenClaw aplica um limite estrito de corpo antes da autenticação (64 KB) e um tempo limite de leitura antes da verificação.
- O OpenClaw processa eventos de Webhook a partir dos bytes brutos da solicitação verificada. Valores de `req.body` transformados por middleware upstream são ignorados para preservar a integridade da assinatura.

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

Configuração de mensagens diretas públicas:

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

Variáveis de ambiente (somente para a conta padrão):

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
Os valores de configuração inline têm precedência sobre os arquivos; as variáveis de ambiente são o último fallback para a conta padrão.

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

Por padrão, as mensagens diretas usam pareamento. Remetentes desconhecidos recebem um código de pareamento, e suas
mensagens são ignoradas até que sejam aprovados:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissões e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`)
- `channels.line.allowFrom`: IDs de usuário do LINE permitidos para mensagens diretas; `dmPolicy: "open"` exige `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (padrão: `allowlist`)
- `channels.line.groupAllowFrom`: IDs de usuário do LINE permitidos para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom` (além de `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Grupos estáticos de acesso de remetentes podem ser referenciados em `allowFrom`, `groupAllowFrom` e no `allowFrom` por grupo com `accessGroup:<name>`; consulte [Grupos de acesso](/pt-BR/channels/access-groups).
- Observação sobre o runtime: se `channels.line` estiver completamente ausente, o runtime usa `groupPolicy="allowlist"` como fallback nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

Os IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos têm o seguinte formato:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento das mensagens

- O texto é dividido em blocos de 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em cartões Flex
  quando possível.
- As respostas em streaming são armazenadas em buffer; o LINE recebe blocos completos com uma animação
  de carregamento enquanto o agente trabalha.
- Os downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão: 10).
- A mídia de entrada é salva em `~/.openclaw/media/inbound/` antes de ser encaminhada
  ao agente, usando o mesmo armazenamento compartilhado de mídia utilizado por plugins de outros canais.

## Dados do canal (mensagens avançadas)

Use `channelData.line` para enviar respostas rápidas, localizações, cartões Flex ou mensagens
de modelo.

```json5
{
  text: "Aqui está",
  channelData: {
    line: {
      quickReplies: ["Status", "Ajuda"],
      location: {
        title: "Escritório",
        address: "Rua Principal, 123",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Cartão de status",
        contents: {/* Payload Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "Prosseguir?",
        confirmLabel: "Sim",
        confirmData: "yes",
        cancelLabel: "Não",
        cancelData: "no",
      },
    },
  },
}
```

O plugin do LINE também inclui um comando `/card` para predefinições de mensagens Flex:

```text
/card info "Boas-vindas" "Agradecemos por participar!"
```

## Suporte a ACP

O LINE oferece suporte a vinculações de conversas do ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula a conversa atual do LINE a uma sessão ACP sem criar uma thread filha.
- As vinculações ACP configuradas e as sessões ACP ativas vinculadas a conversas funcionam no LINE como em outros canais de conversa.

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para obter detalhes.

## Mídia de saída

O plugin do LINE envia imagens, vídeos e áudio pela ferramenta de mensagens do agente:

- **Imagens**: enviadas como mensagens de imagem do LINE; a imagem de pré-visualização usa por padrão a URL da mídia.
- **Vídeos**: exigem uma imagem de pré-visualização; defina `channelData.line.previewImageUrl` como uma URL de imagem.
- **Áudio**: enviado como mensagens de áudio do LINE; a duração padrão é de 60 segundos, a menos que `channelData.line.durationMs` esteja definido.

O tipo de mídia é obtido de `channelData.line.mediaKind` quando definido; caso contrário, é inferido
das outras opções do LINE ou do sufixo de arquivo da URL, usando imagem como fallback.

As URLs de mídia de saída devem ser URLs HTTPS públicas com no máximo 2000 caracteres. O OpenClaw
valida o nome do host de destino antes de encaminhar a URL ao LINE e rejeita destinos de loopback,
link-local e de redes privadas.

Envios genéricos de mídia sem opções específicas do LINE usam a rota de imagem.

## Solução de problemas

- **Falha na verificação do Webhook:** verifique se a URL do Webhook usa HTTPS e se o
  `channelSecret` corresponde ao Console do LINE.
- **Nenhum evento de entrada:** confirme se o caminho do Webhook corresponde a `channels.line.webhookPath`
  e se o Gateway pode ser acessado pelo LINE.
- **Erros no download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o
  limite padrão.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento das conversas em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
