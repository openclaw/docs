---
read_when:
    - Configurando o Synology Chat com o OpenClaw
    - Depurando o roteamento de Webhook do Synology Chat
summary: Configuração de Webhook do Synology Chat e configuração do OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T13:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: Plugin integrado de canal de mensagem direta usando Webhooks do Synology Chat.
O Plugin aceita mensagens de entrada de Webhooks de saída do Synology Chat e envia respostas
por meio de um Webhook de entrada do Synology Chat.

## Plugin integrado

O Synology Chat é fornecido como um Plugin integrado nas versões atuais do OpenClaw, então
compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação antiga ou em uma instalação personalizada que exclui o Synology Chat,
instale-o manualmente:

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Verifique se o Plugin do Synology Chat está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente a partir de um checkout do código-fonte com o comando acima.
   - `openclaw onboard` agora mostra o Synology Chat na mesma lista de configuração de canais que `openclaw channels add`.
   - Configuração não interativa: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nas integrações do Synology Chat:
   - Crie um Webhook de entrada e copie sua URL.
   - Crie um Webhook de saída com seu token secreto.
3. Aponte a URL do Webhook de saída para seu Gateway do OpenClaw:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Conclua a configuração no OpenClaw.
   - Guiada: `openclaw onboard`
   - Direta: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie o Gateway e envie uma mensagem direta para o bot do Synology Chat.

Detalhes de autenticação do Webhook:

- O OpenClaw aceita o token do Webhook de saída em `body.token`, depois
  `?token=...`, depois nos cabeçalhos.
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

`SYNOLOGY_CHAT_INCOMING_URL` não pode ser definido a partir de um `.env` do workspace; veja [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Política de DM e controle de acesso

- `dmPolicy: "allowlist"` é o padrão recomendado.
- `allowedUserIds` aceita uma lista (ou string separada por vírgulas) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista vazia em `allowedUserIds` é tratada como configuração incorreta e a rota do Webhook não será iniciada (use `dmPolicy: "open"` para permitir todos).
- `dmPolicy: "open"` permite qualquer remetente.
- `dmPolicy: "disabled"` bloqueia DMs.
- O vínculo do destinatário da resposta permanece, por padrão, no `user_id` numérico estável. `channels.synology-chat.dangerouslyAllowNameMatching: true` é um modo de compatibilidade emergencial que reativa a busca por nome de usuário/apelido mutável para entrega de respostas.
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

Envios de mídia são compatíveis por meio de entrega de arquivo baseada em URL.
As URLs de arquivos de saída devem usar `http` ou `https`, e destinos de rede privados ou bloqueados de outra forma são rejeitados antes que o OpenClaw encaminhe a URL ao Webhook do NAS.

## Múltiplas contas

Várias contas do Synology Chat são compatíveis em `channels.synology-chat.accounts`.
Cada conta pode substituir token, URL de entrada, caminho do Webhook, política de DM e limites.
As sessões de mensagem direta são isoladas por conta e usuário, então o mesmo `user_id` numérico
em duas contas diferentes do Synology não compartilha o estado da transcrição.
Dê a cada conta ativada um `webhookPath` distinto. O OpenClaw agora rejeita caminhos exatos duplicados
e se recusa a iniciar contas nomeadas que apenas herdam um caminho de Webhook compartilhado em configurações com múltiplas contas.
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

## Observações de segurança

- Mantenha `token` em segredo e faça a rotação se ele vazar.
- Mantenha `allowInsecureSsl: false` a menos que você confie explicitamente em um certificado local autoassinado do NAS.
- Solicitações de Webhook de entrada são verificadas por token e limitadas por taxa por remetente.
- Verificações de token inválido usam comparação de segredo em tempo constante e falham de forma fechada.
- Prefira `dmPolicy: "allowlist"` em produção.
- Mantenha `dangerouslyAllowNameMatching` desativado, a menos que você precise explicitamente de entrega de respostas legada baseada em nome de usuário.
- Mantenha `dangerouslyAllowInheritedWebhookPath` desativado, a menos que você aceite explicitamente o risco de roteamento por caminho compartilhado em uma configuração com múltiplas contas.

## Solução de problemas

- `Missing required fields (token, user_id, text)`:
  - falta um dos campos obrigatórios na carga útil do Webhook de saída
  - se o Synology enviar o token nos cabeçalhos, verifique se o Gateway/proxy preserva esses cabeçalhos
- `Invalid token`:
  - o segredo do Webhook de saída não corresponde a `channels.synology-chat.token`
  - a solicitação está chegando à conta/caminho de Webhook errado
  - um proxy reverso removeu o cabeçalho do token antes que a solicitação chegasse ao OpenClaw
- `Rate limit exceeded`:
  - muitas tentativas de token inválido da mesma origem podem bloquear temporariamente essa origem
  - remetentes autenticados também têm um limite de taxa separado por usuário para mensagens
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` está ativado, mas nenhum usuário foi configurado
- `User not authorized`:
  - o `user_id` numérico do remetente não está em `allowedUserIds`

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
