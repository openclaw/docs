---
read_when:
    - Configurando o Synology Chat com o OpenClaw
    - Depuração do roteamento de Webhook do Synology Chat
summary: Configuração de Webhook do Synology Chat e configuração do OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T09:38:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Status: canal de mensagens diretas de Plugin incluído usando webhooks do Synology Chat.
O Plugin aceita mensagens de entrada de webhooks de saída do Synology Chat e envia respostas
por meio de um webhook de entrada do Synology Chat.

## Plugin incluído

O Synology Chat é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto builds
empacotados normais não precisam de uma instalação separada.

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui o Synology Chat,
instale-o manualmente:

Instale a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Verifique se o Plugin do Synology Chat está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente a partir de um checkout do código-fonte com o comando acima.
   - `openclaw onboard` agora mostra o Synology Chat na mesma lista de configuração de canais que `openclaw channels add`.
   - Configuração não interativa: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nas integrações do Synology Chat:
   - Crie um webhook de entrada e copie sua URL.
   - Crie um webhook de saída com seu token secreto.
3. Aponte a URL do webhook de saída para o Gateway do OpenClaw:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Conclua a configuração no OpenClaw.
   - Guiada: `openclaw onboard`
   - Direta: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie o Gateway e envie uma DM para o bot do Synology Chat.

Detalhes de autenticação do webhook:

- O OpenClaw aceita o token do webhook de saída de `body.token`, depois
  `?token=...`, depois dos cabeçalhos.
- Formas de cabeçalho aceitas:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Tokens vazios ou ausentes falham de forma fechada.

Configuração mínima:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variáveis de ambiente

Para a conta padrão, você pode usar variáveis de ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separados por vírgula)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Valores de configuração substituem variáveis de ambiente.

`SYNOLOGY_CHAT_INCOMING_URL` não pode ser definido a partir de um `.env` do workspace; consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Política de DM e controle de acesso

- `dmPolicy: "allowlist"` é o padrão recomendado.
- `allowedUserIds` aceita uma lista (ou string separada por vírgula) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista `allowedUserIds` vazia é tratada como configuração incorreta e a rota do webhook não será iniciada (use `dmPolicy: "open"` com `allowedUserIds: ["*"]` para permitir todos).
- `dmPolicy: "open"` permite DMs públicas somente quando `allowedUserIds` inclui `"*"`; com entradas restritivas, somente usuários correspondentes podem conversar.
- `dmPolicy: "disabled"` bloqueia DMs.
- A vinculação do destinatário da resposta permanece no `user_id` numérico estável por padrão. `channels.synology-chat.dangerouslyAllowNameMatching: true` é um modo de compatibilidade emergencial que reativa a busca por nome de usuário/apelido mutável para entrega de respostas.
- Aprovações de pareamento funcionam com:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Entrega de saída

Use IDs numéricos de usuário do Synology Chat como destinos.

Exemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Envios de mídia são compatíveis por entrega de arquivos baseada em URL.
URLs de arquivos de saída devem usar `http` ou `https`, e destinos de rede privados ou bloqueados de outra forma são rejeitados antes que o OpenClaw encaminhe a URL para o webhook do NAS.

## Múltiplas contas

Várias contas do Synology Chat são compatíveis em `channels.synology-chat.accounts`.
Cada conta pode substituir o token, a URL de entrada, o caminho do webhook, a política de DM e os limites.
Sessões de mensagens diretas são isoladas por conta e usuário, portanto o mesmo `user_id` numérico
em duas contas Synology diferentes não compartilha o estado da transcrição.
Dê a cada conta habilitada um `webhookPath` distinto. O OpenClaw agora rejeita caminhos exatos duplicados
e se recusa a iniciar contas nomeadas que apenas herdam um caminho de webhook compartilhado em configurações com múltiplas contas.
Se você precisar intencionalmente da herança legada para uma conta nomeada, defina
`dangerouslyAllowInheritedWebhookPath: true` nessa conta ou em `channels.synology-chat`,
mas caminhos exatos duplicados ainda são rejeitados de forma fechada. Prefira caminhos explícitos por conta.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Notas de segurança

- Mantenha `token` em segredo e faça rotação se ele vazar.
- Mantenha `allowInsecureSsl: false`, a menos que você confie explicitamente em um certificado local autoassinado do NAS.
- Solicitações de webhook de entrada têm token verificado e limite de taxa por remetente.
- Verificações de token inválido usam comparação de segredo em tempo constante e falham de forma fechada.
- Prefira `dmPolicy: "allowlist"` para produção.
- Mantenha `dangerouslyAllowNameMatching` desativado, a menos que você precise explicitamente da entrega de respostas legada baseada em nome de usuário.
- Mantenha `dangerouslyAllowInheritedWebhookPath` desativado, a menos que você aceite explicitamente o risco de roteamento por caminho compartilhado em uma configuração com múltiplas contas.

## Solução de problemas

- `Missing required fields (token, user_id, text)`:
  - o payload do webhook de saída não contém um dos campos obrigatórios
  - se o Synology enviar o token nos cabeçalhos, garanta que o Gateway/proxy preserve esses cabeçalhos
- `Invalid token`:
  - o segredo do webhook de saída não corresponde a `channels.synology-chat.token`
  - a solicitação está chegando à conta/caminho de webhook errado
  - um proxy reverso removeu o cabeçalho do token antes que a solicitação chegasse ao OpenClaw
- `Rate limit exceeded`:
  - muitas tentativas com token inválido da mesma origem podem bloquear temporariamente essa origem
  - remetentes autenticados também têm um limite separado de taxa de mensagens por usuário
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` está habilitado, mas nenhum usuário está configurado
- `User not authorized`:
  - o `user_id` numérico do remetente não está em `allowedUserIds`

## Relacionados

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
